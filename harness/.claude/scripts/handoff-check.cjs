#!/usr/bin/env node
'use strict';
// S3: validates a handoff (OPTIMIZATION_PLAN.md §5.5) or, with --plan, a plan (§5.4).
// Usage: node .claude/scripts/handoff-check.cjs <file> [--plan] [--verify-head]
// Exit 0 valid · 1 invalid (problems listed) · 3 refused (BLOCKED, or the PR head moved; F3, F5) · 2 error.
// It fails closed: anything it can't confirm is a problem, not a pass.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { HarnessError, tag, repoRoot, workDir, loadConfig, log } = require('../lib/harness.cjs');

const MAX_CHARS = { handoff: 8000, plan: 12000 }; // ≈ 2k and 3k tokens at 4 characters per token (§5.2)

const HANDOFF_SECTIONS = ['Commits', 'Checks', 'Deviations from the plan', 'Decisions made inside the plan\'s latitude',
  'Docs', 'Open questions for G2', 'Known gaps / risks'];
const PLAN_SECTIONS = ['Scope (decided at G1)', 'Facts checked / corrected', 'Acceptance criteria', 'Sub-phases',
  'Rejected approaches', 'Invariants to preserve', 'Docs likely to go stale', 'Out of scope'];

class Refuse extends Error {}

// "## Heading" -> body text, for the level-2 sections of a markdown file.
function sections(text) {
  const out = new Map();
  let current = null;
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^##\s+(.+?)\s*$/);
    if (m) { current = m[1]; out.set(current, []); } else if (current) out.get(current).push(line);
  }
  return new Map([...out].map(([k, v]) => [k, v.join('\n').trim()]));
}

function requireSections(text, names, problems) {
  const s = sections(text);
  for (const name of names) {
    if (!s.has(name)) problems.push(`missing section "## ${name}"`);
    else if (!s.get(name)) problems.push(`section "## ${name}" is empty; write "none" if there is nothing`);
  }
  return s;
}

function gh(root, ...args) {
  const fake = process.env.HARNESS_GH;
  const [cmd, argv] = fake ? [process.execPath, [fake, ...args]] : ['gh', args];
  try { return execFileSync(cmd, argv, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { throw new HarnessError(`gh ${args.join(' ')} failed: ${String(e.stderr || e.message).trim()}`); }
}

function checkHandoff(root, cfg, text, { verifyHead }) {
  const problems = [];
  const field = re => (text.match(re) || [])[1];
  const issue = field(/^#\s*Handoff:\s*#(\d+)/m);
  const status = field(/^Status:\s*(READY|BLOCKED)\s*$/m);
  const branch = field(/Branch:\s*`?([^\s`·]+)`?/);
  const pr = field(/PR:\s*(\S+)/);
  const head = field(/PR head:\s*([0-9a-f]{7,40})\b/);
  const ci = field(/CI on that head:\s*(pass|fail|none)\b/);

  if (!issue) problems.push('first line must be "# Handoff: #<issue> → Review"');
  if (!status) problems.push('missing "Status: READY" or "Status: BLOCKED"');
  if (!field(/^Plan:\s*(\S+)/m)) problems.push('missing "Plan:"');
  if (!branch) problems.push('missing "Branch:"');

  // F5: a BLOCKED handoff, or a BLOCKED marker on disk, is never reviewed.
  if (status === 'BLOCKED') throw new Refuse('Status is BLOCKED; the owner decides how to proceed (§4, Block B)');
  if (issue && fs.existsSync(path.join(workDir(root), issue, 'BLOCKED')))
    throw new Refuse(`.claude/work/${issue}/BLOCKED exists; a READY handoff can't be reviewed while a check is failing`);

  if (!pr) problems.push('missing "PR:"');
  if (!head) problems.push('missing "PR head: <sha>"');
  if (!ci) problems.push('missing "CI on that head: pass|fail|none"');
  const ciRequired = (cfg.requiredCiChecks || []).length > 0;
  if (ci && ci !== 'pass' && (ci === 'fail' || ciRequired))
    problems.push(`READY needs CI to pass on the handed-off head; it says "${ci}"`);

  const s = requireSections(text, HANDOFF_SECTIONS, problems);
  if (s.has('Checks') && !/Not verifiable here:\s*\S/.test(s.get('Checks')))
    problems.push('the Checks section needs a "Not verifiable here: …" line (or "none")');

  // F3: the review is bound to one commit.
  if (verifyHead && head && pr && problems.length === 0) {
    let current;
    try { current = JSON.parse(gh(root, 'pr', 'view', pr, '--json', 'headRefOid')).headRefOid; }
    catch (e) { if (e instanceof HarnessError) throw e; throw new HarnessError(`unreadable gh output: ${e.message}`); }
    if (!current || !current.startsWith(head) && !head.startsWith(current))
      throw new Refuse(`the PR head moved: handoff says ${head}, the PR is now at ${current}. ` +
        'CI and the review must run on the new head (F3)');
  }
  return problems;
}

function checkPlan(cfg, text) {
  const problems = [];
  const header = text.match(/^#\s*Plan:\s*#(\d+).*?Tier:\s*(Standard|Small)\b/m);
  if (!header) problems.push('first line must be "# Plan: #<issue> <title> · Tier: Standard | Small"');
  if (!/^0\.\s.*\bbuild\b/m.test(text)) problems.push('missing step "0. Invoke the `build` skill …"');
  const s = requireSections(text, PLAN_SECTIONS, problems);

  if (s.has('Acceptance criteria') && !/^- \[ \]\s*\S/m.test(s.get('Acceptance criteria')))
    problems.push('Acceptance criteria needs at least one "- [ ] …" item');

  const body = s.get('Sub-phases') || '';
  const phases = body.split(/^###\s+/m).slice(1);
  if (s.has('Sub-phases') && phases.length === 0) problems.push('Sub-phases needs at least one "### 1. <name>"');
  if (header && header[2] === 'Small' && phases.length > 1)
    problems.push(`a Small-tier plan has exactly one sub-phase; this one has ${phases.length} (D18)`);
  phases.forEach((p, i) => {
    const name = `sub-phase ${i + 1}`;
    for (const key of ['Files', 'Change', 'Check']) if (!new RegExp(`^- ${key}:\\s*\\S`, 'm').test(p)) problems.push(`${name} needs "- ${key}: …"`);
    const check = (p.match(/^- Check:\s*(.+)$/m) || [])[1];
    if (check) {
      const id = (check.match(/^check\s+`?([\w-]+)`?/) || [])[1];
      if (id && !cfg.checks[id]) problems.push(`${name}: check "${id}" isn't defined in harness.json`);
      if (/^manual\b/i.test(check) && !/^manual\s*[—:-]\s*\S/i.test(check))
        problems.push(`${name}: a manual check needs a reason ("manual — <why it can't be automated>"; F14)`);
    }
  });
  return problems;
}

function run(root, file, { plan, verifyHead }) {
  const cfg = loadConfig(root);
  let text;
  try { text = fs.readFileSync(path.resolve(root, file), 'utf8'); } catch { throw new HarnessError(`can't read ${file}`); }
  const kind = plan ? 'plan' : 'handoff';
  const problems = plan ? checkPlan(cfg, text) : checkHandoff(root, cfg, text, { verifyHead });
  if (text.length > MAX_CHARS[kind])
    problems.push(`${kind} is ${text.length} characters; the budget is ${MAX_CHARS[kind]} (≈ ${MAX_CHARS[kind] / 4} tokens, §5.2)`);
  return { kind, problems };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const file = args.find(a => !a.startsWith('--'));
  const opts = { plan: args.includes('--plan'), verifyHead: args.includes('--verify-head') };
  if (!file) { console.error(tag('handoff-check', 'usage: handoff-check.cjs <file> [--plan] [--verify-head]')); process.exit(2); }
  let root;
  try {
    root = repoRoot();
    const { kind, problems } = run(root, file, opts);
    log(root, { tool: 'handoff-check', kind, file, result: problems.length ? 'invalid' : 'valid', problems: problems.length });
    if (problems.length) {
      console.error(tag('handoff-check', `${kind} is not valid:\n- ${problems.join('\n- ')}`));
      process.exit(1);
    }
    console.log(tag('handoff-check', `${kind} is valid`));
    process.exit(0);
  } catch (e) {
    const refused = e instanceof Refuse;
    if (root) log(root, { tool: 'handoff-check', file, result: refused ? 'refused' : 'error', message: e.message });
    console.error(tag('handoff-check', refused ? `REFUSED: ${e.message}` : (e instanceof HarnessError ? e.message : `unexpected error: ${e.stack || e}`)));
    process.exit(refused ? 3 : 2);
  }
}

module.exports = { checkHandoff, checkPlan, sections };
