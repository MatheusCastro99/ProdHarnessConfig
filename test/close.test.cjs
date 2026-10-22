'use strict';
// S2 close: the V0 cases from OPTIMIZATION_PLAN.md §6.4 and §8.5 (F1).

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { tempDir, git, initRepo, write, commitAll, harnessRepo, run } = require('./helpers.cjs');

const CONFIG = { defaultBranch: 'main', checks: { fast: [], full: [] } };

// A repo with a bare origin, an issue branch pushed to it, and a fake gh that reports the PR.
function setup() {
  const originDir = tempDir('harness origin ');
  git(originDir, 'init', '-q', '--bare', '-b', 'main');
  const dir = harnessRepo(CONFIG);
  write(dir, 'app.txt', 'v1\n');
  commitAll(dir, 'base');
  git(dir, 'remote', 'add', 'origin', originDir);
  git(dir, 'push', '-q', '-u', 'origin', 'main');
  git(dir, 'switch', '-q', '-c', 'feat/42-thing');
  write(dir, 'app.txt', 'v2\n');
  const head = commitAll(dir, 'feature');
  git(dir, 'push', '-q', '-u', 'origin', 'feat/42-thing');
  write(dir, '.harness/work/42/plan.md', '# Plan: #42\n');
  write(dir, '.harness/work/42/handoff.md', '# Handoff: #42\nBranch: feat/42-thing\n');
  return { dir, originDir, head };
}

// Merges on the "server" side through a second clone, the way GitHub would.
function mergeOnServer(originDir, how) {
  const clone = tempDir('harness clone ');
  git(clone, 'clone', '-q', originDir, '.');
  git(clone, 'config', 'user.email', 'gh@example.com');
  git(clone, 'config', 'user.name', 'GitHub');
  git(clone, 'switch', '-q', 'main');
  if (how === 'merge') git(clone, 'merge', '-q', '--no-ff', '-m', 'Merge PR #7', 'origin/feat/42-thing');
  else {
    // squash and rebase both leave main with new commits whose SHAs differ from the branch's
    git(clone, 'merge', '-q', '--squash', 'origin/feat/42-thing');
    git(clone, 'commit', '-q', '-m', `${how} merge of PR #7`);
  }
  git(clone, 'push', '-q', 'origin', 'main');
  git(clone, 'push', '-q', 'origin', '--delete', 'feat/42-thing');
}

function fakeGh(dir, pr) {
  const f = write(dir, '../fake-gh-' + path.basename(dir) + '.cjs', `process.stdout.write(${JSON.stringify(JSON.stringify(pr))})`);
  return { HARNESS_GH: f, HARNESS_MEMORY_DIR: path.join(dir, '..', 'no-memory-' + path.basename(dir)) };
}

const branchExists = (dir, b) => { try { git(dir, 'rev-parse', '--verify', `refs/heads/${b}`); return true; } catch { return false; } };

for (const how of ['merge', 'squash', 'rebase']) {
  test(`a ${how} merge closes cleanly: branch deleted, work files deleted, main updated`, () => {
    const { dir, originDir, head } = setup();
    mergeOnServer(originDir, how);
    const r = run('scripts/close.cjs', ['42'], { cwd: dir, env: fakeGh(dir, { number: 7, state: 'MERGED', mergedAt: 'x', headRefOid: head }) });
    assert.strictEqual(r.code, 0, r.out);
    assert.ok(!branchExists(dir, 'feat/42-thing'));
    assert.ok(!fs.existsSync(path.join(dir, '.harness/work/42')));
    assert.strictEqual(git(dir, 'branch', '--show-current'), 'main');
    assert.strictEqual(fs.readFileSync(path.join(dir, 'app.txt'), 'utf8').trim(), 'v2');
    const report = JSON.parse(r.stdout.slice(r.stdout.indexOf('{')));
    assert.match(report.branchDeleted, how === 'merge' ? /^-d/ : /^-D/, 'squash and rebase need the proven -D path');
  });
}

test('a local commit added after the PR\'s head aborts and keeps the branch', () => {
  const { dir, originDir, head } = setup();
  mergeOnServer(originDir, 'squash');
  write(dir, 'extra.txt', 'only here\n');
  const extra = commitAll(dir, 'local-only work');
  const r = run('scripts/close.cjs', ['42'], { cwd: dir, env: fakeGh(dir, { number: 7, state: 'MERGED', mergedAt: 'x', headRefOid: head }) });
  assert.strictEqual(r.code, 3, r.out);
  assert.match(r.out, /ABORTED/);
  assert.ok(r.out.includes(extra) && r.out.includes(head), 'reports both SHAs');
  assert.ok(branchExists(dir, 'feat/42-thing'));
  assert.ok(fs.existsSync(path.join(dir, '.harness/work/42/handoff.md')));
});

for (const [name, dirty] of [
  ['an untracked file', d => write(d, 'new-file.txt', 'x')],
  ['an unstaged change', d => write(d, 'app.txt', 'edited\n')],
  ['a staged change', d => { write(d, 'app.txt', 'staged\n'); git(d, 'add', 'app.txt'); }],
]) {
  test(`${name} aborts and deletes nothing`, () => {
    const { dir, originDir, head } = setup();
    mergeOnServer(originDir, 'merge');
    dirty(dir);
    const r = run('scripts/close.cjs', ['42'], { cwd: dir, env: fakeGh(dir, { number: 7, state: 'MERGED', mergedAt: 'x', headRefOid: head }) });
    assert.strictEqual(r.code, 3, r.out);
    assert.ok(branchExists(dir, 'feat/42-thing'));
    assert.ok(fs.existsSync(path.join(dir, '.harness/work/42')));
  });
}

test('a PR that is not merged aborts', () => {
  const { dir, head } = setup();
  const r = run('scripts/close.cjs', ['42'], { cwd: dir, env: fakeGh(dir, { number: 7, state: 'OPEN', mergedAt: null, headRefOid: head }) });
  assert.strictEqual(r.code, 3);
  assert.match(r.out, /OPEN, not MERGED/);
  assert.ok(branchExists(dir, 'feat/42-thing'));
});

test('--dry-run reports what it would delete and changes nothing', () => {
  const { dir, originDir, head } = setup();
  mergeOnServer(originDir, 'merge');
  const r = run('scripts/close.cjs', ['42', '--dry-run'], { cwd: dir, env: fakeGh(dir, { number: 7, state: 'MERGED', mergedAt: 'x', headRefOid: head }) });
  assert.strictEqual(r.code, 0, r.out);
  assert.match(r.out, /"wouldDelete"/);
  assert.ok(branchExists(dir, 'feat/42-thing'));
  assert.strictEqual(git(dir, 'branch', '--show-current'), 'feat/42-thing');
});

test('a gh failure is an error, not a guess', () => {
  const { dir } = setup();
  const f = write(dir, '../gh-fails.cjs', 'console.error("no pull requests found"); process.exit(1)');
  const r = run('scripts/close.cjs', ['42'], { cwd: dir, env: { HARNESS_GH: f } });
  assert.strictEqual(r.code, 2);
  assert.match(r.out, /no pull requests found/);
  assert.ok(branchExists(dir, 'feat/42-thing'));
});

test('memory files that mention the issue are listed for condensing', () => {
  const { dir, originDir, head } = setup();
  mergeOnServer(originDir, 'merge');
  const mem = tempDir('harness memory ');
  write(mem, 'MEMORY.md', '- index mentions #42 too\n');
  write(mem, 'project-a.md', 'Lesson from #42: …\n');
  write(mem, 'project-b.md', 'About #420, not this one\n');
  const env = { ...fakeGh(dir, { number: 7, state: 'MERGED', mergedAt: 'x', headRefOid: head }), HARNESS_MEMORY_DIR: mem };
  const r = run('scripts/close.cjs', ['42'], { cwd: dir, env });
  assert.strictEqual(r.code, 0, r.out);
  const report = JSON.parse(r.stdout.slice(r.stdout.indexOf('{')));
  assert.deepStrictEqual(report.memoryFiles.map(f => path.basename(f)), ['project-a.md']);
});
