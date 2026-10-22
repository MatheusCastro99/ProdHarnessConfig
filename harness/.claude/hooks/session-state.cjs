#!/usr/bin/env node
'use strict';
// H5: SessionStart on startup|clear (OPTIMIZATION_PLAN.md §6.2, D3, F4).
// One line of state per active issue, so a fresh session (or the /clear fallback after plan accept)
// knows where the work stands. Prints nothing when no issue is active.

const fs = require('fs');
const path = require('path');
const { repoRoot, workDir } = require('../lib/harness.cjs');

function stateLines(root) {
  const w = workDir(root);
  if (!fs.existsSync(w)) return [];
  const lines = [];
  for (const n of fs.readdirSync(w).filter(n => /^\d+$/.test(n)).sort()) {
    const d = path.join(w, n);
    const blocked = path.join(d, 'BLOCKED');
    const handoff = path.join(d, 'handoff.md');
    if (fs.existsSync(blocked)) {
      const check = (fs.readFileSync(blocked, 'utf8').match(/^check:\s*(\S+)/m) || [])[1] || 'a check';
      lines.push(`#${n} is BLOCKED on ${check} → owner decision (see .claude/work/${n}/BLOCKED); don't push or hand off`);
    } else if (fs.existsSync(handoff)) {
      lines.push(/^Status:\s*BLOCKED/m.test(fs.readFileSync(handoff, 'utf8'))
        ? `Handoff for #${n} is BLOCKED → owner decision`
        : `Handoff for #${n} ready → run /review`);
    } else if (fs.existsSync(path.join(d, 'plan.md'))) {
      lines.push(`Plan for #${n} in progress → Block B: invoke the build skill with .claude/work/${n}/plan.md`);
    }
  }
  return lines.slice(0, 3);
}

try {
  try { fs.readFileSync(0, 'utf8'); } catch { /* input not needed */ }
  const lines = stateLines(repoRoot());
  if (lines.length) process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: `[harness session-state] ${lines.join(' · ')}` },
  }));
} catch { /* state is a convenience; a fresh session works without it */ }

module.exports = { stateLines };
