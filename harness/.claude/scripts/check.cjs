#!/usr/bin/env node
'use strict';
// S5: the named-check runner (OPTIMIZATION_PLAN.md §6.4, F7).
// Usage: node .claude/scripts/check.cjs <fast|full|id>
// Runs the check's commands in order and stops at the first failure. The exit code is that
// command's own code (124 on timeout), so trimming the output can never turn a failure into a pass.

const path = require('path');
const { HarnessError, tag, repoRoot, loadConfig, log, runArgv, tail } = require('../lib/harness.cjs');

const DEFAULT_TIMEOUT = { fast: 120, full: 600 };

async function runCheck(root, id, { print = s => process.stdout.write(s + '\n') } = {}) {
  const cfg = loadConfig(root);
  const cmds = cfg.checks[id];
  if (!cmds) throw new HarnessError(`unknown check "${id}"; known: ${Object.keys(cfg.checks).join(', ')}`);
  if (cmds.length === 0) {
    print(tag('check', `${id}: no commands configured, nothing to run`));
    return { code: 0, failed: null };
  }
  for (const [i, c] of cmds.entries()) {
    const timeoutSec = c.timeoutSec ?? DEFAULT_TIMEOUT[id] ?? 300;
    const r = await runArgv(c.run, { cwd: path.resolve(root, c.cwd || '.'), timeoutSec });
    const label = `${id}[${i}] ${c.run.join(' ')}${c.cwd ? ` (in ${c.cwd})` : ''}`;
    log(root, { tool: 'check', id, index: i, code: r.code, ms: r.ms, timedOut: r.timedOut });
    if (r.code !== 0) {
      const why = r.timedOut ? `timed out after ${timeoutSec}s` : `exit ${r.code}`;
      print(tag('check', `${id} FAILED at ${label}: ${why}`));
      const out = tail(r.output);
      print(out ? out : '(the command printed nothing)');
      return { code: r.code, failed: { index: i, label, timedOut: r.timedOut, output: out } };
    }
  }
  print(tag('check', `${id} passed (${cmds.length} command${cmds.length > 1 ? 's' : ''})`));
  return { code: 0, failed: null };
}

if (require.main === module) {
  (async () => {
    const id = process.argv[2];
    if (!id) { console.error(tag('check', 'usage: check.cjs <fast|full|id>')); process.exit(2); }
    try {
      const { code } = await runCheck(repoRoot(), id);
      process.exit(code);
    } catch (e) {
      console.error(tag('check', e instanceof HarnessError ? e.message : `unexpected error: ${e.stack || e}`));
      process.exit(2);
    }
  })();
}

module.exports = { runCheck };
