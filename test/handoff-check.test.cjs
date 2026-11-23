'use strict';
// S3 handoff-check: templates §5.4–5.5, BLOCKED (F5), PR-head binding (F3), plan rules (F10, F14, D18).

const test = require('node:test');
const assert = require('node:assert');
const { harnessRepo, write, run } = require('./helpers.cjs');

const CONFIG = {
  defaultBranch: 'main',
  checks: { fast: [], full: [], 'api-smoke': [] },
  requiredCiChecks: ['build'],
};

const HEAD = 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678';

const handoff = (over = {}) => {
  const f = {
    status: 'READY', head: HEAD, ci: 'pass',
    checks: 'check fast → pass (12 tests)\nNot verifiable here: none',
    deviations: 'none', ...over,
  };
  return `# Handoff: #42 → Review
Status: ${f.status}
Plan: .harness/work/42/plan.md (issue comment: https://github.com/o/r/issues/42#c1) · Branch: feat/42-thing · PR: https://github.com/o/r/pull/7 (draft)
PR head: ${f.head} · CI on that head: ${f.ci}
## Commits
${HEAD.slice(0, 7)} feat: thing (#42)
## Checks
${f.checks}
## Deviations from the plan
${f.deviations}
## Decisions made inside the plan's latitude
none
## Docs
Updated: Docs/API.md. Script-flagged but left unchanged: none
## Open questions for G2
none
## Known gaps / risks
none
`;
};

const plan = (over = {}) => {
  const f = { tier: 'Standard', phases: ['### 1. Add the thing\n- Files: src/a.cs\n- Change: add it\n- Check: check fast'], rejected: 'Caching in memory — loses data on restart', ...over };
  return `# Plan: #42 Add the thing · Tier: ${f.tier}
0. Invoke the \`build\` skill before anything else.
## Scope (decided at G1)
Add the thing, nothing else.
## Facts checked / corrected
none
## Acceptance criteria
- [ ] the thing exists
## Sub-phases
${f.phases.join('\n')}
## Rejected approaches
${f.rejected}
## Invariants to preserve
The public API stays as it is.
## Docs likely to go stale
Docs/API.md
## Out of scope
Everything else.
`;
};

// The fake answers `pr view` with the head and `pr checks` with the given jobs (exit 8 if any isn't passing, as gh does).
const fakeGh = (dir, head, checks = [{ name: 'build', state: 'SUCCESS', bucket: 'pass' }]) => ({ HARNESS_GH: write(dir, 'fake-gh.cjs', `
  const checks = ${JSON.stringify(checks)};
  if (process.argv[3] === 'checks') { process.stdout.write(JSON.stringify(checks)); if (checks.some(c => c.bucket !== 'pass')) process.exit(8); }
  else process.stdout.write(${JSON.stringify(JSON.stringify({ headRefOid: head }))});`) });

function check(text, args = [], env = {}, setup = () => {}) {
  const dir = harnessRepo(CONFIG);
  setup(dir);
  write(dir, 'doc.md', text);
  return run('scripts/handoff-check.cjs', ['doc.md', ...args], { cwd: dir, env: typeof env === 'function' ? env(dir) : env });
}

test('a complete READY handoff is valid', () => {
  const r = check(handoff());
  assert.strictEqual(r.code, 0, r.out);
});

test('a missing or empty section is invalid', () => {
  const r = check(handoff().replace(/## Docs\n[^\n]*\n/, '## Docs\n\n'));
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /"## Docs" is empty/);
  const r2 = check(handoff().replace(/## Open questions for G2\nnone\n/, ''));
  assert.match(r2.out, /missing section "## Open questions for G2"/);
});

test('the Checks section must say what isn\'t verifiable', () => {
  const r = check(handoff({ checks: 'check fast → pass' }));
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /Not verifiable here/);
});

test('READY with failing or missing CI is invalid when CI checks are required', () => {
  assert.match(check(handoff({ ci: 'fail' })).out, /needs CI to pass/);
  assert.match(check(handoff({ ci: 'none' })).out, /needs CI to pass/);
});

test('Status: BLOCKED is refused (F5)', () => {
  const r = check(handoff({ status: 'BLOCKED' }));
  assert.strictEqual(r.code, 3);
  assert.match(r.out, /REFUSED: Status is BLOCKED/);
});

test('a BLOCKED marker on disk refuses even a READY handoff (F5)', () => {
  const r = check(handoff(), [], {}, d => write(d, '.harness/work/42/BLOCKED', 'check fast failed 3 times'));
  assert.strictEqual(r.code, 3);
  assert.match(r.out, /BLOCKED exists/);
});

test('--verify-head passes when the PR head is the handed-off SHA (F3)', () => {
  const r = check(handoff(), ['--verify-head'], d => fakeGh(d, HEAD));
  assert.strictEqual(r.code, 0, r.out);
});

test('--verify-head refuses when the PR head moved (F3)', () => {
  const moved = 'ffffffffffffffffffffffffffffffffffffffff';
  const r = check(handoff(), ['--verify-head'], d => fakeGh(d, moved));
  assert.strictEqual(r.code, 3);
  assert.match(r.out, /PR head moved/);
  assert.ok(r.out.includes(moved));
});

test('--verify-head fails when a required CI job didn\'t run or didn\'t pass on the head (D26, #30)', () => {
  const lintOnly = [{ name: 'lint', state: 'SUCCESS', bucket: 'pass' }];
  const r = check(handoff(), ['--verify-head'], d => fakeGh(d, HEAD, lintOnly));
  assert.strictEqual(r.code, 1, r.out);
  assert.match(r.out, /not passing or not run: build/);
  const failing = [{ name: 'build', state: 'FAILURE', bucket: 'fail' }];
  assert.match(check(handoff(), ['--verify-head'], d => fakeGh(d, HEAD, failing)).out, /not passing or not run: build/);
});

test('a handoff over the 2k-token budget is invalid', () => {
  const r = check(handoff({ deviations: 'x'.repeat(9000) }));
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /budget is 8000/);
});

test('a plan over 12k characters is valid with a warning; over 20k it is invalid (D27, #9 §30 X3)', () => {
  const long = n => plan().replace('## Out of scope\n', `## Out of scope\n${'x'.repeat(n)}\n`);
  const warned = check(long(13000), ['--plan']);
  assert.strictEqual(warned.code, 0, warned.out);
  assert.match(warned.out, /plan is valid \(warning: plan is \d+ characters, over the 12000 target/);
  const over = check(long(21000), ['--plan']);
  assert.strictEqual(over.code, 1);
  assert.match(over.out, /the budget is 20000/);
  assert.match(over.out, /condense the done sub-phases to their commits/, 'G2 finding 1: the message says what to condense');
});

test('a UI sub-phase no longer has to name frontend-design (D27, #9 §30 X4)', () => {
  const withSkill = dir => write(dir, '.claude/skills/frontend-design/SKILL.md', '---\nname: frontend-design\n---\n');
  const ui = plan({ phases: ['### 1. A\n- Files: src/pages/InvoicePage.jsx\n- Change: a\n- Check: check fast'] });
  assert.strictEqual(check(ui, ['--plan'], {}, withSkill).code, 0);
});

test('a complete plan is valid', () => {
  const r = check(plan(), ['--plan']);
  assert.strictEqual(r.code, 0, r.out);
});

test('a plan without "Rejected approaches" is invalid (F10)', () => {
  const r = check(plan().replace(/## Rejected approaches\n[^\n]*\n/, ''), ['--plan']);
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /Rejected approaches/);
});

test('a Small-tier plan has exactly one sub-phase (D18)', () => {
  const two = ['### 1. A\n- Files: a\n- Change: a\n- Check: check fast', '### 2. B\n- Files: b\n- Change: b\n- Check: check fast'];
  const r = check(plan({ tier: 'Small', phases: two }), ['--plan']);
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /exactly one sub-phase/);
  assert.strictEqual(check(plan({ tier: 'Standard', phases: two }), ['--plan']).code, 0);
  // A G2 fixes sub-phase that review appends (D26) doesn't count toward Small's one.
  const fixes = [two[0], '### 2. G2 fixes\n- Files: a\n- Change: fix 1\n- Check: check fast'];
  assert.strictEqual(check(plan({ tier: 'Small', phases: fixes }), ['--plan']).code, 0);
});

test('a sub-phase check must name a defined check, or give a reason for being manual (F14)', () => {
  const unknown = check(plan({ phases: ['### 1. A\n- Files: a\n- Change: a\n- Check: check nope'] }), ['--plan']);
  assert.match(unknown.out, /check "nope" isn't defined/);
  const noReason = check(plan({ phases: ['### 1. A\n- Files: a\n- Change: a\n- Check: manual'] }), ['--plan']);
  assert.match(noReason.out, /manual check needs a reason/);
  const withReason = check(plan({ phases: ['### 1. A\n- Files: a\n- Change: a\n- Check: manual — the layout only shows on a device'] }), ['--plan']);
  assert.strictEqual(withReason.code, 0, withReason.out);
  const defined = check(plan({ phases: ['### 1. A\n- Files: a\n- Change: a\n- Check: check api-smoke'] }), ['--plan']);
  assert.strictEqual(defined.code, 0, defined.out);
});
