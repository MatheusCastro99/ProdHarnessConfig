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
    const m = line.match(/(?<!<)<<-?\s*(['"]?)([\w.-]+)\1/); // not a <<< here-string
    if (m) until = m[2];
  }
  return out.join('\n');
}

// Quoted text becomes one placeholder word (Q), so a separator or `cat > x` inside a commit message or an issue
// body isn't read as a command. An escaped character outside quotes becomes "_". An unclosed quote runs to the end.
function maskQuotes(text) {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '\\') { out += '_'; i++; continue; }
    if (ch !== "'" && ch !== '"') { out += ch; continue; }
    let j = i + 1;
    while (j < text.length && text[j] !== ch) j += ch === '"' && text[j] === '\\' ? 2 : 1;
    out += 'Q';
    i = j;
  }
  return out;
}

// Simple commands, each with whether a pipe feeds it. Splits on ; & && || | |& newlines, ( ) { }, backticks
// and $( ), so a cat inside a subshell, a group, an if or a command substitution is seen too.
function segments(text) {
  const out = [];
  let cur = '', piped = false;
  const end = nextPiped => { out.push({ text: cur, piped }); cur = ''; piped = nextPiped; };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], two = text.slice(i, i + 2);
    if (two === '&&' || two === '||') { end(false); i++; continue; }
    if (two === '|&') { end(true); i++; continue; }
    if (two === '$(') { end(false); i++; continue; }
    if (ch === '|') { end(true); continue; }
    if (ch === '&' && !/[<>]/.test(text[i - 1] || '') && text[i + 1] !== '>') { end(false); continue; }
    if (';\n()`{}'.includes(ch)) { end(false); continue; }
    cur += ch;
  }
  end(false);
  return out;
}

const PREFIX = /^(?:!|then|do|else|elif|time|nohup|command|exec|env|sudo(?:\s+-\w+)*|\w+=\S*)\s+/;
const REDIRECT = /(\d*|&)(>>|>\||>&|>|<<<|<<|<)\s*(\S*)/g;

// The first `cat` that writes stdout somewhere while reading stdin with nothing to read, or null.
function catWithNoInput(command) {
  for (const seg of segments(maskQuotes(withoutHeredocBodies(command)))) {
    if (seg.piped) continue; // a cat after a pipe has its input
    let s = seg.text.trim(), prev;
    do { prev = s; s = s.replace(PREFIX, ''); } while (s !== prev);
    if (!/^cat(?=[\s<>]|$)/.test(s)) continue;
    const redirects = [...s.slice(3).matchAll(REDIRECT)];
    const input = redirects.some(r => (r[1] === '' || r[1] === '0') && r[2].startsWith('<'));
    const output = redirects.some(r => r[1] !== '' && r[1] !== '1' && r[1] !== '&' ? false : r[2].startsWith('>'));
    if (input || !output) continue;
    const words = s.slice(3).replace(REDIRECT, ' ').split(/\s+/).filter(Boolean);
    let files = false, options = true;
    for (const w of words) {
      if (options && w === '--') { options = false; continue; }
      if (w === '-') continue; // stdin, explicitly
      if (options && w.startsWith('-')) continue;
      files = true;
    }
    if (!files) return seg.text.trim();
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
