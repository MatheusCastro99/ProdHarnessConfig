'use strict';
// S1 stale-docs: the matching rules, renames and deletions, docmap, acks and --record (§6.4).

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { harnessRepo, write, commitAll, git, run } = require('./helpers.cjs');

const CONFIG = {
  defaultBranch: 'main',
  checks: { fast: [], full: [] },
  docs: ['Docs/**/*.md', 'README.md'],
  docmap: { 'NODEAPI/routes/**': ['Docs/API.md'] },
};

function repo() {
  const dir = harnessRepo(CONFIG);
  write(dir, 'NODEAPI/routes/invoices.js', 'v1');
  write(dir, 'NODEAPI/models/invoiceModel.js', 'v1');
  write(dir, 'FRONTEND/src/index.js', 'v1');
  write(dir, 'src/Services/AlertService.cs', 'v1');
  write(dir, 'Docs/API.md', '# API\nRoutes are listed here.\n');
  write(dir, 'Docs/Architecture.md', '# Architecture\nThe model lives in NODEAPI/models/invoiceModel.js.\nAlerts come from AlertService.cs.\nEntry point: index.js.\n');
  write(dir, 'Docs/Layout.md', '# Layout\nEverything under src/Services/ is a service.\n');
  write(dir, 'README.md', 'readme\n');
  commitAll(dir, 'base');
  return dir;
}

const lines = out => out.split('\n').filter(l => l.startsWith('- '));

test('matches by docmap, full path, basename and directory', () => {
  const dir = repo();
  write(dir, 'NODEAPI/routes/invoices.js', 'v2');
  write(dir, 'NODEAPI/models/invoiceModel.js', 'v2');
  write(dir, 'src/Services/NewService.cs', 'new');
  git(dir, 'add', '-A');
  const r = run('scripts/stale-docs.cjs', ['--staged'], { cwd: dir });
  assert.strictEqual(r.code, 0, r.out);
  const l = lines(r.out).join('\n');
  assert.match(l, /Docs\/API\.md ← NODEAPI\/routes\/invoices\.js \(docmap/);
  assert.match(l, /Docs\/Architecture\.md ← NODEAPI\/models\/invoiceModel\.js \(path\)/);
  assert.match(l, /Docs\/Layout\.md ← src\/Services\/NewService\.cs \(directory src\/Services\/\)/);
});

test('matches a basename, but not a generic one on the stoplist', () => {
  const dir = repo();
  write(dir, 'src/Services/AlertService.cs', 'v2');
  write(dir, 'FRONTEND/src/index.js', 'v2');
  git(dir, 'add', '-A');
  const l = lines(run('scripts/stale-docs.cjs', ['--staged'], { cwd: dir }).out).join('\n');
  assert.match(l, /Architecture\.md ← src\/Services\/AlertService\.cs \(basename\)/);
  assert.doesNotMatch(l, /index\.js/);
});

test('deleted and renamed files come first, by their old path', () => {
  const dir = repo();
  write(dir, 'FRONTEND/src/index.js', 'v2');
  git(dir, 'mv', 'NODEAPI/models/invoiceModel.js', 'NODEAPI/models/invoice.js');
  git(dir, 'rm', '-q', 'src/Services/AlertService.cs');
  git(dir, 'add', '-A');
  const l = lines(run('scripts/stale-docs.cjs', ['--staged'], { cwd: dir }).out);
  assert.match(l[0] + l[1], /deleted|renamed/);
  assert.ok(l.some(x => /invoiceModel\.js \(renamed to NODEAPI\/models\/invoice\.js; path\)/.test(x)), l.join('\n'));
  assert.ok(l.some(x => /AlertService\.cs \(deleted; basename\)/.test(x)), l.join('\n'));
});

test('a change to a doc itself is not a code change', () => {
  const dir = repo();
  write(dir, 'Docs/Architecture.md', 'rewritten\n');
  git(dir, 'add', '-A');
  assert.match(run('scripts/stale-docs.cjs', ['--staged'], { cwd: dir }).out, /no candidate docs/);
});

test('--range works on committed history', () => {
  const dir = repo();
  const base = git(dir, 'rev-parse', 'HEAD');
  write(dir, 'NODEAPI/routes/invoices.js', 'v2');
  commitAll(dir, 'change');
  const r = run('scripts/stale-docs.cjs', ['--range', `${base}..HEAD`], { cwd: dir });
  assert.match(r.out, /Docs\/API\.md ← NODEAPI\/routes\/invoices\.js/);
});

test('--record appends candidates to the issue\'s stale-docs file once', () => {
  const dir = repo();
  write(dir, 'NODEAPI/routes/invoices.js', 'v2');
  git(dir, 'add', '-A');
  run('scripts/stale-docs.cjs', ['--staged', '--record', '42'], { cwd: dir });
  run('scripts/stale-docs.cjs', ['--staged', '--record', '42'], { cwd: dir });
  const text = fs.readFileSync(path.join(dir, '.harness/work/42/stale-docs.md'), 'utf8');
  assert.strictEqual(text.match(/Docs\/API\.md ←/g).length, 1);
  assert.match(text, /ack: <doc>/);
});

test('ackedDocs reads "ack:" lines from the issue files', () => {
  const { ackedDocs } = require('../harness/.claude/scripts/stale-docs.cjs');
  const dir = repo();
  write(dir, '.harness/work/42/stale-docs.md', 'ack: Docs/API.md — only a variable was renamed\nack: `README.md` - unrelated\n');
  const acks = ackedDocs(dir);
  assert.strictEqual(acks.get('Docs/API.md'), 'only a variable was renamed');
  assert.ok(acks.has('README.md'));
});
