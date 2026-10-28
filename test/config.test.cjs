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
  const planTemplate = scope.match(/```markdown\r?\n([\s\S]*?)```/)[1]; // a Windows checkout with autocrlf has CRLF
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

test('a local edit to a project\'s installed harness.json is ported back here, when the clone is local (research/08)', () => {
  // A plan may change a project's checks (#72 added api-test). The change must come back here, or the next install
  // refuses the local edit, and the source silently describes checks the project no longer has. A file still as the
  // last install wrote it is fine even when the source has moved on: that is an install not yet run, not drift.
  const lfHash = f => require('crypto').createHash('sha256').update(fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n')).digest('hex');
  for (const p of fs.readdirSync(path.join(__dirname, '..', 'projects'))) {
    const claude = path.join(__dirname, '..', '..', p, '.claude');
    const installed = path.join(claude, 'harness.json');
    if (!fs.existsSync(installed)) continue;
    const manifest = JSON.parse(fs.readFileSync(path.join(claude, 'harness-manifest.json'), 'utf8'));
    if (lfHash(installed) === manifest.files['.claude/harness.json']) continue;
    const source = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'projects', p, 'harness.json'), 'utf8'));
    assert.deepStrictEqual(JSON.parse(fs.readFileSync(installed, 'utf8')), source, `${p}: port .claude/harness.json back to projects/${p}/`);
  }
});

test('each project\'s own skills are docs, so the docs gate flags them (D21a, research/08)', () => {
  // In #72 guardrails-review was given a line that went stale in #73, and the docs gate couldn't see it.
  const { matchesGlob } = require('../harness/.claude/lib/harness.cjs');
  const harnessSkills = fs.readdirSync(path.join(HARNESS, 'skills'));
  for (const p of fs.readdirSync(path.join(__dirname, '..', 'projects'))) {
    const dir = path.join(__dirname, '..', 'projects', p);
    const cfg = JSON.parse(fs.readFileSync(path.join(dir, 'harness.json'), 'utf8'));
    const install = fs.existsSync(path.join(dir, 'install.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'install.json'), 'utf8')) : {};
    const skills = new Set(install.redTeamSkills || []);
    const local = path.join(__dirname, '..', '..', p, '.claude', 'skills');
    const vendored = Object.keys(install.vendoredSkills || {});
    if (fs.existsSync(local)) for (const s of fs.readdirSync(local)) if (!harnessSkills.includes(s) && !vendored.includes(s)) skills.add(s);
    assert.ok(skills.size > 0, `${p} has project skills`);
    for (const s of skills)
      assert.ok(cfg.docs.some(g => matchesGlob(`.claude/skills/${s}/SKILL.md`, g)), `${p}: .claude/skills/${s}/SKILL.md is in docs`);
    for (const s of [...harnessSkills, ...vendored])
      assert.ok(!cfg.docs.some(g => matchesGlob(`.claude/skills/${s}/SKILL.md`, g)), `${p}: the harness's own ${s} skill stays out of docs`);
  }
});

test('on the Small tier the fork writes a handoff and the main session runs review on Opus (D22, research/09)', () => {
  // #134: Small said "no handoff file", so the finish guard blocked the fork; and "continue in this session with
  // review" ran G2 inside the Sonnet fork. Both tiers now hand off, and only the main session runs review.
  const build = read('skills/build/SKILL.md');
  const exit = build.slice(build.indexOf('5. **Handoff'), build.indexOf('## Never'));
  assert.ok(exit.startsWith('5. **Handoff, on both tiers:**'), 'the handoff step is not Standard-only');
  assert.doesNotMatch(build, /no handoff file/i);
  assert.ok(exit.includes("Don't run `review` yourself"));
  assert.ok(exit.includes('MAIN SESSION: run the review skill for #<n> now (Small tier, this session).'));
  const review = read('skills/review/SKILL.md');
  const step1 = review.slice(review.indexOf('## 1.'), review.indexOf('## 2.'));
  assert.ok(step1.includes('**Both tiers:**') && step1.includes('--verify-head'), 'Small binds the review to the handoff SHA too');
  assert.doesNotMatch(step1, /\*\*Small:\*\*/);
  assert.match(frontmatter(review).description, /main session runs it when the forked build returns/);
  // The finish guard needs no Small exception: a handoff now exists on both tiers.
  assert.doesNotMatch(fs.readFileSync(path.join(HARNESS, 'hooks', 'finish-guard.cjs'), 'utf8'), /small/i);
});

test('the build updates the docs a change makes untrue, even when the plan narrows the files (D21b)', () => {
  // #73's plan allowed only NODEAPI/tests/, so a stale skill line was deferred and needed a second PR (#127).
  const docs = read('skills/build/SKILL.md').split('4. **Docs:**')[1].split('5. **Commit**')[0];
  assert.ok(docs.includes('even when the plan limits the files'), 'the docs step overrides a narrowed file list');
  assert.ok(docs.includes('Docs'), 'the change is listed in the handoff');
});

test('only the scope skill briefs the surveyor, and only with a Survey (D23, ProdHarnessConfig#1)', () => {
  // The pilot briefed it only in Block A. The forked builder is already Sonnet in a fresh context,
  // and the red-team reads the full diff, so the Block B and C roles went.
  for (const skill of ['build', 'review', 'close']) {
    assert.doesNotMatch(read(`skills/${skill}/SKILL.md`), /surveyor/, `${skill} briefs the surveyor`);
  }
  const scope = read('skills/scope/SKILL.md');
  assert.match(scope, /Brief the `surveyor` with a \*\*Survey\*\*/);
  assert.ok(scope.includes('read them yourself instead, on either tier (D23)'), 'a few named files are read directly');
  const surveyor = read('agents/surveyor.md');
  assert.match(frontmatter(surveyor).description, /only by the scope skill/);
  assert.doesNotMatch(surveyor, /\*\*Read\*\*|Change summary|Block B|Block C/);
});

test('the D24 trials are wired into scope, build and review (research/10)', () => {
  const scope = read('skills/scope/SKILL.md');
  assert.ok(scope.includes('**The smallest complete change (T1, D24):**'));
  assert.match(scope, /Never cut validation at trust boundaries, error handling, security or accessibility/);
  assert.match(scope, /UI \(T6, T7\):\*\* its check is the app driven through the platform's built-in UI automation plus screenshots: the browser pane for a web app; for a Windows desktop app, PowerShell `UIAutomationClient`/);
  const build = read('skills/build/SKILL.md');
  assert.match(build, /`frontend-design` skill if it has one \(T7\)/);
  assert.match(build, /\*\*A UI check \(T6\):\*\*[\s\S]*Save its screenshots under `\.harness\/work\/<n>\/ui\/`/);
  const review = read('skills/review/SKILL.md');
  const brief = review.slice(review.indexOf('## 2.'), review.indexOf('## 3.'));
  assert.ok(brief.includes('**Error-handling lens (T4, D24),**'), 'T4 is part of the red-team brief');
  assert.ok(brief.includes('**Security pass (T5),**') && brief.includes('git rev-parse HEAD') && brief.includes('built-in `security-review`'));
  assert.ok(review.includes('`red-team`, `red-team T4`, `security-review T5`, `PR comment` or `reviewOnReady`'), 'each finding names its source');
  assert.ok(fs.existsSync(path.join(__dirname, '..', 'Evidence', 'research', '10-trials.md')), 'the trial register exists');
});

test('vendored skills are pinned, licensed and kept out of docs (D24)', () => {
  for (const p of fs.readdirSync(path.join(__dirname, '..', 'projects'))) {
    const dir = path.join(__dirname, '..', 'projects', p);
    const f = path.join(dir, 'install.json');
    const vendored = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')).vendoredSkills || {} : {};
    for (const [name, v] of Object.entries(vendored)) {
      assert.match(v.commit, /^[0-9a-f]{40}$/, `${p}/${name} is pinned to a commit`);
      assert.ok(v.source.includes(v.commit), `${p}/${name}: the source URL names the pinned commit`);
      const skill = path.join(dir, 'vendor', 'skills', name);
      assert.ok(fs.existsSync(path.join(skill, 'SKILL.md')), `${p}/${name} has its SKILL.md`);
      assert.ok(fs.readdirSync(skill).some(x => /^LICEN[SC]E/i.test(x)), `${p}/${name} ships its license`);
      // Policy: no third-party scripts or hooks come in with a vendored skill.
      assert.ok(!fs.readdirSync(skill, { recursive: true }).some(x => /\.(c?js|mjs|sh|ps1|cmd|exe|py)$/i.test(x)), `${p}/${name} ships no scripts`);
    }
  }
});

test('D25: the UI check stays in the builder on safe data, the tier comes from the plan, and the owner answers by number (research/11)', () => {
  const claude = read('CLAUDE.md'), workflow = claude.split('## Workflow')[1].split('\n## ')[0];
  // C1: #149 and #151 ran the UI check in the Opus main session ($1.42 and $2.73), and #151 wrote to the owner's data.
  assert.ok(workflow.includes("the fork can't reach the app's PR tools. It drives the browser pane and runs the UI check itself."));
  const scope = read('skills/scope/SKILL.md');
  assert.ok(scope.includes('The builder runs it, on either tier; never route it to the main session (D25).'));
  assert.ok(scope.includes('Never plan a write to the owner\'s data, even one undone afterwards.'));
  const build = read('skills/build/SKILL.md');
  assert.ok(build.includes("**A UI check (T6):** run it yourself, on either tier") && build.includes("Don't hand it to the main session (D25)."));
  // C2: on all 3 Small runs the fork ended with Standard's line; the plan's tier now decides on both sides.
  const step6 = build.slice(build.indexOf('6. **Then stop.'), build.indexOf('## Never'));
  assert.ok(step6.includes("Take the tier from the plan's first line (`Tier: Standard` or `Tier: Small`) and end with that tier's line only (D25)."));
  assert.ok(workflow.includes("the approved plan's tier decides, not the fork's reply."));
  assert.ok(scope.includes("The approved plan's tier decides, not the fork's reply (D25)."));
  // C3: on 5 of 5 Standard runs "continue <n>" read before building; on #139 it waited for a go.
  assert.ok(workflow.includes('"continue <n>" means: invoke `build` for <n> at once.'));
  // C4 is enforced by handoff-check (test/handoff-check.test.cjs); C5: #149 kept Small after 5 decisions.
  assert.ok(scope.includes('`frontend-design: used for <what>` or `frontend-design: not needed, because <why>`'));
  assert.ok(scope.includes('**Then check the tier again (D25),**'));
  // C8: on #139 a follow-up question went unanswered and had to be asked again.
  const review = read('skills/review/SKILL.md');
  assert.ok(review.includes('### Decisions for you') && review.includes('**Number every open decision under "Decisions for you" (D25)**'));
});
