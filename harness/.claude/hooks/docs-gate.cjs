#!/usr/bin/env node
'use strict';
// H4: PreToolUse on Bash, `if: Bash(git commit *)` (OPTIMIZATION_PLAN.md §6.2, D2, D10).
// Denies a commit while its code changes flag candidate docs that are neither in the commit nor
// acknowledged with an "ack: <doc> — <why>" line. The `if` filter is best-effort, so the command is
// re-checked here (F7): only an actual `git commit` is gated.

const { HarnessError, tag, repoRoot, loadConfig, log, readHookInput } = require('../lib/harness.cjs');
const { changedFiles, unresolved } = require('../scripts/stale-docs.cjs');

// Splits on shell separators and finds `git … commit …` segments; reports whether -a/--all stages more.
function commitSegments(command) {
  const segs = command.split(/&&|\|\||[;|\n]/).map(s => s.trim()).filter(Boolean);
  const re = /^(?:\w+=\S+\s+)*git(?:\s+(?:-C|-c)\s+(?:"[^"]*"|'[^']*'|\S+))*\s+commit\b(.*)$/;
  return segs.map(s => s.match(re)).filter(Boolean).map(m => ({ all: /\s(?:-[a-zA-Z]*a[a-zA-Z]*|--all)\b/.test(' ' + m[1]) }));
}

const deny = reason => process.stdout.write(JSON.stringify({
  hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason },
}));

function main() {
  let input;
  try { input = readHookInput(); }
  catch (e) { deny(tag('docs-gate', `${e.message}; commit not checked, so it is denied`)); return; }
  const command = input.tool_input && input.tool_input.command;
  if (typeof command !== 'string') return;
  const commits = commitSegments(command);
  if (!commits.length) return; // not a commit: nothing to gate

  let root;
  try {
    root = repoRoot();
    const cfg = loadConfig(root);
    let changes = changedFiles(root, { staged: true });
    if (commits.some(c => c.all)) {
      try {
        const seen = new Set(changes.map(c => c.file));
        for (const c of changedFiles(root, { workTree: true })) if (!seen.has(c.file)) changes.push(c);
      } catch { /* no HEAD yet: nothing tracked to add */ }
    }
    const open = unresolved(root, cfg, changes);
    log(root, { tool: 'docs-gate', result: open.length ? 'deny' : 'allow', open: open.length });
    if (!open.length) return;
    const docs = [...new Set(open.map(o => o.doc))];
    deny(tag('docs-gate', `this commit may leave ${docs.length} doc(s) stale:\n` +
      open.map(o => `- ${o.doc} ← ${o.file} (${o.rule})`).join('\n') +
      '\nUpdate each doc and add it to this commit, or, if it is still accurate, add a line to ' +
      '.claude/work/<issue>/stale-docs.md:  ack: <doc> — <why it is still accurate>'));
  } catch (e) {
    if (root) log(root, { tool: 'docs-gate', result: 'error', message: e.message });
    deny(tag('docs-gate', `couldn't check docs, so the commit is denied: ${e instanceof HarnessError ? e.message : e.message || e}`));
  }
}

main();
module.exports = { commitSegments };
