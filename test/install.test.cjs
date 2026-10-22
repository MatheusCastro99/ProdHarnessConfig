'use strict';
// install.cjs: dry run, apply, re-install, upgrade, local edits, conflicts, removals, gitignore, CLAUDE.md (ADOPTION_PLAN.md §3).

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { tempDir, initRepo, write, commitAll, git } = require('./helpers.cjs');

const INSTALL = path.join(__dirname, '..', 'scripts', 'install.cjs');
const CONFIG = { defaultBranch: 'main', checks: { fast: [], full: [] } };

function projects(extra = {}) {
  const dir = tempDir('harness projects ');
  write(dir, 'demo/harness.json', JSON.stringify(CONFIG, null, 2));
  if (extra.install) write(dir, 'demo/install.json', JSON.stringify(extra.install));
  if (extra.badConfig) write(dir, 'demo/harness.json', '{"defaultBranch": "main"}');
  return dir;
}

function target() {
  const dir = initRepo(tempDir('harness target '));
  write(dir, 'README.md', 'project\n');
  write(dir, '.gitignore', '.claude/work/\n.claude/settings.local.json\n');
  commitAll(dir, 'base');
  return dir;
}

function install(dir, args = [], proj = projects()) {
  const r = spawnSync(process.execPath, [INSTALL, dir, 'demo', ...args], { encoding: 'utf8', env: { ...process.env, HARNESS_PROJECTS_DIR: proj } });
  return { code: r.status, out: r.stdout + r.stderr };
}

const exists = (dir, rel) => fs.existsSync(path.join(dir, rel));
const manifest = dir => JSON.parse(fs.readFileSync(path.join(dir, '.claude/harness-manifest.json'), 'utf8'));
const sha = text => crypto.createHash('sha256').update(text).digest('hex');

test('a dry run lists what it would add and writes nothing', () => {
  const dir = target();
  const r = install(dir);
  assert.strictEqual(r.code, 0, r.out);
  assert.match(r.out, /^add\s+\.claude\/hooks\/check-gate\.cjs/m);
  assert.match(r.out, /^add\s+\.claude\/harness\.json/m);
  assert.match(r.out, /dry run: nothing written/);
  assert.ok(!exists(dir, '.claude'));
});

test('--apply installs the harness, the project config and a manifest; CLAUDE.md is never written', () => {
  const dir = target();
  const r = install(dir, ['--apply']);
  assert.strictEqual(r.code, 0, r.out);
  for (const f of ['lib/harness.cjs', 'hooks/check-gate.cjs', 'scripts/check.cjs', 'agents/red-team.md', 'skills/build/SKILL.md', 'settings.json', 'harness.json'])
    assert.ok(exists(dir, `.claude/${f}`), f);
  assert.ok(!exists(dir, '.claude/CLAUDE.md'), 'the template is not installed');
  const m = manifest(dir);
  assert.strictEqual(m.project, 'demo');
  assert.match(m.commit || '', /^[0-9a-f]{40}$/);
  assert.strictEqual(m.files['.claude/harness.json'], sha(fs.readFileSync(path.join(dir, '.claude/harness.json'), 'utf8')));
});

test('installing again changes nothing', () => {
  const dir = target();
  install(dir, ['--apply']);
  commitAll(dir, 'install');
  const r = install(dir, ['--apply']);
  assert.strictEqual(r.code, 0, r.out);
  assert.doesNotMatch(r.out, /^(add|update|replace|remove)\s/m);
  assert.match(r.out, /summary: \d+ same$/m);
  assert.match(r.out, /already up to date/);
  assert.strictEqual(git(dir, 'status', '--porcelain'), '', 'not even the manifest timestamp changes');
});

test('an untouched file from an older install is updated', () => {
  const dir = target();
  install(dir, ['--apply']);
  // Pretend an older harness shipped different content, and the file was never edited since.
  const rel = '.claude/hooks/quiet.cjs';
  write(dir, rel, '// old version\n');
  const m = manifest(dir);
  m.files[rel] = sha('// old version\n');
  write(dir, '.claude/harness-manifest.json', JSON.stringify(m));
  commitAll(dir, 'old install');
  const r = install(dir, ['--apply']);
  assert.strictEqual(r.code, 0, r.out);
  assert.match(r.out, /^update\s+\.claude\/hooks\/quiet\.cjs/m);
  assert.doesNotMatch(fs.readFileSync(path.join(dir, rel), 'utf8'), /old version/);
});

test('a locally edited file blocks the install; --force overwrites it', () => {
  const dir = target();
  install(dir, ['--apply']);
  write(dir, '.claude/scripts/check.cjs', '// my local change\n');
  commitAll(dir, 'local edit');
  const r = install(dir, ['--apply']);
  assert.strictEqual(r.code, 3, r.out);
  assert.match(r.out, /^local-edit\s+\.claude\/scripts\/check\.cjs/m);
  assert.match(fs.readFileSync(path.join(dir, '.claude/scripts/check.cjs'), 'utf8'), /my local change/, 'nothing written');
  assert.strictEqual(install(dir, ['--apply', '--force']).code, 0);
  assert.doesNotMatch(fs.readFileSync(path.join(dir, '.claude/scripts/check.cjs'), 'utf8'), /my local change/);
});

test('a file the harness didn\'t install is a conflict until named with --replace', () => {
  const dir = target();
  write(dir, '.claude/agents/red-team.md', 'the study-era red-team\n');
  commitAll(dir, 'study era');
  const r = install(dir, ['--apply']);
  assert.strictEqual(r.code, 3, r.out);
  assert.match(r.out, /^conflict\s+\.claude\/agents\/red-team\.md/m);
  assert.ok(!exists(dir, '.claude/harness-manifest.json'), 'nothing written');
  const r2 = install(dir, ['--apply', '--replace', '.claude/agents/red-team.md']);
  assert.strictEqual(r2.code, 0, r2.out);
  assert.match(fs.readFileSync(path.join(dir, '.claude/agents/red-team.md'), 'utf8'), /^name: red-team$/m);
});

test('the red-team gets the project\'s preloaded skills (A3)', () => {
  const dir = target();
  write(dir, '.claude/skills/review-guardrails/SKILL.md', '---\nname: review-guardrails\ndescription: traps\n---\n');
  commitAll(dir, 'project skill');
  const r = install(dir, ['--apply'], projects({ install: { redTeamSkills: ['review-guardrails'] } }));
  assert.strictEqual(r.code, 0, r.out);
  const rt = fs.readFileSync(path.join(dir, '.claude/agents/red-team.md'), 'utf8');
  const fm = rt.slice(0, rt.indexOf('\n---', 4));
  assert.match(fm, /\nskills:\n  - review-guardrails$/);
  assert.ok(exists(dir, '.claude/skills/review-guardrails/SKILL.md'), 'the project skill is left alone');
  assert.strictEqual(manifest(dir).files['.claude/agents/red-team.md'], sha(rt));
});

test('a preloaded skill that doesn\'t exist is warned about', () => {
  const r = install(target(), [], projects({ install: { redTeamSkills: ['missing-skill'] } }));
  assert.match(r.out, /skill "missing-skill".*doesn't exist/);
});

test('uncommitted changes block --apply', () => {
  const dir = target();
  write(dir, 'wip.txt', 'x');
  const r = install(dir, ['--apply']);
  assert.strictEqual(r.code, 3);
  assert.match(r.out, /uncommitted changes/);
  assert.ok(!exists(dir, '.claude'));
});

test('a file no longer shipped is removed if untouched, kept if edited', () => {
  const dir = target();
  install(dir, ['--apply']);
  write(dir, '.claude/hooks/retired.cjs', 'old hook\n');
  write(dir, '.claude/hooks/retired-edited.cjs', 'edited\n');
  const m = manifest(dir);
  m.files['.claude/hooks/retired.cjs'] = sha('old hook\n');
  m.files['.claude/hooks/retired-edited.cjs'] = sha('original\n');
  write(dir, '.claude/harness-manifest.json', JSON.stringify(m));
  commitAll(dir, 'older install');
  const r = install(dir, ['--apply']);
  assert.strictEqual(r.code, 0, r.out);
  assert.ok(!exists(dir, '.claude/hooks/retired.cjs'));
  assert.ok(exists(dir, '.claude/hooks/retired-edited.cjs'));
  assert.match(r.out, /^keep-edited\s+\.claude\/hooks\/retired-edited\.cjs/m);
});

test('gitignore: reports rules that would hide the harness, and lines it needs', () => {
  const dir = initRepo(tempDir('harness target '));
  write(dir, '.gitignore', '.claude/agents\n.claude/skills\n');
  commitAll(dir, 'base');
  const r = install(dir);
  assert.match(r.out, /\.claude\/agents\/red-team\.md is ignored by "\.gitignore:1:\.claude\/agents"/);
  assert.match(r.out, /gitignore: add "\.claude\/work\/"/);
  assert.match(r.out, /gitignore: add "\.claude\/settings\.local\.json"/);
});

test('CRLF line endings in a checked-out file don\'t count as a local edit', () => {
  const dir = target();
  install(dir, ['--apply']);
  const f = path.join(dir, '.claude/hooks/quiet.cjs');
  fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(/\n/g, '\r\n'));
  const r = install(dir, ['--force']);
  assert.match(r.out, /summary: \d+ same$/m);
});

test('an invalid project config is an error', () => {
  const r = install(target(), [], projects({ badConfig: true }));
  assert.strictEqual(r.code, 2);
  assert.match(r.out, /checks is required/);
});

test('an unknown project or a non-repo target is an error', () => {
  const r = spawnSync(process.execPath, [INSTALL, target(), 'nope'], { encoding: 'utf8' });
  assert.strictEqual(r.status, 2);
  assert.match(r.stderr, /no project "nope"/);
  const r2 = spawnSync(process.execPath, [INSTALL, tempDir('not a repo '), 'BabyBuddyHelper'], { encoding: 'utf8' });
  assert.strictEqual(r2.status, 2);
  assert.match(r2.stderr, /not a git repository/);
});
