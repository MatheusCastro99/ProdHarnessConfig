#!/usr/bin/env node
'use strict';
// H4: PreToolUse on Bash, `if: Bash(git commit *)` (Evidence/OPTIMIZATION_PLAN.md §6.2, D2, D10).
// Reports, and never denies, a commit whose code changes flag candidate docs that aren't in it (D27, #9 §30 X6):
// on D26, 47 denials led to 427 "still accurate" acknowledgements, while the red-team and the Epic audits caught
// the real drift. The handoff lists the flagged docs left unchanged, for the red-team's doc lens. The `if` filter
// is best-effort, so the command is re-checked here (F7): only an actual `git commit` is looked at.

const { execFileSync } = require('child_process');
const { HarnessError, tag, repoRoot, loadConfig, log, readHookInput } = require('../lib/harness.cjs');
const { changedFiles, unresolved } = require('../scripts/stale-docs.cjs');

const GIT = /^(?:\w+=\S+\s+)*git((?:\s+(?:-C|-c)\s+(?:"[^"]*"|'[^']*'|\S+))*)\s+(commit|add|stage|rm|mv)\b(.*)$/;
const unquote = w => w.replace(/^(['"])(.*)\1$/, '$2');

// Splits on shell separators and finds `git … commit …` segments. For each, reports whether -a/--all
// stages more, and what an earlier `git add` (or stage, rm, mv) in the same command stages first: the
// hook runs before the whole command, so that isn't staged yet. `adds` holds the paths, or '*' when
// they can't be narrowed (no paths, ".", a glob, -A, -u, -C, rm or mv).
function commitSegments(command) {
  const segs = command.split(/&&|\|\||[;|\n]/).map(s => s.trim()).filter(Boolean);
  const commits = [];
  const adds = [];
  for (const s of segs) {
    const m = s.match(GIT);
    if (!m) continue;
    const [, opts, sub, rest] = m;
    if (sub === 'commit') { commits.push({ all: /\s(?:-[a-zA-Z]*a[a-zA-Z]*|--all)\b/.test(' ' + rest), adds: [...adds] }); continue; }
    const words = rest.trim().split(/\s+/).filter(Boolean).map(unquote);
    const paths = words.filter(w => !w.startsWith('-')).map(p => p.replace(/^\.\//, '').replace(/\/+$/, ''));
    const wide = /-C/.test(opts) || (sub !== 'add' && sub !== 'stage') || !paths.length ||
      words.some(w => /^-[a-zA-Z]*[Au]|^--(all|update)$/.test(w)) || paths.some(p => p === '.' || p === '' || /[*?[:]/.test(p));
    adds.push(...(wide ? ['*'] : paths));
  }
  return commits;
}

// Tracked changes against HEAD plus untracked, non-ignored files: what `git add` could stage.
function workTreeChanges(root) {
  let out = [];
  try { out = changedFiles(root, { workTree: true }); } catch { /* no HEAD yet: nothing tracked */ }
  const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8' });
  for (const file of untracked.split('\0').filter(Boolean)) out.push({ status: 'A', file, untracked: true });
  return out;
}

const within = (file, paths) => paths.includes('*') || paths.some(p => file === p || file.startsWith(p + '/'));

const report = message => process.stdout.write(JSON.stringify({ systemMessage: message }));

function main() {
  let input;
  try { input = readHookInput(); }
  catch (e) { report(tag('docs-gate', `${e.message}; the commit's docs weren't checked`)); return; }
  const command = input.tool_input && input.tool_input.command;
  if (typeof command !== 'string') return;
  const commits = commitSegments(command);
  if (!commits.length) return; // not a commit: nothing to gate

  let root;
  try {
    root = repoRoot();
    const cfg = loadConfig(root);
    const changes = changedFiles(root, { staged: true });
    const adds = commits.flatMap(c => c.adds);
    if (adds.length || commits.some(c => c.all)) {
      const seen = new Set(changes.map(c => c.file));
      for (const c of workTreeChanges(root)) {
        const tracked = !c.untracked;
        if (seen.has(c.file) || !(within(c.file, adds) || (tracked && commits.some(x => x.all)))) continue;
        seen.add(c.file);
        changes.push(c);
      }
    }
    const open = unresolved(root, cfg, changes, { acks: false });
    log(root, { tool: 'docs-gate', result: open.length ? 'report' : 'allow', open: open.length });
    if (!open.length) return;
    const docs = [...new Set(open.map(o => o.doc))];
    report(tag('docs-gate', `this commit may leave ${docs.length} doc(s) stale:\n` +
      open.map(o => `- ${o.doc} ← ${o.file} (${o.rule})`).join('\n') +
      '\nUpdate any that are now wrong in the next commit; list the ones still accurate under the handoff\'s Docs.'));
  } catch (e) {
    if (root) log(root, { tool: 'docs-gate', result: 'error', message: e.message });
    report(tag('docs-gate', `couldn't check docs: ${e instanceof HarnessError ? e.message : e.message || e}`));
  }
}

main();
module.exports = { commitSegments };
