#!/usr/bin/env node
'use strict';
// S2: the script half of /close (OPTIMIZATION_PLAN.md §6.4, D4, F1).
// Usage: node .claude/scripts/close.cjs <issue> [--branch <name>] [--dry-run]
// Deletes nothing it can't prove is safe: the PR must be MERGED, the local branch tip must be the
// PR's head, and the working tree must be clean. Exit 0 done, 3 aborted for safety, 2 error.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { HarnessError, tag, repoRoot, workDir, loadConfig, log } = require('../lib/harness.cjs');

class Abort extends Error {}

const say = msg => process.stdout.write(tag('close', msg) + '\n');

function git(root, ...args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
function gitOk(root, ...args) {
  try { return { ok: true, out: git(root, ...args) }; } catch (e) { return { ok: false, out: String(e.stderr || e.message).trim() }; }
}

// HARNESS_GH points tests at a fake gh (a Node script); production uses the real gh.
function gh(root, ...args) {
  const fake = process.env.HARNESS_GH;
  const [cmd, argv] = fake ? [process.execPath, [fake, ...args]] : ['gh', args];
  try {
    return execFileSync(cmd, argv, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    throw new HarnessError(`gh ${args.join(' ')} failed: ${String(e.stderr || e.message).trim()}`);
  }
}

// The branch comes from --branch, else the handoff's "Branch:" field, else the current branch.
function resolveBranch(root, issue, flag, defaultBranch) {
  if (flag) return flag;
  const handoff = path.join(workDir(root), issue, 'handoff.md');
  if (fs.existsSync(handoff)) {
    const m = fs.readFileSync(handoff, 'utf8').match(/Branch:\s*`?([^\s`·]+)`?/);
    if (m) return m[1];
  }
  const current = git(root, 'branch', '--show-current');
  if (current && current !== defaultBranch) return current;
  throw new HarnessError('no branch: pass --branch, or run from the issue branch');
}

// Memory lives in ~/.claude/projects/<project path with separators turned into "-">/memory.
function memoryDir(root) {
  if (process.env.HARNESS_MEMORY_DIR) return process.env.HARNESS_MEMORY_DIR;
  const slug = path.resolve(root).replace(/[:\\/]/g, '-');
  return path.join(os.homedir(), '.claude', 'projects', slug, 'memory');
}

function memoryFilesMentioning(root, issue) {
  const dir = memoryDir(root);
  if (!fs.existsSync(dir)) return [];
  const re = new RegExp(`#${issue}\\b`);
  return fs.readdirSync(dir).filter(f => f.endsWith('.md') && f !== 'MEMORY.md')
    .filter(f => re.test(fs.readFileSync(path.join(dir, f), 'utf8')))
    .map(f => path.join(dir, f));
}

function close(root, issue, { branchFlag, dryRun }) {
  const cfg = loadConfig(root);
  const def = cfg.defaultBranch;
  const branch = resolveBranch(root, issue, branchFlag, def);
  const report = { issue, branch, defaultBranch: def, dryRun: !!dryRun };

  // 1. GitHub must say the PR is merged.
  let pr;
  try { pr = JSON.parse(gh(root, 'pr', 'view', branch, '--json', 'number,state,mergedAt,headRefOid')); }
  catch (e) { if (e instanceof HarnessError) throw e; throw new HarnessError(`unreadable gh output: ${e.message}`); }
  Object.assign(report, { pr: pr.number, prState: pr.state, prHead: pr.headRefOid });
  if (pr.state !== 'MERGED') throw new Abort(`PR #${pr.number} is ${pr.state}, not MERGED; nothing deleted`);

  // 2. The local branch must hold nothing the PR didn't (F1).
  const dirty = git(root, 'status', '--porcelain', '--untracked-files=all');
  if (dirty) throw new Abort(`the working tree has uncommitted or untracked changes; nothing deleted:\n${dirty}`);
  const local = gitOk(root, 'rev-parse', '--verify', `refs/heads/${branch}`);
  report.localHead = local.ok ? local.out : null;
  if (local.ok && local.out !== pr.headRefOid)
    throw new Abort(`local ${branch} is at ${local.out}, but the merged PR's head is ${pr.headRefOid}; ` +
      'the local branch holds work the PR did not, so it is kept');

  if (dryRun) { report.wouldDelete = local.ok ? [branch] : []; return report; }

  // 3. Update the default branch.
  git(root, 'switch', def);
  const pull = gitOk(root, 'pull', '--ff-only');
  report.pull = pull.ok ? 'fast-forwarded' : `not updated: ${pull.out}`;

  // 4. Delete the branch: -d first; -D only because step 2 proved the tip is the merged PR's head.
  if (local.ok) {
    const d = gitOk(root, 'branch', '-d', branch);
    if (d.ok) report.branchDeleted = '-d (merged)';
    else { git(root, 'branch', '-D', branch); report.branchDeleted = '-D (squash or rebase merge; tip proven equal to the PR head)'; }
  } else report.branchDeleted = 'no local branch';

  // 5. Prune remote-tracking refs.
  const prune = gitOk(root, 'fetch', '--prune');
  report.prune = prune.ok ? 'done' : `skipped: ${prune.out}`;

  // 6. The issue's working files; the issue comments stay as the record.
  const issueWork = path.join(workDir(root), issue);
  if (fs.existsSync(issueWork)) { fs.rmSync(issueWork, { recursive: true, force: true }); report.workDeleted = true; }
  else report.workDeleted = false;

  // 7. Memory files for the skill's model half to condense.
  report.memoryFiles = memoryFilesMentioning(root, issue);
  return report;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const issue = (args.find(a => !a.startsWith('--')) || '').replace(/^#/, '');
  const bi = args.indexOf('--branch');
  const branchFlag = bi >= 0 ? args[bi + 1] : undefined;
  const dryRun = args.includes('--dry-run');
  if (!/^\d+$/.test(issue)) { console.error(tag('close', 'usage: close.cjs <issue-number> [--branch <name>] [--dry-run]')); process.exit(2); }
  let root;
  try {
    root = repoRoot();
    const report = close(root, issue, { branchFlag, dryRun });
    log(root, { tool: 'close', issue, result: 'done', ...report });
    say(dryRun ? 'dry run: safe to close' : 'closed');
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
    process.exit(0);
  } catch (e) {
    const aborted = e instanceof Abort;
    if (root) log(root, { tool: 'close', issue, result: aborted ? 'aborted' : 'error', message: e.message });
    console.error(tag('close', aborted ? `ABORTED: ${e.message}` : (e instanceof HarnessError ? e.message : `unexpected error: ${e.stack || e}`)));
    process.exit(aborted ? 3 : 2);
  }
}

module.exports = { close };
