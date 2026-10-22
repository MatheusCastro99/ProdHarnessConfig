'use strict';
// Shared helpers for the harness hooks and scripts (OPTIMIZATION_PLAN.md §6).
// CommonJS with a .cjs extension, so a repo whose package.json sets "type": "module" can't break it.

const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');

class HarnessError extends Error {}

// Every message a hook or script prints starts with this tag (F12).
const tag = (who, msg) => `[harness ${who}] ${msg}`;

function repoRoot(cwd = process.cwd()) {
  if (process.env.CLAUDE_PROJECT_DIR) return process.env.CLAUDE_PROJECT_DIR;
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd, encoding: 'utf8' }).trim();
  } catch {
    throw new HarnessError('not inside a git repository');
  }
}

const workDir = root => path.join(root, '.claude', 'work');

// --- harness.json ---------------------------------------------------------------

const isStrArray = a => Array.isArray(a) && a.every(s => typeof s === 'string' && s.length > 0);

function validateCommand(c, where) {
  if (!c || typeof c !== 'object' || !isStrArray(c.run) || c.run.length === 0)
    throw new HarnessError(`${where}: each command is { "run": ["program", "arg", ...], "cwd"?: "dir", "timeoutSec"?: n }`);
  if (c.cwd !== undefined && typeof c.cwd !== 'string') throw new HarnessError(`${where}.cwd must be a string`);
  if (c.timeoutSec !== undefined && !(Number.isFinite(c.timeoutSec) && c.timeoutSec > 0))
    throw new HarnessError(`${where}.timeoutSec must be a positive number`);
}

function validateConfig(cfg) {
  if (!cfg || typeof cfg !== 'object') throw new HarnessError('harness.json must hold an object');
  if (typeof cfg.defaultBranch !== 'string' || !cfg.defaultBranch) throw new HarnessError('defaultBranch is required');
  if (!cfg.checks || typeof cfg.checks !== 'object') throw new HarnessError('checks is required');
  for (const id of ['fast', 'full']) if (!cfg.checks[id]) throw new HarnessError(`checks.${id} is required`);
  for (const [id, cmds] of Object.entries(cfg.checks)) {
    if (!Array.isArray(cmds)) throw new HarnessError(`checks.${id} must be a list of commands`);
    cmds.forEach((c, i) => validateCommand(c, `checks.${id}[${i}]`));
  }
  if (cfg.requiredCiChecks !== undefined && !isStrArray(cfg.requiredCiChecks))
    throw new HarnessError('requiredCiChecks must be a list of check names');
  if (cfg.fileTools !== undefined) {
    if (typeof cfg.fileTools !== 'object') throw new HarnessError('fileTools must map globs to tools');
    for (const [glob, tools] of Object.entries(cfg.fileTools))
      for (const kind of ['format', 'lint']) if (tools[kind] !== undefined) {
        validateCommand(tools[kind], `fileTools["${glob}"].${kind}`);
        if (!tools[kind].run.includes('{file}')) throw new HarnessError(`fileTools["${glob}"].${kind} must contain "{file}"`);
      }
  }
  if (cfg.reviewOnReady !== undefined) {
    const r = cfg.reviewOnReady;
    if (!r || typeof r !== 'object' || typeof r.workflow !== 'string' || !/^[\w.-]+\.ya?ml$/.test(r.workflow))
      throw new HarnessError('reviewOnReady is { "workflow": "<file>.yml", "timeoutMin"?: n }');
    if (r.timeoutMin !== undefined && !(Number.isFinite(r.timeoutMin) && r.timeoutMin > 0))
      throw new HarnessError('reviewOnReady.timeoutMin must be a positive number');
  }
  if (cfg.docs !== undefined && !isStrArray(cfg.docs)) throw new HarnessError('docs must be a list of globs');
  if (cfg.docmap !== undefined) {
    if (typeof cfg.docmap !== 'object') throw new HarnessError('docmap must map globs to doc lists');
    for (const [g, docs] of Object.entries(cfg.docmap)) if (!isStrArray(docs)) throw new HarnessError(`docmap["${g}"] must be a list`);
  }
  return cfg;
}

// HARNESS_CONFIG points at a config outside the repo, so a project's checks can be tried before installing.
function loadConfig(root) {
  const file = process.env.HARNESS_CONFIG ? path.resolve(process.env.HARNESS_CONFIG) : path.join(root, '.claude', 'harness.json');
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { throw new HarnessError(`missing ${path.relative(root, file)}`); }
  let cfg;
  try { cfg = JSON.parse(text); } catch (e) { throw new HarnessError(`harness.json is not valid JSON: ${e.message}`); }
  return validateConfig(cfg);
}

// --- logging (§8.3: one line per hook or script event) -------------------------

function log(root, record) {
  try {
    fs.mkdirSync(workDir(root), { recursive: true });
    fs.appendFileSync(path.join(workDir(root), 'hooks.log'), JSON.stringify({ ts: new Date().toISOString(), ...record }) + '\n');
  } catch { /* logging must never break a hook */ }
}

// --- running commands (F12) -----------------------------------------------------

// Windows can't spawn .cmd/.bat shims (npm, npx) without a shell, so there every argument is
// double-quoted for cmd.exe; arguments it can't quote safely are refused instead of guessed at.
const WIN_UNSAFE = /["%\r\n^!]/;

function quoteForCmd(arg) {
  if (WIN_UNSAFE.test(arg)) throw new HarnessError(`argument can't be passed safely on Windows: ${JSON.stringify(arg)}`);
  return `"${arg}"`;
}

// Resolves a bare program name through PATH and PATHEXT to an absolute path, as cmd would but without
// searching the current folder first (a repo can't plant an npm.cmd), and so a .cmd shim sees its real
// location: invoked by a quoted bare name, a shim's %~dp0 points at the current folder instead.
function resolveWindowsProgram(name) {
  if (/[\\/]/.test(name) || path.isAbsolute(name)) return name;
  const exts = (process.env.PATHEXT || '.COM;.EXE;.BAT;.CMD').split(';').filter(Boolean);
  const hasExt = exts.some(e => name.toLowerCase().endsWith(e.toLowerCase()));
  for (const dir of (process.env.PATH || process.env.Path || '').split(path.delimiter).filter(Boolean)) {
    for (const ext of hasExt ? [''] : exts) {
      const candidate = path.join(dir, name + ext);
      try { if (fs.statSync(candidate).isFile()) return candidate; } catch { /* keep looking */ }
    }
  }
  return name; // not found: let cmd report it
}

function killTree(child) {
  if (process.platform === 'win32') {
    try { execFileSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { /* already gone */ }
  } else {
    try { process.kill(-child.pid, 'SIGKILL'); } catch { try { child.kill('SIGKILL'); } catch { /* gone */ } }
  }
}

// Runs one argv command. Resolves { code, output, timedOut, ms }; the code is the process's own.
function runArgv(argv, { cwd, timeoutSec = 300 } = {}) {
  return new Promise(resolve => {
    const started = Date.now();
    let child;
    try {
      child = process.platform === 'win32'
        ? spawn([resolveWindowsProgram(argv[0]), ...argv.slice(1)].map(quoteForCmd).join(' '), { cwd, shell: true, windowsHide: true })
        : spawn(argv[0], argv.slice(1), { cwd, detached: true });
    } catch (e) {
      return resolve({ code: 127, output: String(e.message || e), timedOut: false, ms: 0 });
    }
    const chunks = [];
    child.stdout.on('data', d => chunks.push(d));
    child.stderr.on('data', d => chunks.push(d));
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; killTree(child); }, timeoutSec * 1000);
    child.on('error', e => chunks.push(Buffer.from(String(e.message || e))));
    child.on('close', code => {
      clearTimeout(timer);
      resolve({
        code: timedOut ? 124 : (code === null ? 1 : code),
        output: Buffer.concat(chunks).toString('utf8'),
        timedOut,
        ms: Date.now() - started,
      });
    });
  });
}

// Keeps the end of the output, where failures usually are.
function tail(text, maxLines = 40) {
  const lines = text.replace(/\s+$/, '').split(/\r?\n/);
  if (lines.length <= maxLines) return lines.join('\n');
  return [`… ${lines.length - maxLines} earlier lines omitted`, ...lines.slice(-maxLines)].join('\n');
}

// --- hook input -------------------------------------------------------------------

// Reads the hook's JSON from stdin. Unparseable input is an error the caller must fail closed on.
function readHookInput() {
  let raw = '';
  try { raw = fs.readFileSync(0, 'utf8'); } catch { /* no stdin */ }
  try { return JSON.parse(raw); } catch { throw new HarnessError('hook input is not valid JSON'); }
}

// --- globs (for fileTools, docs and docmap) --------------------------------------------

function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') { re += glob[i + 2] === '/' ? '(?:.*/)?' : '.*'; i += glob[i + 2] === '/' ? 2 : 1; }
      else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else if (c === '{') {
      const end = glob.indexOf('}', i);
      re += '(?:' + glob.slice(i + 1, end).split(',').map(s => s.replace(/[.+^$()|[\]\\]/g, '\\$&')).join('|') + ')';
      i = end;
    } else re += c.replace(/[.+^$()|[\]\\]/g, '\\$&');
  }
  return new RegExp('^' + re + '$');
}

const toPosix = p => p.split(path.sep).join('/');
const matchesGlob = (file, glob) => globToRegExp(glob).test(toPosix(file));

// --- work state ---------------------------------------------------------------------------

// The issue being worked: the issue folder under .claude/work with the most recently changed plan.
function activeIssue(root) {
  const w = workDir(root);
  if (!fs.existsSync(w)) return null;
  let best = null;
  for (const n of fs.readdirSync(w)) {
    const plan = path.join(w, n, 'plan.md');
    if (!/^\d+$/.test(n) || !fs.existsSync(plan)) continue;
    const t = fs.statSync(plan).mtimeMs;
    if (!best || t > best.t) best = { issue: n, t };
  }
  return best && best.issue;
}

// A hash of everything a check's result depends on (F12): the content of every tracked and untracked,
// non-ignored file (staged or not, so deletions and renames count too), plus the check config and the
// scripts that run it. Built in a throwaway index, so the real index is never touched.
function fingerprint(root) {
  const crypto = require('crypto');
  const os = require('os');
  const gitDir = execFileSync('git', ['rev-parse', '--absolute-git-dir'], { cwd: root, encoding: 'utf8' }).trim();
  const tmpIndex = path.join(os.tmpdir(), `harness-index-${process.pid}-${Date.now()}`);
  try {
    if (fs.existsSync(path.join(gitDir, 'index'))) fs.copyFileSync(path.join(gitDir, 'index'), tmpIndex);
    const env = { ...process.env, GIT_INDEX_FILE: tmpIndex };
    // An exclude pathspec errors when it names an ignored directory, so add everything, then drop
    // .claude/work from the throwaway index; this works whether or not the folder is gitignored.
    execFileSync('git', ['add', '-A', '--', '.'], { cwd: root, env, stdio: 'ignore' });
    execFileSync('git', ['rm', '-r', '-q', '--cached', '--ignore-unmatch', '--', '.claude/work'], { cwd: root, env, stdio: 'ignore' });
    const tree = execFileSync('git', ['write-tree'], { cwd: root, env, encoding: 'utf8' }).trim();
    const h = crypto.createHash('sha256').update(tree);
    for (const f of ['.claude/harness.json', '.claude/lib/harness.cjs', '.claude/scripts/check.cjs', '.claude/hooks/check-gate.cjs']) {
      try { h.update(f).update(fs.readFileSync(path.join(root, f))); } catch { h.update(`${f}:missing`); }
    }
    return h.digest('hex');
  } finally {
    try { fs.rmSync(tmpIndex, { force: true }); } catch { /* temp file */ }
  }
}

module.exports = {
  HarnessError, tag, repoRoot, workDir, loadConfig, validateConfig, log,
  runArgv, tail, readHookInput, globToRegExp, matchesGlob, toPosix, activeIssue, fingerprint,
};
