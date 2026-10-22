#!/usr/bin/env node
'use strict';
// H1: PostToolUse on Edit|Write (OPTIMIZATION_PLAN.md §6.2).
// Formats, then lints, the one edited file with its fileTools entry. The edit already happened, so a lint
// failure exits 2: Claude Code shows stderr to Claude, which fixes the file. Silent when there's nothing to say.

const path = require('path');
const { HarnessError, tag, repoRoot, loadConfig, log, runArgv, tail, readHookInput, matchesGlob, toPosix } = require('../lib/harness.cjs');

async function main() {
  let input;
  try { input = readHookInput(); }
  catch (e) { console.error(tag('file-check', `${e.message}; the edited file was not checked`)); return 2; }
  const file = input.tool_input && input.tool_input.file_path;
  if (!file) return 0; // not a file edit

  const root = repoRoot();
  const cfg = loadConfig(root);
  const abs = path.resolve(root, file);
  const rel = toPosix(path.relative(root, abs));
  if (rel.startsWith('..')) return 0; // outside the repo
  const entry = Object.entries(cfg.fileTools || {}).find(([glob]) => matchesGlob(rel, glob));
  if (!entry) return 0;
  const [glob, tools] = entry;

  for (const kind of ['format', 'lint']) {
    const t = tools[kind];
    if (!t) continue;
    const argv = t.run.map(a => a.split('{file}').join(abs));
    const r = await runArgv(argv, { cwd: path.resolve(root, t.cwd || '.'), timeoutSec: t.timeoutSec ?? 60 });
    log(root, { tool: 'file-check', kind, file: rel, code: r.code });
    if (r.code !== 0) {
      const what = kind === 'lint' ? 'lint errors' : 'the formatter failed';
      console.error(tag('file-check', `${rel}: ${what} (${glob}, exit ${r.code})\n${tail(r.output, 20) || '(no output)'}`));
      return 2;
    }
  }
  return 0;
}

main().then(code => process.exit(code), e => {
  console.error(tag('file-check', e instanceof HarnessError ? e.message : `unexpected error: ${e.message || e}`));
  process.exit(2);
});
