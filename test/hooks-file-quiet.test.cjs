'use strict';
// H1 file-check and H3 quiet (§6.2, F7, F12), plus S5's --index used by H3.

const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { harnessRepo, tempDir, write, run } = require('./helpers.cjs');

function repo() {
  const tools = tempDir('harness tools ');
  // A "linter" that fails on files containing BAD, and a "formatter" that uppercases a marker.
  const lint = write(tools, 'lint.cjs', `const t=require('fs').readFileSync(process.argv[2],'utf8'); if (t.includes('BAD')) { console.log(process.argv[2] + ':1:1 no BAD allowed'); process.exit(1); }`);
  const fmt = write(tools, 'fmt.cjs', `const fs=require('fs'); const f=process.argv[2]; fs.writeFileSync(f, fs.readFileSync(f,'utf8').replace('fmt-me','FORMATTED'));`);
  const cfg = {
    defaultBranch: 'main',
    checks: { fast: [{ run: [process.execPath, lint, 'src/ok.js'] }], full: [], unit: [{ run: ['npm', 'test'], cwd: 'FRONTEND' }] },
    fileTools: { 'src/**/*.js': { format: { run: [process.execPath, fmt, '{file}'] }, lint: { run: [process.execPath, lint, '{file}'] } } },
  };
  const dir = harnessRepo(cfg);
  write(dir, 'src/ok.js', 'fine');
  return dir;
}

const edit = (dir, file, tool = 'Edit') =>
  run('hooks/file-check.cjs', [], { cwd: dir, input: JSON.stringify({ hook_event_name: 'PostToolUse', tool_name: tool, tool_input: { file_path: path.join(dir, file) } }) });

test('H1: a clean file is formatted and passes silently', () => {
  const dir = repo();
  write(dir, 'src/sub dir/a.js', 'fmt-me');
  const r = edit(dir, 'src/sub dir/a.js');
  assert.strictEqual(r.code, 0, r.out);
  assert.strictEqual(r.out, '');
  assert.strictEqual(require('fs').readFileSync(path.join(dir, 'src/sub dir/a.js'), 'utf8'), 'FORMATTED');
});

test('H1: lint errors exit 2 with the linter\'s message, tagged', () => {
  const dir = repo();
  write(dir, 'src/b.js', 'BAD code');
  const r = edit(dir, 'src/b.js', 'Write');
  assert.strictEqual(r.code, 2);
  assert.match(r.stderr, /^\[harness file-check\] src\/b\.js: lint errors/);
  assert.match(r.stderr, /no BAD allowed/);
});

test('H1: files no fileTools entry matches are ignored', () => {
  const dir = repo();
  write(dir, 'docs/readme.md', 'BAD');
  assert.strictEqual(edit(dir, 'docs/readme.md').code, 0);
});

test('H1: malformed input fails closed with a tagged message', () => {
  const r = run('hooks/file-check.cjs', [], { cwd: repo(), input: '{oops' });
  assert.strictEqual(r.code, 2);
  assert.match(r.stderr, /\[harness file-check\] hook input is not valid JSON/);
});

const bash = (dir, command) => {
  const r = run('hooks/quiet.cjs', [], { cwd: dir, input: JSON.stringify({ hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command } }) });
  return r.stdout ? JSON.parse(r.stdout).hookSpecificOutput : null;
};

test('H3: an exactly configured command is rewritten through the check runner', () => {
  const dir = repo();
  for (const typed of ['cd FRONTEND && npm test', 'cd "FRONTEND" && npm test', '  cd FRONTEND &&   npm   test ']) {
    const out = bash(dir, typed);
    assert.ok(out, typed);
    assert.strictEqual(out.permissionDecision, 'allow');
    assert.match(out.updatedInput.command, /check\.cjs" unit --index 0$/);
  }
});

test('H3: anything else passes through untouched', () => {
  const dir = repo();
  // A bare "npm test" would run in the repo root, not in FRONTEND where the check is configured: untouched.
  for (const typed of ['npm test', 'npm test && rm -rf build', 'npm test -- --watch', 'git commit -m "npm test"', 'echo $(npm test)'])
    assert.strictEqual(bash(dir, typed), null, typed);
  const r = run('hooks/quiet.cjs', [], { cwd: dir, input: 'garbage' });
  assert.strictEqual(r.stdout, '');
});

test('S5 --index runs only that command', () => {
  const dir = repo();
  const r = run('scripts/check.cjs', ['fast', '--index', '0'], { cwd: dir });
  assert.strictEqual(r.code, 0, r.out);
  assert.strictEqual(run('scripts/check.cjs', ['fast', '--index', '5'], { cwd: dir }).code, 2);
});
