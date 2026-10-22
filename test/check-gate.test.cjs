'use strict';
// H2 Stop gate: fingerprint skips, structured blocks, BLOCKED after 3 failures, unblocking (§6.2, F5, F12).

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { harnessRepo, tempDir, write, commitAll, git, run } = require('./helpers.cjs');

// A fast check that counts its runs in a file outside the repo, and fails while FAIL exists in the repo.
function repo() {
  const counter = path.join(tempDir('harness counter '), 'runs');
  const dir = harnessRepo({ defaultBranch: 'main', checks: { fast: [], full: [] } });
  const script = write(tempDir('harness scripts '), 'fast.cjs', `
    const fs = require('fs');
    fs.appendFileSync(${JSON.stringify(counter)}, 'x');
    if (fs.existsSync('FAIL')) { console.error('test X failed: expected 1, got 2'); process.exit(1); }`);
  write(dir, '.claude/harness.json', JSON.stringify({ defaultBranch: 'main', checks: { fast: [{ run: [process.execPath, script] }], full: [] } }));
  write(dir, 'src/a.txt', 'v1');
  commitAll(dir, 'base');
  write(dir, '.claude/work/42/plan.md', '# Plan: #42 · Tier: Standard\n');
  const runs = () => (fs.existsSync(counter) ? fs.readFileSync(counter, 'utf8').length : 0);
  return { dir, runs };
}

const stop = dir => {
  const r = run('hooks/check-gate.cjs', [], { cwd: dir, input: JSON.stringify({ hook_event_name: 'Stop', stop_hook_active: false }) });
  return { ...r, json: r.stdout ? JSON.parse(r.stdout) : null };
};

test('no active plan: the gate does nothing', () => {
  const { dir, runs } = repo();
  fs.rmSync(path.join(dir, '.claude/work/42'), { recursive: true });
  write(dir, 'FAIL', '');
  const r = stop(dir);
  assert.strictEqual(r.code, 0);
  assert.strictEqual(r.stdout, '');
  assert.strictEqual(runs(), 0);
});

test('a pass is silent and recorded; an unchanged tree skips the checks', () => {
  const { dir, runs } = repo();
  assert.strictEqual(stop(dir).stdout, '');
  assert.strictEqual(runs(), 1);
  assert.ok(fs.existsSync(path.join(dir, '.claude/work/.lastpass')));
  stop(dir);
  assert.strictEqual(runs(), 1, 'second stop on the same content runs nothing');
});

test('staging or committing the same content does not force a re-run', () => {
  const { dir, runs } = repo();
  write(dir, 'src/a.txt', 'v2');
  stop(dir);
  git(dir, 'add', '-A');
  stop(dir);
  commitAll(dir, 'same content, committed');
  stop(dir);
  assert.strictEqual(runs(), 1);
});

for (const [name, change] of [
  ['an untracked file', d => write(d, 'src/new.txt', 'x')],
  ['an unstaged edit', d => write(d, 'src/a.txt', 'v3')],
  ['a staged edit', d => { write(d, 'src/a.txt', 'v4'); git(d, 'add', 'src/a.txt'); }],
  ['a deletion', d => fs.rmSync(path.join(d, 'src/a.txt'))],
  ['a rename', d => git(d, 'mv', 'src/a.txt', 'src/b.txt')],
  ['a harness.json edit', d => {
    const f = path.join(d, '.claude/harness.json');
    const cfg = JSON.parse(fs.readFileSync(f, 'utf8'));
    cfg.checks.extra = [];
    fs.writeFileSync(f, JSON.stringify(cfg));
  }],
]) {
  test(`${name} invalidates the last pass`, () => {
    const { dir, runs } = repo();
    stop(dir);
    change(dir);
    stop(dir);
    assert.strictEqual(runs(), 2);
  });
}

test('changes under .claude/work don\'t count', () => {
  const { dir, runs } = repo();
  stop(dir);
  write(dir, '.claude/work/42/handoff.md', 'x');
  stop(dir);
  assert.strictEqual(runs(), 1);
});

test('a failure blocks the stop with structured detail', () => {
  const { dir } = repo();
  write(dir, 'FAIL', '');
  const r = stop(dir);
  assert.strictEqual(r.json.decision, 'block');
  assert.match(r.json.reason, /^\[harness check-gate\] fast checks failed \(attempt 1\/3\)/);
  assert.match(r.json.reason, /Failing check: fast\[0\]/);
  assert.match(r.json.reason, /Exit: 1/);
  assert.match(r.json.reason, /expected 1, got 2/);
});

test('three consecutive failures write BLOCKED and let Claude stop; it stays quiet until something changes', () => {
  const { dir, runs } = repo();
  write(dir, 'FAIL', '');
  stop(dir);
  write(dir, 'src/a.txt', 'try 2');
  assert.match(stop(dir).json.reason, /attempt 2\/3/);
  write(dir, 'src/a.txt', 'try 3');
  const third = stop(dir);
  assert.strictEqual(third.json.decision, undefined);
  assert.match(third.json.systemMessage, /#42 is BLOCKED/);
  const blocked = fs.readFileSync(path.join(dir, '.claude/work/42/BLOCKED'), 'utf8');
  assert.match(blocked, /exit: 1/);
  assert.match(blocked, /expected 1, got 2/);
  const before = runs();
  assert.strictEqual(stop(dir).stdout, '', 'unchanged while blocked: no re-run, no new block');
  assert.strictEqual(runs(), before);
});

test('a later pass removes BLOCKED', () => {
  const { dir } = repo();
  write(dir, 'FAIL', '');
  for (const v of ['1', '2', '3']) { write(dir, 'src/a.txt', v); stop(dir); }
  assert.ok(fs.existsSync(path.join(dir, '.claude/work/42/BLOCKED')));
  fs.rmSync(path.join(dir, 'FAIL'));
  assert.strictEqual(stop(dir).stdout, '');
  assert.ok(!fs.existsSync(path.join(dir, '.claude/work/42/BLOCKED')));
});

test('malformed hook input doesn\'t stop the gate from working', () => {
  const { dir } = repo();
  write(dir, 'FAIL', '');
  const r = run('hooks/check-gate.cjs', [], { cwd: dir, input: 'not json' });
  assert.strictEqual(JSON.parse(r.stdout).decision, 'block');
});
