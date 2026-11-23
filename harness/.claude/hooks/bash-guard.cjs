#!/usr/bin/env node
'use strict';
// H7: PreToolUse on Bash (D27, #9 §25). Refuses a `cat > <file>` or `cat >> <file>` that has no heredoc, no input
// redirect and no pipe in front of it: with nothing to read, `cat` waits on stdin forever. On D26 that hung
// InvoiceMe #171's review session for 24 minutes after the tool moved it to the background, and #172's build was
// stopped on the same command. Everything else passes untouched; a hook that can't read its input lets it through.

const { tag, repoRoot, log, readHookInput } = require('../lib/harness.cjs');

// Drop heredoc bodies, so text inside one (a script that mentions `cat > x`) isn't read as a command.
function withoutHeredocBodies(command) {
  const out = [];
  let until = null;
  for (const line of command.split(/\r?\n/)) {
    if (until !== null) { if (line.trim() === until) until = null; continue; }
    out.push(line);
    const m = line.match(/<<-?\s*(['"]?)([\w.-]+)\1/);
    if (m) until = m[2];
  }
  return out.join('\n');
}

// The first `cat` that writes a file from stdin with nothing to read, or null.
function catWithNoInput(command) {
  const text = withoutHeredocBodies(command);
  for (const list of text.split(/&&|\|\||[;\n]/)) {
    const first = list.split('|')[0].trim(); // a `cat` after a pipe has its input
    const m = first.match(/^(?:\w+=\S+\s+)*cat\s+(?:\d?>>?|>>)\s*(\S+)/);
    if (!m) continue;
    if (/<</.test(first) || /(^|\s)\d?<(?!<)/.test(first.replace(/\d?>>?\s*\S+/g, ''))) continue; // heredoc or `< file`
    return m[0];
  }
  return null;
}

function main() {
  let input;
  try { input = readHookInput(); } catch { return; }
  const command = input.tool_input && input.tool_input.command;
  if (typeof command !== 'string') return;
  const hit = catWithNoInput(command);
  if (!hit) return;
  try { log(repoRoot(), { tool: 'bash-guard', result: 'deny', command: hit }); } catch { /* not a repo: still refuse */ }
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse', permissionDecision: 'deny',
      permissionDecisionReason: tag('bash-guard', `"${hit}" has nothing to read, so it would wait on stdin forever. ` +
        'Write the file with the Write tool, or give cat a heredoc (cat > file <<\'EOF\' … EOF).'),
    },
  }));
}

if (require.main === module) main();
module.exports = { catWithNoInput };
