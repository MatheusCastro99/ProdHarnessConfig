'use strict';
// H7 bash-guard (D27, #9 §25): a `cat` that writes a file with nothing to read is refused.

const test = require('node:test');
const assert = require('node:assert');
const { harnessRepo, run } = require('./helpers.cjs');
const { catWithNoInput } = require('../harness/.claude/hooks/bash-guard.cjs');

test('the D26 idioms are refused: a cat with no heredoc, no redirect and no pipe', () => {
  // InvoiceMe #171's review session hung 24 minutes on the first; #172's build stopped on the second.
  assert.ok(catWithNoInput('cat > "$TMPDIR/g2edits.cjs" 2>/dev/null || true; node - <<\'EOF\'\nconsole.log(1)\nEOF'));
  assert.ok(catWithNoInput('cat > /tmp/edit.cjs 2>/dev/null || true; SP=/x; node $SP/edit.cjs'));
  assert.ok(catWithNoInput('cat >> notes.md'));
  assert.ok(catWithNoInput('cd dir && cat > out.txt'));
});

test('a cat that has its input passes', () => {
  for (const c of [
    'cat > out.md <<\'EOF\'\nhello\nEOF',
    'cat > "$F" <<EOF\nEOF',                 // an empty heredoc is harmless (InvoiceMe #153)
    'cat > out.md <<-EOF\n\tx\n\tEOF',
    'cat a.txt > b.txt',
    'cat < in.txt > out.txt',
    'echo x | cat > f',
    'git diff | cat',
    'cat README.md',
    'node -e "1" && cat a > b',
  ]) assert.strictEqual(catWithNoInput(c), null, c);
});

test('text inside a heredoc body is not read as a command', () => {
  assert.strictEqual(catWithNoInput('node - <<\'EOF\'\n// run cat > x to see\nEOF'), null);
});

test('the hook denies with a tagged reason, and passes anything else untouched', () => {
  const dir = harnessRepo({ defaultBranch: 'main', checks: { fast: [], full: [] } });
  const call = command => run('hooks/bash-guard.cjs', [], { cwd: dir, input: JSON.stringify({ hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command } }) });
  const r = call('cat > /tmp/x.cjs 2>/dev/null || true');
  const out = JSON.parse(r.stdout).hookSpecificOutput;
  assert.strictEqual(out.permissionDecision, 'deny');
  assert.match(out.permissionDecisionReason, /^\[harness bash-guard\] .* would wait on stdin forever/);
  assert.strictEqual(call('npm test').stdout, '');
  assert.strictEqual(run('hooks/bash-guard.cjs', [], { cwd: dir, input: 'garbage' }).stdout, '', 'bad input passes');
});
