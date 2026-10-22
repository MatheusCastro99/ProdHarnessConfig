#!/usr/bin/env node
'use strict';
// S1: maps changed files to *candidate* docs that may now be wrong (OPTIMIZATION_PLAN.md §6.4, D2, F11).
// Usage: node .claude/scripts/stale-docs.cjs (--staged | --range <base>..<head>) [--record <issue>]
// The output is a list to review, not a complete inventory: drift that names no path is invisible here.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { HarnessError, tag, repoRoot, workDir, loadConfig, log, matchesGlob, toPosix } = require('../lib/harness.cjs');

// Basenames too generic to mean anything when a doc mentions them.
const STOPLIST = new Set(['index.js', 'index.ts', 'index.jsx', 'index.tsx', 'index.cjs', 'index.mjs', 'package.json',
  'package-lock.json', 'README.md', 'readme.md', 'CHANGELOG.md', '.gitignore', '.editorconfig', 'tsconfig.json']);

function git(root, ...args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 << 20 });
}

// [{ status: 'A'|'M'|'D'|'R', file, oldFile? }] for the staged changes, a commit range, or the work tree vs HEAD.
function changedFiles(root, { staged, range, workTree }) {
  const args = ['diff', '--name-status', '-M', '-z'];
  if (staged) args.push('--cached');
  else if (workTree) args.push('HEAD');
  else if (range) args.push(range);
  else throw new HarnessError('pass --staged or --range <base>..<head>');
  const parts = git(root, ...args).split('\0').filter(Boolean);
  const out = [];
  for (let i = 0; i < parts.length;) {
    const st = parts[i++];
    if (st[0] === 'R' || st[0] === 'C') { out.push({ status: 'R', oldFile: parts[i++], file: parts[i++] }); }
    else out.push({ status: st[0], file: parts[i++] });
  }
  return out;
}

const isDoc = (cfg, file) => (cfg.docs || []).some(g => matchesGlob(file, g));

function docFiles(root, cfg) {
  return git(root, 'ls-files', '-z').split('\0').filter(Boolean).filter(f => isDoc(cfg, f));
}

const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const mentions = (text, needle) => new RegExp(`(^|[^\\w./-])${escapeRe(needle)}($|[^\\w-])`, 'm').test(text);

// [{ doc, file, rule }] — deleted and renamed files first, since they leave dangling references.
function findCandidates(root, cfg, changes) {
  const docs = docFiles(root, cfg);
  const texts = new Map(docs.map(d => { try { return [d, fs.readFileSync(path.join(root, d), 'utf8')]; } catch { return [d, '']; } }));
  const code = changes.filter(c => !isDoc(cfg, c.file));
  const order = c => (c.status === 'D' || c.status === 'R' ? 0 : 1);
  const found = [];
  const seen = new Set();
  const add = (doc, file, rule) => {
    const key = `${doc}\0${file}`;
    if (!seen.has(key) && doc !== file) { seen.add(key); found.push({ doc, file, rule }); }
  };
  for (const c of [...code].sort((a, b) => order(a) - order(b))) {
    const subject = c.status === 'R' || c.status === 'D' ? (c.oldFile || c.file) : c.file;
    const why = c.status === 'D' ? 'deleted; ' : c.status === 'R' ? `renamed to ${c.file}; ` : '';
    for (const [glob, mapped] of Object.entries(cfg.docmap || {}))
      if (matchesGlob(c.file, glob) || (c.oldFile && matchesGlob(c.oldFile, glob))) for (const d of mapped) add(d, subject, `${why}docmap ${glob}`);
    const base = path.posix.basename(subject);
    const dir = path.posix.dirname(subject);
    for (const [doc, text] of texts) {
      if (mentions(text, subject)) add(doc, subject, `${why}path`);
      else if (!STOPLIST.has(base) && base.length >= 4 && mentions(text, base)) add(doc, subject, `${why}basename`);
      else if (dir !== '.' && text.includes(dir + '/')) add(doc, subject, `${why}directory ${dir}/`);
    }
  }
  return found;
}

// The active issues' stale-docs files; "ack: <doc> — <why>" lines clear a flag (D10).
function issueDirs(root) {
  const w = workDir(root);
  if (!fs.existsSync(w)) return [];
  return fs.readdirSync(w).filter(n => /^\d+$/.test(n) && fs.statSync(path.join(w, n)).isDirectory()).map(n => path.join(w, n));
}

function ackedDocs(root) {
  const acked = new Map();
  for (const d of issueDirs(root)) {
    const f = path.join(d, 'stale-docs.md');
    if (!fs.existsSync(f)) continue;
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/^ack:\s*`?([^`\s—]+)`?\s*[—-]+\s*(\S.*)$/gm)) acked.set(m[1], m[2]);
  }
  return acked;
}

// What H4 blocks on: candidates whose doc is neither part of the change nor acknowledged.
function unresolved(root, cfg, changes) {
  const changedDocs = new Set(changes.filter(c => isDoc(cfg, c.file)).map(c => c.file));
  const acked = ackedDocs(root);
  return findCandidates(root, cfg, changes).filter(c => !changedDocs.has(c.doc) && !acked.has(c.doc));
}

function record(root, issue, candidates) {
  const f = path.join(workDir(root), issue, 'stale-docs.md');
  fs.mkdirSync(path.dirname(f), { recursive: true });
  const existing = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : `# Stale-docs candidates: #${issue}\n\nClear a flag with a line: ack: <doc> — <why it is still accurate>\n\n`;
  const lines = candidates.map(c => `- ${c.doc} ← ${c.file} (${c.rule})`).filter(l => !existing.includes(l));
  fs.writeFileSync(f, existing + (lines.length ? lines.join('\n') + '\n' : ''));
  return lines.length;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const ri = args.indexOf('--range');
  const rec = args.indexOf('--record');
  const opts = { staged: args.includes('--staged'), range: ri >= 0 ? args[ri + 1] : undefined };
  let root;
  try {
    root = repoRoot();
    const cfg = loadConfig(root);
    const changes = changedFiles(root, opts);
    const cands = findCandidates(root, cfg, changes);
    if (rec >= 0) {
      const issue = String(args[rec + 1] || '').replace(/^#/, '');
      if (!/^\d+$/.test(issue)) throw new HarnessError('--record needs an issue number');
      record(root, issue, cands);
    }
    log(root, { tool: 'stale-docs', candidates: cands.length });
    if (!cands.length) console.log(tag('stale-docs', 'no candidate docs for these changes'));
    else console.log(tag('stale-docs', `${cands.length} candidate doc reference(s) to review:\n` +
      cands.map(c => `- ${c.doc} ← ${c.file} (${c.rule})`).join('\n')));
    process.exit(0);
  } catch (e) {
    console.error(tag('stale-docs', e instanceof HarnessError ? e.message : `unexpected error: ${e.stack || e}`));
    process.exit(2);
  }
}

module.exports = { changedFiles, findCandidates, ackedDocs, unresolved, record, issueDirs, STOPLIST };
