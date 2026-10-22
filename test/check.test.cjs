'use strict';
// S5 check runner: the V0 cases from OPTIMIZATION_PLAN.md §6.4.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { harnessRepo, nodeScript, run, write } = require('./helpers.cjs');

function repoWith(checks) {
  const dir = harnessRepo({ defaultBranch: 'main', checks: { fast: [], full: [] } });
  const cfg = { defaultBranch: 'main', checks: { fast: [], full: [], ...checks(dir) } };
  write(dir, '.claude/harness.json', JSON.stringify(cfg));
  return dir;
}

test('a passing check exits 0 and prints one summary line', () => {
  const dir = repoWith(d => ({ fast: [{ run: nodeScript(d, 'ok', 'console.log("all good")') }] }));
  const r = run('scripts/check.cjs', ['fast'], { cwd: dir });
  assert.strictEqual(r.code, 0);
  assert.match(r.out, /\[harness check\] fast passed/);
  assert.doesNotMatch(r.out, /all good/);
});

test('a failing check keeps the command\'s own exit code', () => {
  const dir = repoWith(d => ({ fast: [{ run: nodeScript(d, 'fail', 'console.error("boom"); process.exit(3)') }] }));
  const r = run('scripts/check.cjs', ['fast'], { cwd: dir });
  assert.strictEqual(r.code, 3);
  assert.match(r.out, /FAILED .*exit 3/);
  assert.match(r.out, /boom/);
});

test('a failure that prints nothing is still a failure, and says so', () => {
  const dir = repoWith(d => ({ fast: [{ run: nodeScript(d, 'silent', 'process.exit(1)') }] }));
  const r = run('scripts/check.cjs', ['fast'], { cwd: dir });
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /printed nothing/);
});

test('a timeout fails with 124', () => {
  const dir = repoWith(d => ({ fast: [{ run: nodeScript(d, 'hang', 'setTimeout(() => {}, 60000)'), timeoutSec: 1 }] }));
  const r = run('scripts/check.cjs', ['fast'], { cwd: dir });
  assert.strictEqual(r.code, 124);
  assert.match(r.out, /timed out after 1s/);
});

test('"ERROR" in passing output does not turn a pass into a failure', () => {
  const dir = repoWith(d => ({ fast: [{ run: nodeScript(d, 'noisy', 'console.log("ERROR: this is fine"); console.log("FAIL count: 0")') }] }));
  const r = run('scripts/check.cjs', ['fast'], { cwd: dir });
  assert.strictEqual(r.code, 0);
});

test('stops at the first failing command and skips the rest', () => {
  const dir = repoWith(d => ({
    full: [
      { run: nodeScript(d, 'first', 'process.exit(5)') },
      { run: nodeScript(d, 'second', 'require("fs").writeFileSync("ran-second", "")') },
    ],
  }));
  const r = run('scripts/check.cjs', ['full'], { cwd: dir });
  assert.strictEqual(r.code, 5);
  assert.ok(!fs.existsSync(path.join(dir, 'ran-second')));
});

test('runs in the configured cwd, a directory with a space in its name', () => {
  const dir = repoWith(d => {
    write(d, 'sub dir/marker.txt', 'x');
    return { fast: [{ run: nodeScript(d, 'cwd', 'process.exit(require("fs").existsSync("marker.txt") ? 0 : 9)'), cwd: 'sub dir' }] };
  });
  assert.strictEqual(run('scripts/check.cjs', ['fast'], { cwd: dir }).code, 0);
});

test('long output is trimmed to the last 40 lines', () => {
  const dir = repoWith(d => ({ fast: [{ run: nodeScript(d, 'long', 'for (let i = 1; i <= 200; i++) console.log("line " + i); process.exit(1)') }] }));
  const r = run('scripts/check.cjs', ['fast'], { cwd: dir });
  assert.match(r.out, /160 earlier lines omitted/);
  assert.match(r.out, /line 200/);
  assert.doesNotMatch(r.out, /line 100\b/);
});

test('a .cmd shim on PATH runs from its own folder, and a same-named file in the cwd is not picked (Windows)', { skip: process.platform !== 'win32' }, () => {
  const bin = require('./helpers.cjs').tempDir('harness bin ');
  // The shim prints its own folder (%~dp0); a fake one planted in the check's cwd must never run.
  write(bin, 'shimtool.cmd', '@echo off\r\necho shim-dir=%~dp0\r\nexit /b 0\r\n');
  const dir = repoWith(d => {
    write(d, 'sub/shimtool.cmd', '@echo off\r\necho PLANTED\r\nexit /b 7\r\n');
    return { fast: [{ run: ['shimtool'], cwd: 'sub' }] };
  });
  const r = run('scripts/check.cjs', ['fast'], { cwd: dir, env: { PATH: `${bin};${process.env.PATH}` } });
  assert.strictEqual(r.code, 0, r.out);
  assert.doesNotMatch(r.out, /PLANTED/);
});

test('an unknown check ID fails closed with exit 2', () => {
  const dir = repoWith(() => ({}));
  const r = run('scripts/check.cjs', ['nope'], { cwd: dir });
  assert.strictEqual(r.code, 2);
  assert.match(r.out, /unknown check "nope"/);
});

test('an invalid harness.json fails closed with exit 2', () => {
  const dir = repoWith(() => ({}));
  write(dir, '.claude/harness.json', '{ "defaultBranch": "main", "checks": { "fast": "npm test", "full": [] } }');
  const r = run('scripts/check.cjs', ['fast'], { cwd: dir });
  assert.strictEqual(r.code, 2);
  assert.match(r.out, /checks.fast must be a list/);
});

test('each run is logged with its exit code', () => {
  const dir = repoWith(d => ({ fast: [{ run: nodeScript(d, 'ok2', '') }] }));
  run('scripts/check.cjs', ['fast'], { cwd: dir });
  const lines = fs.readFileSync(path.join(dir, '.harness/work/hooks.log'), 'utf8').trim().split('\n').map(JSON.parse);
  assert.deepStrictEqual(lines.map(l => [l.tool, l.id, l.code]), [['check', 'fast', 0]]);
});
