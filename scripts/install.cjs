#!/usr/bin/env node
'use strict';
// Installs or upgrades the harness in a project (ADOPTION_PLAN.md §3).
// Usage: node scripts/install.cjs <target-repo> <project> [--apply] [--replace <path>]... [--force]
//
// Dry run by default: prints what it would add, update, replace or remove, and changes nothing.
// --apply writes, and only on a clean target tree. Files the harness didn't install are replaced only
// when named with --replace; files edited since the last install are kept unless --force.
// It never writes CLAUDE.md or .claude/rules/; those are authored per project.
// Exit 0 ok · 3 blocked (conflicts, local edits, dirty tree; nothing written) · 2 error.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { validateConfig } = require('../harness/.claude/lib/harness.cjs');

const SOURCE = path.join(__dirname, '..');
const HARNESS = path.join(SOURCE, 'harness', '.claude');
const PROJECTS = process.env.HARNESS_PROJECTS_DIR || path.join(SOURCE, 'projects');
const INSTALLED_DIRS = ['lib', 'hooks', 'scripts', 'agents', 'skills'];
const INSTALLED_FILES = ['settings.json'];
const MANIFEST = '.claude/harness-manifest.json';
// Paths the harness itself needs ignored, and paths it needs tracked (A1).
const MUST_IGNORE = ['.harness/work/', '.claude/settings.local.json'];

class Blocked extends Error {}
class Usage extends Error {}

const posix = p => p.split(path.sep).join('/');
const lf = buf => buf.toString('utf8').replace(/\r\n/g, '\n');
const hash = text => crypto.createHash('sha256').update(text).digest('hex');
const hashFile = f => hash(lf(fs.readFileSync(f)));

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p)); else out.push(p);
  }
  return out;
}

// Adds the project's preloaded skills to the red-team's frontmatter (A3).
function withRedTeamSkills(text, skills) {
  if (!skills || !skills.length) return text;
  const close = text.indexOf('\n---', 4);
  if (!text.startsWith('---\n') || close < 0) throw new Usage('red-team.md has no frontmatter to add skills to');
  if (/^skills:/m.test(text.slice(0, close))) throw new Usage('red-team.md already declares skills');
  return text.slice(0, close) + '\nskills:\n' + skills.map(s => `  - ${s}`).join('\n') + text.slice(close);
}

// The files to install: { rel (repo-relative, posix) → text }.
function sourceFiles(project) {
  const projDir = path.join(PROJECTS, project);
  const cfgFile = path.join(projDir, 'harness.json');
  if (!fs.existsSync(cfgFile)) throw new Usage(`no project "${project}" (expected ${posix(path.relative(SOURCE, cfgFile))})`);
  const cfgText = lf(fs.readFileSync(cfgFile));
  validateConfig(JSON.parse(cfgText));
  const extra = fs.existsSync(path.join(projDir, 'install.json')) ? JSON.parse(fs.readFileSync(path.join(projDir, 'install.json'), 'utf8')) : {};
  if (extra.redTeamSkills !== undefined && !(Array.isArray(extra.redTeamSkills) && extra.redTeamSkills.every(s => /^[\w-]+$/.test(s))))
    throw new Usage('install.json: redTeamSkills must be a list of skill names');

  const files = new Map();
  for (const d of INSTALLED_DIRS) for (const f of walk(path.join(HARNESS, d))) {
    const rel = '.claude/' + posix(path.relative(HARNESS, f));
    let text = lf(fs.readFileSync(f));
    if (rel === '.claude/agents/red-team.md') text = withRedTeamSkills(text, extra.redTeamSkills);
    files.set(rel, text);
  }
  for (const f of INSTALLED_FILES) files.set('.claude/' + f, lf(fs.readFileSync(path.join(HARNESS, f))));
  files.set('.claude/harness.json', cfgText);
  return { files, redTeamSkills: extra.redTeamSkills || [] };
}

function sourceCommit() {
  try {
    const commit = git(SOURCE, 'rev-parse', 'HEAD');
    const dirty = git(SOURCE, 'status', '--porcelain', '--', 'harness', 'projects') !== '';
    return { commit, dirty };
  } catch { return { commit: null, dirty: true }; }
}

function plan(target, files, { replace, force }) {
  const mfile = path.join(target, MANIFEST);
  const old = fs.existsSync(mfile) ? JSON.parse(fs.readFileSync(mfile, 'utf8')) : { files: {} };
  const actions = [];
  for (const [rel, text] of files) {
    const abs = path.join(target, rel);
    const want = hash(text);
    if (!fs.existsSync(abs)) { actions.push({ rel, kind: 'add', text }); continue; }
    const have = hashFile(abs);
    if (have === want) { actions.push({ rel, kind: 'same' }); continue; }
    if (old.files[rel]) {
      if (have === old.files[rel]) actions.push({ rel, kind: 'update', text });
      else actions.push({ rel, kind: force ? 'update' : 'local-edit', text, note: 'edited since the last install' });
    } else {
      actions.push({ rel, kind: replace.has(rel) || force ? 'replace' : 'conflict', text, note: 'exists and was not installed by the harness' });
    }
  }
  // Files an earlier install put there that the harness no longer ships.
  for (const rel of Object.keys(old.files)) {
    if (files.has(rel)) continue;
    const abs = path.join(target, rel);
    if (!fs.existsSync(abs)) continue;
    const untouched = hashFile(abs) === old.files[rel];
    actions.push({ rel, kind: untouched || force ? 'remove' : 'keep-edited', note: untouched ? 'no longer shipped' : 'no longer shipped, but edited; kept' });
  }
  return actions;
}

function gitignoreReport(target, files) {
  const ignored = [];
  for (const rel of files.keys()) {
    try { const v = git(target, 'check-ignore', '-v', '--no-index', rel); ignored.push({ rel, rule: v.split('\t')[0] }); }
    catch { /* not ignored */ }
  }
  const missing = MUST_IGNORE.filter(p => {
    try { git(target, 'check-ignore', '-q', '--no-index', p + (p.endsWith('/') ? 'x' : '')); return false; } catch { return true; }
  });
  return { ignored, missing };
}

function main(argv) {
  const args = [...argv];
  const take = flag => { const out = []; let i; while ((i = args.indexOf(flag)) >= 0) { out.push(args[i + 1]); args.splice(i, 2); } return out; };
  const replace = new Set(take('--replace').map(p => posix(p)));
  const apply = args.includes('--apply');
  const force = args.includes('--force');
  const [targetArg, project] = args.filter(a => !a.startsWith('--'));
  if (!targetArg || !project) throw new Usage('usage: install.cjs <target-repo> <project> [--apply] [--replace <path>]... [--force]');

  const target = path.resolve(targetArg);
  try { git(target, 'rev-parse', '--show-toplevel'); } catch { throw new Usage(`${target} is not a git repository`); }

  const { files, redTeamSkills } = sourceFiles(project);
  for (const s of redTeamSkills)
    if (!fs.existsSync(path.join(target, '.claude', 'skills', s, 'SKILL.md')) && !files.has(`.claude/skills/${s}/SKILL.md`))
      console.log(`warning: the red-team preloads skill "${s}", but .claude/skills/${s}/SKILL.md doesn't exist in the target`);

  const actions = plan(target, files, { replace, force });
  const counts = actions.reduce((c, a) => ((c[a.kind] = (c[a.kind] || 0) + 1), c), {});
  for (const a of actions.filter(x => x.kind !== 'same')) console.log(`${a.kind.padEnd(11)} ${a.rel}${a.note ? `  (${a.note})` : ''}`);
  console.log(`summary: ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}`);

  const gi = gitignoreReport(target, files);
  for (const g of gi.ignored) {
    const dir = g.rel.split('/').slice(0, 2).join('/');
    console.log(`gitignore: ${g.rel} is ignored by "${g.rule}"; remove that rule, or override it with "!${dir}/", so the harness is tracked (A1)`);
  }
  for (const m of gi.missing) console.log(`gitignore: add "${m}"`);

  const blocking = actions.filter(a => a.kind === 'conflict' || a.kind === 'local-edit');
  if (blocking.length) throw new Blocked(`${blocking.length} file(s) need --replace <path> (not installed by the harness) or --force (edited since the last install); nothing written`);
  if (!apply) { console.log('dry run: nothing written; run again with --apply'); return; }

  if (git(target, 'status', '--porcelain') !== '' && !force) throw new Blocked('the target has uncommitted changes; commit or stash them first (or --force); nothing written');

  const mfile = path.join(target, MANIFEST);
  const oldFiles = fs.existsSync(mfile) ? JSON.parse(fs.readFileSync(mfile, 'utf8')).files : null;
  const newFiles = Object.fromEntries([...files].map(([rel, text]) => [rel, hash(text)]).sort());
  if (actions.every(a => a.kind === 'same') && JSON.stringify(oldFiles) === JSON.stringify(newFiles)) {
    console.log('already up to date: nothing written');
    return;
  }

  for (const a of actions) {
    const abs = path.join(target, a.rel);
    if (['add', 'update', 'replace'].includes(a.kind)) { fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, a.text); }
    if (a.kind === 'remove') fs.rmSync(abs);
  }
  const src = sourceCommit();
  const manifest = {
    source: 'ProdHarnessConfig', commit: src.commit, sourceDirty: src.dirty, project,
    installedAt: new Date().toISOString(),
    files: newFiles,
  };
  fs.writeFileSync(mfile, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`installed from ${src.commit ? src.commit.slice(0, 7) : 'an unknown commit'}${src.dirty ? ' (with uncommitted harness changes)' : ''}; wrote ${MANIFEST}`);
}

if (require.main === module) {
  try { main(process.argv.slice(2)); process.exit(0); }
  catch (e) {
    if (e instanceof Blocked) { console.error(`BLOCKED: ${e.message}`); process.exit(3); }
    console.error(e instanceof Usage ? e.message : `unexpected error: ${e.stack || e}`);
    process.exit(2);
  }
}

module.exports = { withRedTeamSkills };
