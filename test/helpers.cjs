'use strict';
// Test fixtures: throwaway git repos with a .claude/ tree copied from harness/.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HARNESS = path.join(__dirname, '..', 'harness', '.claude');

// The name has a space on purpose: every path the harness touches must survive one (F12).
function tempDir(prefix = 'harness test ') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function initRepo(dir, branch = 'main') {
  git(dir, 'init', '-q', '-b', branch);
  git(dir, 'config', 'user.email', 'test@example.com');
  git(dir, 'config', 'user.name', 'Harness Test');
  git(dir, 'config', 'commit.gpgsign', 'false');
  return dir;
}

function write(dir, rel, content) {
  const f = path.join(dir, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, content);
  return f;
}

function commitAll(dir, msg) {
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', msg);
  return git(dir, 'rev-parse', 'HEAD');
}

// A repo with the harness installed and the given harness.json.
function harnessRepo(config, branch = 'main') {
  const dir = initRepo(tempDir(), branch);
  fs.cpSync(HARNESS, path.join(dir, '.claude'), { recursive: true });
  write(dir, '.claude/harness.json', JSON.stringify(config, null, 2));
  write(dir, '.gitignore', '.claude/work/\n');
  return dir;
}

// A command that runs a small Node script file (avoids quoting script text on Windows).
function nodeScript(dir, name, code) {
  const f = write(dir, `scripts-for-test/${name}.cjs`, code);
  return [process.execPath, f];
}

function run(script, args, { cwd, env = {}, input } = {}) {
  const { spawnSync } = require('child_process');
  const r = spawnSync(process.execPath, [path.join(HARNESS, script), ...args], {
    cwd, input, encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: cwd, ...env },
  });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || ''), stdout: r.stdout || '', stderr: r.stderr || '' };
}

module.exports = { HARNESS, tempDir, git, initRepo, write, commitAll, harnessRepo, nodeScript, run };
