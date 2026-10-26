'use strict';
// Static checks on what gets installed: settings.json, the project configs, and the §5.2 size budgets.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { HARNESS } = require('./helpers.cjs');
const { validateConfig } = require('../harness/.claude/lib/harness.cjs');

const read = rel => fs.readFileSync(path.join(HARNESS, rel), 'utf8');
const tokens = text => Math.ceil(text.length / 4); // the budget's own rule of thumb (§5.2)

const frontmatter = text => {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!m) return null;
  return Object.fromEntries(m[1].split(/\r?\n/).map(l => l.match(/^([\w-]+):\s*(.*)$/)).filter(Boolean).map(x => [x[1], x[2]]));
};

test('settings.json: valid JSON, every hook runs an existing script through node, every handler has a timeout', () => {
  const s = JSON.parse(read('settings.json'));
  const events = { PostToolUse: 1, Stop: 1, PreToolUse: 2, SessionStart: 1 };
  for (const [event, n] of Object.entries(events)) {
    const handlers = s.hooks[event].flatMap(g => g.hooks);
    assert.strictEqual(handlers.length, n, event);
    for (const h of handlers) {
      assert.strictEqual(h.type, 'command');
      assert.strictEqual(h.command, 'node', 'exec form, no shell (§6.1)');
      assert.ok(Number.isFinite(h.timeout) && h.timeout > 0, `${event} needs a timeout`);
      const script = h.args[0].replace('${CLAUDE_PROJECT_DIR}/.claude/', '');
      assert.ok(fs.existsSync(path.join(HARNESS, script)), `${script} exists`);
    }
  }
  assert.strictEqual(s.model, 'opusplan', 'D12');
  assert.strictEqual(s.effortLevel, 'high', 'D13');
  assert.strictEqual(s.env.CLAUDE_CODE_SUBAGENT_MODEL, 'sonnet', 'D14');
  assert.strictEqual(s.showClearContextOnPlanAccept, true, 'D3');
});

test('settings.json: the Stop gate\'s timeout exceeds the slowest project\'s fast checks', () => {
  const stop = JSON.parse(read('settings.json')).hooks.Stop[0].hooks[0].timeout;
  for (const p of fs.readdirSync(path.join(__dirname, '..', 'projects'))) {
    const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'projects', p, 'harness.json'), 'utf8'));
    const worst = cfg.checks.fast.reduce((a, c) => a + (c.timeoutSec || 120), 0);
    assert.ok(stop > worst + 30, `${p}: Stop timeout ${stop}s vs fast checks up to ${worst}s`);
  }
});

test('settings.json: pushes to either default-branch name, force pushes and merges are denied', () => {
  const deny = JSON.parse(read('settings.json')).permissions.deny;
  for (const r of ['Bash(git push * main)', 'Bash(git push * master)', 'Bash(git push --force *)', 'Bash(gh pr merge *)'])
    assert.ok(deny.includes(r), r);
});

test('project harness.json files are valid and name their required CI checks', () => {
  for (const p of fs.readdirSync(path.join(__dirname, '..', 'projects'))) {
    const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'projects', p, 'harness.json'), 'utf8'));
    assert.doesNotThrow(() => validateConfig(cfg), p);
    assert.ok(cfg.requiredCiChecks.length > 0, `${p} requiredCiChecks`);
  }
});

test('reviewOnReady is validated (A6)', () => {
  const base = { defaultBranch: 'main', checks: { fast: [], full: [] } };
  assert.doesNotThrow(() => validateConfig({ ...base, reviewOnReady: { workflow: 'claude-code-review.yml', timeoutMin: 15 } }));
  assert.throws(() => validateConfig({ ...base, reviewOnReady: { workflow: '../evil.sh' } }), /reviewOnReady/);
  assert.throws(() => validateConfig({ ...base, reviewOnReady: { workflow: 'r.yml', timeoutMin: 0 } }), /timeoutMin/);
  const bbh = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'projects', 'BabyBuddyHelper', 'harness.json'), 'utf8'));
  assert.strictEqual(bbh.reviewOnReady.workflow, 'claude-code-review.yml');
  assert.ok(fs.existsSync(path.join(__dirname, '..', '..', 'BabyBuddyHelper', '.github', 'workflows', bbh.reviewOnReady.workflow)) ||
    !fs.existsSync(path.join(__dirname, '..', '..', 'BabyBuddyHelper')), 'the workflow exists in the local clone, when there is one');
});

test('CLAUDE.md template is within the 3k-token budget (§5.2)', () => {
  const t = tokens(read('CLAUDE.md'));
  assert.ok(t <= 3000, `CLAUDE.md ≈ ${t} tokens`);
});

test('each skill has frontmatter and a body within 2.5k tokens (§5.2)', () => {
  for (const s of ['scope', 'build', 'review', 'close']) {
    const text = read(`skills/${s}/SKILL.md`);
    const fm = frontmatter(text);
    assert.ok(fm && fm.name === s && fm.description, `${s} frontmatter`);
    const t = tokens(text);
    assert.ok(t <= 2500, `${s} ≈ ${t} tokens`);
  }
  // Only the owner starts Blocks A and D; build and review are also invoked by the workflow itself.
  assert.strictEqual(frontmatter(read('skills/scope/SKILL.md'))['disable-model-invocation'], 'true');
  assert.strictEqual(frontmatter(read('skills/close/SKILL.md'))['disable-model-invocation'], 'true');
});

test('agents pin their models and can\'t edit files (D13, D14, §7.2)', () => {
  const expect = { 'red-team': 'opus', surveyor: 'sonnet' };
  for (const [name, model] of Object.entries(expect)) {
    const fm = frontmatter(read(`agents/${name}.md`));
    assert.strictEqual(fm.name, name);
    assert.strictEqual(fm.model, model);
    assert.strictEqual(fm.effort, 'high');
    assert.match(fm.disallowedTools, /Edit/);
    assert.match(fm.disallowedTools, /Write/);
  }
});

test('the handoff and plan templates in the skills pass handoff-check\'s own rules', () => {
  const { checkPlan } = require('../harness/.claude/scripts/handoff-check.cjs');
  const scope = read('skills/scope/SKILL.md');
  const planTemplate = scope.match(/```markdown\n([\s\S]*?)```/)[1];
  // Every section the checker requires appears in the template the skill teaches.
  for (const s of ['Scope (decided at G1)', 'Facts checked / corrected', 'Acceptance criteria', 'Sub-phases',
    'Rejected approaches', 'Invariants to preserve', 'Docs likely to go stale', 'Out of scope'])
    assert.ok(planTemplate.includes(`## ${s}`), `plan template has ## ${s}`);
  const build = read('skills/build/SKILL.md');
  for (const s of ['Commits', 'Checks', 'Deviations from the plan', 'Decisions made inside the plan\'s latitude',
    'Docs', 'Open questions for G2', 'Known gaps / risks'])
    assert.ok(build.includes(`## ${s}`), `handoff template has ## ${s}`);
  assert.ok(typeof checkPlan === 'function');
});

test('working state lives in .harness/work/, outside .claude/ (V0, F-V0-1)', () => {
  // Claude Code treats every file under .claude/ as sensitive: writes there are refused headless and prompt the
  // owner each time in the app, even with an allow rule. The plan, acks and handoff are written there all the time.
  const { workDir } = require(path.join(HARNESS, 'lib', 'harness.cjs'));
  const root = path.resolve('repo');
  assert.strictEqual(path.relative(root, workDir(root)), path.join('.harness', 'work'));
  for (const skill of ['scope', 'build', 'review', 'close']) {
    const text = fs.readFileSync(path.join(HARNESS, 'skills', skill, 'SKILL.md'), 'utf8');
    assert.doesNotMatch(text, /\.claude\/work/, `${skill} still points at .claude/work`);
  }
});

test('Block B runs forked on the Sonnet builder, gated on SubagentStop (D12, research/06)', () => {
  // A skill's `model:` doesn't switch the main session (V1, #97); a forked skill runs on its agent's model.
  const fm = frontmatter(read('skills/build/SKILL.md'));
  assert.deepStrictEqual([fm.context, fm.agent, fm.background, fm.model], ['fork', 'builder', 'false', undefined]);
  for (const s of ['scope', 'review', 'close']) assert.strictEqual(frontmatter(read(`skills/${s}/SKILL.md`)).context, undefined, `${s} runs in the session`);
  const builder = frontmatter(read('agents/builder.md'));
  assert.deepStrictEqual([builder.name, builder.model, builder.effort], ['builder', 'sonnet', 'high']);
  assert.strictEqual(builder.disallowedTools, undefined, 'the builder edits files');
  // H2 must run on SubagentStop, matched to the builder: a frontmatter Stop hook didn't fire in the fork (check 3).
  const sub = JSON.parse(read('settings.json')).hooks.SubagentStop;
  assert.strictEqual(sub.length, 1);
  assert.strictEqual(sub[0].matcher, 'builder');
  assert.deepStrictEqual(sub[0].hooks.map(h => h.args[0].split('/').pop()), ['check-gate.cjs', 'finish-guard.cjs']);
  const body = read('skills/build/SKILL.md');
  assert.match(body, /foreground/);
  assert.match(body, /QUESTION: <the question>/);
});

test('Auto-fix is off from the handoff to the merge, though the fork has no PR tools (research/06, check 8)', () => {
  // In #135 Auto-fix was switched on during Block B and stayed on until Block C, because the fork has no app tools.
  assert.ok(read('skills/build/SKILL.md').includes('MAIN SESSION: turn off Auto-fix for <PR url> if it is on.'));
  const review = read('skills/review/SKILL.md');
  const step1 = review.slice(review.indexOf('## 1.'), review.indexOf('## 2.'));
  const first = step1.split(/\r?\n/).find(l => l.startsWith('- '));
  assert.ok(first.includes('Auto-fix) is on for the PR, turn it off'), 'it comes first in step 1');
  // Only the fork reads the build skill; in #72 the main session got the line and left Auto-fix on (research/08).
  const workflow = read('CLAUDE.md').split('## Workflow')[1].split('\n## ')[0];
  assert.ok(workflow.includes('`MAIN SESSION:` line, do what it says'), 'the main session is told to act on the line');
});

test('each project\'s installed harness.json matches its source here, when the clone is local (research/08)', () => {
  // A plan may change a project's checks (#72 added api-test). The change must come back here, or the next install
  // refuses the local edit, and the source silently describes checks the project no longer has.
  for (const p of fs.readdirSync(path.join(__dirname, '..', 'projects'))) {
    const installed = path.join(__dirname, '..', '..', p, '.claude', 'harness.json');
    if (!fs.existsSync(installed)) continue;
    const source = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'projects', p, 'harness.json'), 'utf8'));
    assert.deepStrictEqual(JSON.parse(fs.readFileSync(installed, 'utf8')), source, `${p}: port .claude/harness.json back to projects/${p}/`);
  }
});
