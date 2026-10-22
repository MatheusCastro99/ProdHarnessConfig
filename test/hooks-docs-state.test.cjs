'use strict';
// H4 docs-gate (D2, D10, F7) and H5 session-state (D3, F4).

const test = require('node:test');
const assert = require('node:assert');
const { harnessRepo, write, commitAll, git, run } = require('./helpers.cjs');

const CONFIG = { defaultBranch: 'main', checks: { fast: [], full: [] }, docs: ['Docs/**/*.md'] };

function repo() {
  const dir = harnessRepo(CONFIG);
  write(dir, 'src/billing/Invoice.cs', 'v1');
  write(dir, 'Docs/Billing.md', 'Invoices are built in src/billing/Invoice.cs.\n');
  commitAll(dir, 'base');
  return dir;
}

const commit = (dir, command) => {
  const r = run('hooks/docs-gate.cjs', [], { cwd: dir, input: JSON.stringify({ hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command } }) });
  return r.stdout ? JSON.parse(r.stdout).hookSpecificOutput : null;
};

test('H4: a commit that leaves a candidate doc stale is denied, with the list and how to ack', () => {
  const dir = repo();
  write(dir, 'src/billing/Invoice.cs', 'v2');
  git(dir, 'add', '-A');
  const out = commit(dir, 'git commit -m "feat: invoices (#42)"');
  assert.strictEqual(out.permissionDecision, 'deny');
  assert.match(out.permissionDecisionReason, /^\[harness docs-gate\]/);
  assert.match(out.permissionDecisionReason, /Docs\/Billing\.md ← src\/billing\/Invoice\.cs/);
  assert.match(out.permissionDecisionReason, /ack: <doc>/);
});

test('H4: the commit passes once the doc is updated in it', () => {
  const dir = repo();
  write(dir, 'src/billing/Invoice.cs', 'v2');
  write(dir, 'Docs/Billing.md', 'Invoices are built in src/billing/Invoice.cs, now with tax.\n');
  git(dir, 'add', '-A');
  assert.strictEqual(commit(dir, 'git commit -m x'), null);
});

test('H4: the commit passes once the doc is acknowledged', () => {
  const dir = repo();
  write(dir, 'src/billing/Invoice.cs', 'v2');
  git(dir, 'add', '-A');
  write(dir, '.claude/work/42/stale-docs.md', 'ack: Docs/Billing.md — only a private helper changed\n');
  assert.strictEqual(commit(dir, 'git commit -m x'), null);
});

test('H4: `commit -a` also counts unstaged tracked changes', () => {
  const dir = repo();
  write(dir, 'src/billing/Invoice.cs', 'v2');
  assert.strictEqual(commit(dir, 'git commit -m x'), null, 'nothing staged: plain commit has nothing to gate');
  assert.strictEqual(commit(dir, 'git commit -am x').permissionDecision, 'deny');
  assert.strictEqual(commit(dir, 'git -C . commit --all -m x').permissionDecision, 'deny');
});

test('H4: commands that aren\'t commits pass untouched, even if the `if` filter let them through', () => {
  const dir = repo();
  write(dir, 'src/billing/Invoice.cs', 'v2');
  git(dir, 'add', '-A');
  for (const c of ['git status', 'echo "git commit"', 'git log --grep commit', 'npm test'])
    assert.strictEqual(commit(dir, c), null, c);
  assert.strictEqual(commit(dir, 'npm test && git commit -m x').permissionDecision, 'deny');
});

test('H4: malformed input denies the commit rather than guess', () => {
  const r = run('hooks/docs-gate.cjs', [], { cwd: repo(), input: '{bad' });
  assert.strictEqual(JSON.parse(r.stdout).hookSpecificOutput.permissionDecision, 'deny');
});

const session = dir => {
  const r = run('hooks/session-state.cjs', [], { cwd: dir, input: JSON.stringify({ hook_event_name: 'SessionStart', source: 'clear' }) });
  return r.stdout ? JSON.parse(r.stdout).hookSpecificOutput.additionalContext : '';
};

test('H5: reports a plan in progress, a ready handoff, and BLOCKED', () => {
  const dir = repo();
  assert.strictEqual(session(dir), '', 'no work: nothing printed');
  write(dir, '.claude/work/42/plan.md', '# Plan');
  assert.match(session(dir), /Plan for #42 in progress → Block B/);
  write(dir, '.claude/work/42/handoff.md', '# Handoff: #42\nStatus: READY\n');
  assert.match(session(dir), /Handoff for #42 ready → run \/review/);
  write(dir, '.claude/work/42/BLOCKED', 'check: fast\nexit: 1\n');
  assert.match(session(dir), /#42 is BLOCKED on fast → owner decision/);
});
