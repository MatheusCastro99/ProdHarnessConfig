#!/usr/bin/env node
'use strict';
// H3: PreToolUse on Bash — a fallback only (OPTIMIZATION_PLAN.md §6.2, F7).
// The skills run checks through S5. If Claude types a configured check command directly, this rewrites it
// to run through S5, which trims the output and keeps the exit code. The `if` filter is best-effort, so the
// command is re-checked here: anything that isn't exactly a configured command passes through untouched.

const path = require('path');
const { tag, repoRoot, loadConfig, readHookInput } = require('../lib/harness.cjs');

const norm = s => s.trim().replace(/\s+/g, ' ');

function findCommand(cfg, command) {
  const typed = norm(command);
  for (const [id, cmds] of Object.entries(cfg.checks)) {
    for (const [index, c] of cmds.entries()) {
      // A command with a cwd only matches when typed with that cd, so the rewrite never changes where it runs.
      const line = c.run.join(' ');
      const forms = c.cwd ? [`cd ${c.cwd} && ${line}`, `cd "${c.cwd}" && ${line}`] : [line];
      if (forms.some(f => norm(f) === typed)) return { id, index };
    }
  }
  return null;
}

function main() {
  let input;
  try { input = readHookInput(); } catch { return; } // can't tell what the command is: leave it alone
  const command = input.tool_input && input.tool_input.command;
  if (typeof command !== 'string') return;
  let cfg;
  try { cfg = loadConfig(repoRoot()); } catch { return; }
  const hit = findCommand(cfg, command);
  if (!hit) return;
  const runner = path.join(repoRoot(), '.claude', 'scripts', 'check.cjs');
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow',
      permissionDecisionReason: tag('quiet', `runs configured check ${hit.id}[${hit.index}] through the check runner`),
      updatedInput: { ...input.tool_input, command: `node "${runner}" ${hit.id} --index ${hit.index}` },
    },
  }));
}

main();
module.exports = { findCommand };
