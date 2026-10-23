#!/usr/bin/env node
'use strict';
// H6: SubagentStop for the builder (research/06, check 9). A forked build may only return when it is
// done: a handoff exists, BLOCKED exists, or its last message asks a QUESTION. Otherwise it is told to keep
// going. After 3 blocks in a row it lets the fork return, with a visible message, so it can't loop forever.

const fs = require('fs');
const path = require('path');
const { tag, repoRoot, workDir, log, activeIssue, readHookInput } = require('../lib/harness.cjs');

const MAX_BLOCKS = 3;
const emit = obj => process.stdout.write(JSON.stringify(obj));

let input = {};
try { input = readHookInput(); } catch { /* without input the QUESTION check can't pass; the file checks still can */ }
const root = repoRoot();
const issue = activeIssue(root);
if (issue) {
  const dir = path.join(workDir(root), issue);
  const stateFile = path.join(dir, 'finish.json');
  const done = fs.existsSync(path.join(dir, 'handoff.md')) || fs.existsSync(path.join(dir, 'BLOCKED')) ||
    /^QUESTION:/m.test(String(input.last_assistant_message || ''));
  if (done) {
    fs.rmSync(stateFile, { force: true });
    log(root, { tool: 'finish-guard', issue, result: 'done' });
  } else {
    let blocks = 0;
    try { blocks = JSON.parse(fs.readFileSync(stateFile, 'utf8')).blocks || 0; } catch { /* first block */ }
    blocks += 1;
    if (blocks > MAX_BLOCKS) {
      fs.rmSync(stateFile, { force: true });
      log(root, { tool: 'finish-guard', issue, result: 'gave-up', blocks: blocks - 1 });
      emit({ systemMessage: tag('finish-guard', `#${issue}: the build returned unfinished ${MAX_BLOCKS} times; it is not done. Tell the owner.`) });
    } else {
      fs.writeFileSync(stateFile, JSON.stringify({ blocks }));
      log(root, { tool: 'finish-guard', issue, result: 'block', blocks });
      emit({ decision: 'block', reason: tag('finish-guard', `the build isn't finished: there's no handoff, no BLOCKED and no QUESTION line (attempt ${blocks}/${MAX_BLOCKS}). ` +
        'Keep going with the plan. Run each command in the foreground and wait for it; ending your turn returns you to the main session.') });
    }
  }
}
