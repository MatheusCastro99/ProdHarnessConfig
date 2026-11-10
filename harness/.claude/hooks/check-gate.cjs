#!/usr/bin/env node
'use strict';
// H2: the Stop gate (Evidence/OPTIMIZATION_PLAN.md §6.2, P4, F5).
// While an issue is active, Claude can't stop with failing fast checks. After 3 consecutive failures it
// writes .harness/work/<issue>/BLOCKED and lets Claude stop, so the owner decides (never a silent handoff).
// A failure the owner sent to an open issue at G2 is listed in .harness/work/<issue>/known-failures.md
// ("<text that names it> — #<issue>"). When every failing line names a known one, the gate reports instead
// of blocking (D26). Anything else still blocks.

const fs = require('fs');
const path = require('path');
const { tag, repoRoot, workDir, log, activeIssue, fingerprint, readHookInput } = require('../lib/harness.cjs');
const { runCheck } = require('../scripts/check.cjs');

const MAX_FAILURES = 3; // below Claude Code's own cap of 8: each forced continuation is a full-context call
// Lines test runners use to mark one failure: Vitest and Jest "FAIL", pytest and cargo "FAILED", dotnet test
// "  Failed <test>", TAP "not ok", and ✗ ✖ ×. Case-sensitive on purpose: summary counts ("1 failed") don't match.
const FAIL_LINE = /\bFAIL(ED)?\b|^\s*Failed\s|\bnot ok\b|[✗✖×]/;

function knownFailures(root, issue) {
  let text = '';
  try { text = fs.readFileSync(path.join(workDir(root), issue, 'known-failures.md'), 'utf8'); } catch { return []; }
  return [...text.matchAll(/^\s*[-*]?\s*`?(.+?)`?\s+[—-]+\s+#(\d+)\s*$/gm)].map(m => ({ text: m[1].trim(), issue: m[2] }));
}

// The known entries behind a failure, or null. It fails closed: there must be failure lines, every one must name
// a known entry, and an output whose failures it can't recognise blocks as before.
function onlyKnown(output, known) {
  const lines = output.split(/\r?\n/).filter(l => FAIL_LINE.test(l));
  if (!lines.length || !lines.every(l => known.some(k => l.includes(k.text)))) return null;
  return known.filter(k => lines.some(l => l.includes(k.text)));
}

const readJson = (f, dflt) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return dflt; } };
const emit = obj => process.stdout.write(JSON.stringify(obj));

async function main() {
  try { readHookInput(); } catch { /* the gate needs nothing from the input; checks are deterministic */ }
  const root = repoRoot();
  const issue = activeIssue(root);
  if (!issue) return; // not a harness work session

  const lastPassFile = path.join(workDir(root), '.lastpass');
  const stateFile = path.join(workDir(root), issue, 'gate.json');
  const blockedFile = path.join(workDir(root), issue, 'BLOCKED');

  let fp = null;
  try { fp = fingerprint(root); } catch { /* can't prove nothing changed, so run the checks */ }
  if (fp && fs.existsSync(lastPassFile) && fs.readFileSync(lastPassFile, 'utf8').trim() === fp) return;

  const state = readJson(stateFile, { failures: 0 });
  if (fp && fs.existsSync(blockedFile) && state.blockedFp === fp) return; // still blocked; nothing changed since
  if (fp && state.knownFp === fp) return; // only the known failure, and nothing changed since

  const printed = [];
  const result = await runCheck(root, 'fast', { print: s => printed.push(s) });

  if (result.code === 0) {
    if (fp) fs.writeFileSync(lastPassFile, fp);
    fs.writeFileSync(stateFile, JSON.stringify({ failures: 0 }));
    const wasBlocked = fs.existsSync(blockedFile);
    fs.rmSync(blockedFile, { force: true });
    log(root, { tool: 'check-gate', issue, result: 'pass', unblocked: wasBlocked });
    return;
  }

  const f = result.failed;
  const hits = onlyKnown(String(f.fullOutput || f.output || ''), knownFailures(root, issue));
  if (hits) {
    fs.writeFileSync(stateFile, JSON.stringify({ failures: state.failures, knownFp: fp }));
    log(root, { tool: 'check-gate', issue, result: 'known', code: result.code, known: hits.map(k => `#${k.issue}`) });
    emit({ systemMessage: tag('check-gate', `fast checks fail, but only on a known failure the owner sent to ` +
      `${hits.map(k => `#${k.issue} (${k.text})`).join(', ')}. Not blocking. Mention it in your report.`) });
    return;
  }

  const failures = state.failures + 1;
  const detail = [`Failing check: ${f.label}`, `Exit: ${f.timedOut ? 'timeout' : result.code}`, f.output].join('\n');

  if (failures >= MAX_FAILURES) {
    fs.writeFileSync(blockedFile, `check: fast\nexit: ${result.code}\nfailures: ${failures}\n\n${detail}\n`);
    fs.writeFileSync(stateFile, JSON.stringify({ failures, blockedFp: fp }));
    log(root, { tool: 'check-gate', issue, result: 'blocked', code: result.code, failures });
    emit({ systemMessage: tag('check-gate', `#${issue} is BLOCKED: fast checks failed ${failures} times in a row. ` +
      `Don't push or hand off. The owner decides: amend the plan, resume in a fresh Opus session, or stop. ` +
      `Details: .harness/work/${issue}/BLOCKED`) });
    return;
  }

  fs.writeFileSync(stateFile, JSON.stringify({ failures }));
  log(root, { tool: 'check-gate', issue, result: 'block', code: result.code, failures });
  emit({ decision: 'block', reason: tag('check-gate', `fast checks failed (attempt ${failures}/${MAX_FAILURES}).\n${detail}\n` +
    'Fix this specific failure before stopping; don\'t change the hook or the check configuration.') });
}

if (require.main === module) main().catch(e => {
  // A broken gate must be visible, not a silent pass; it reports and lets Claude stop.
  emit({ systemMessage: tag('check-gate', `the Stop gate itself failed: ${e.message || e}`) });
});

module.exports = { knownFailures, onlyKnown, FAIL_LINE };
