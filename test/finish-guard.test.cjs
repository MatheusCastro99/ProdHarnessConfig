'use strict';
// H6 finish-guard (research/06, check 9): a forked build returns only when it is done.

const test = require('node:test');
const assert = require('node:assert');
const { harnessRepo, write, run } = require('./helpers.cjs');

const CONFIG = { defaultBranch: 'main', checks: { fast: [], full: [] } };

function repo() {
  const dir = harnessRepo(CONFIG);
  write(dir, '.harness/work/42/plan.md', '# Plan');
  return dir;
}

const stop = (dir, last) => {
  const r = run('hooks/finish-guard.cjs', [], { cwd: dir, input: JSON.stringify({ hook_event_name: 'SubagentStop', agent_type: 'builder', last_assistant_message: last }) });
  return r.stdout ? JSON.parse(r.stdout) : null;
};

test('H6: an unfinished build is sent back 3 times, then let go with a visible message', () => {
  const dir = repo();
  for (const n of [1, 2, 3]) {
    const out = stop(dir, 'Waiting on the slow check.');
    assert.strictEqual(out.decision, 'block');
    assert.ok(out.reason.startsWith('[harness finish-guard]'));
    assert.ok(out.reason.includes(`attempt ${n}/3`));
  }
  const last = stop(dir, 'Still waiting.');
  assert.strictEqual(last.decision, undefined);
  assert.match(last.systemMessage, /returned unfinished 3 times/);
  assert.strictEqual(stop(dir, 'Waiting.').decision, 'block', 'the count starts again after letting go');
});

test('H6: a handoff, BLOCKED, or a QUESTION line lets the build return', () => {
  let dir = repo();
  assert.strictEqual(stop(dir, 'Sub-phase 2 needs a decision.\nQUESTION: which rounding mode?'), null);
  dir = repo();
  write(dir, '.harness/work/42/handoff.md', '# Handoff: #42');
  assert.strictEqual(stop(dir, 'Done.'), null);
  dir = repo();
  write(dir, '.harness/work/42/BLOCKED', 'check: fast');
  assert.strictEqual(stop(dir, 'Blocked.'), null);
});

test('H6: a QUESTION must start a line; a mention of one does not count', () => {
  assert.strictEqual(stop(repo(), 'I have no QUESTION: just waiting.').decision, 'block');
});

test('H6: silent when no issue is active; malformed input still gates', () => {
  const idle = harnessRepo(CONFIG);
  assert.strictEqual(stop(idle, 'anything'), null);
  const r = run('hooks/finish-guard.cjs', [], { cwd: repo(), input: '{bad' });
  assert.strictEqual(JSON.parse(r.stdout).decision, 'block');
});
