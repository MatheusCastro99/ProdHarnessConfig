'use strict';
// Evidence/research/scripts/trail.cjs, the /trail skill's tools (D27, #9 §9), on fixture transcripts.

const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { tempDir, write } = require('./helpers.cjs');
const { sessions, timeline, windows, ownerText, projectDir } = require('../Evidence/research/scripts/trail.cjs');

const OPUS = 'claude-opus-5-5', SONNET = 'claude-sonnet-5-5';
let n = 0;
const call = (ts, tools = [], model = OPUS, reads = 1e6) => ({
  type: 'assistant', timestamp: ts,
  message: { id: 'm' + (++n), model, usage: { input_tokens: 0, cache_read_input_tokens: reads, output_tokens: 0 },
    content: tools.map(([name, input]) => ({ type: 'tool_use', name, input: input || {} })) },
});
const owner = (ts, text) => ({ type: 'user', timestamp: ts, message: { content: text } });
const jsonl = lines => lines.map(l => JSON.stringify(l)).join('\n') + '\n';

function fixture() {
  const root = tempDir('trail test ');
  const dir = path.join(root, 'P');
  write(dir, 'abcd1234-0000.jsonl', jsonl([
    owner('2026-11-20T10:00:00Z', '<command-message>scope</command-message> <command-name>/scope</command-name> <command-args>7</command-args>'),
    call('2026-11-20T10:00:05Z', [['AskUserQuestion', { questions: [{ header: 'Tier' }] }]]),
    owner('2026-11-20T10:01:00Z', '<task-notification>done</task-notification>'),
    owner('2026-11-20T10:02:00Z', 'As recommended'),
    call('2026-11-20T10:02:05Z', [['Skill', { skill: 'build', args: '7' }]], OPUS, 250e3),
    call('2026-11-20T11:30:00Z', [['Read', { file_path: 'shot.png' }]]),
  ]));
  write(dir, 'abcd1234-0000/subagents/agent-1.jsonl', jsonl([call('2026-11-20T10:03:00Z', [], SONNET)]));
  write(dir, 'abcd1234-0000/subagents/agent-1.meta.json', JSON.stringify({ agentType: 'builder', description: 'Build #7' }));
  return dir;
}

test('only the owner\'s own messages count as turns', () => {
  assert.strictEqual(ownerText(owner('t', '<task-notification>x</task-notification>')), null);
  assert.strictEqual(ownerText(owner('t', '<ci-monitor-event>x</ci-monitor-event>')), null);
  assert.strictEqual(ownerText(owner('t', 'Fix 1 and 2')), 'Fix 1 and 2');
  assert.match(ownerText(owner('t', '<command-name>/scope</command-name> <command-args>7</command-args>')), /\/scope 7/);
});

test('sessions lists a transcript with its span, owner turns and models', () => {
  const [s] = sessions(fixture());
  assert.strictEqual(s.id, 'abcd1234');
  assert.strictEqual(s.owner, 2, 'the /scope and the reply; not the notification');
  assert.deepStrictEqual(s.models, ['opus-5-5']);
  assert.strictEqual(sessions(fixture(), '2026-12-01').length, 0, '--since filters');
});

test('timeline shows owner turns and key calls with their context', () => {
  const lines = timeline(path.join(fixture(), 'abcd1234-0000.jsonl'));
  assert.ok(lines.some(l => /^OWNER 10:02:00 As recommended/.test(l)));
  assert.ok(lines.some(l => /10:00:05 1000k AskUserQuestion Tier/.test(l)));
  assert.ok(lines.some(l => /250k Skill build 7/.test(l)));
});

test('windows prices the main session at the cuts, then each subagent, with images and calls over 200k', () => {
  const ws = windows(path.join(fixture(), 'abcd1234-0000.jsonl'), ['2026-11-20T11:00:00Z']);
  assert.deepStrictEqual(ws.map(w => [w.label.split(' ')[0], w.calls]), [['main', 2], ['main', 1], ['sub', 1]]);
  assert.strictEqual(ws[0].cost.toFixed(2), '0.25', '1M + 250k Opus reads');
  assert.strictEqual(ws[0].over200, 2, 'both calls read over 200k');
  assert.strictEqual(ws[1].images, 1);
  assert.strictEqual(ws[2].cost.toFixed(2), '0.10', 'Sonnet');
});

test('the /trail skill lives in ProdHarnessConfig only, owner-started, and uses these tools', () => {
  const fs = require('fs');
  const skill = fs.readFileSync(path.join(__dirname, '..', '.claude', 'skills', 'trail', 'SKILL.md'), 'utf8');
  assert.ok(skill.startsWith('---') && skill.includes('name: trail'), 'frontmatter names it');
  assert.match(skill, /disable-model-invocation: true/);
  for (const s of ['trail.cjs sessions', 'trail.cjs timeline', 'trail.cjs windows', 'runs.js', 'never a replacement string'])
    assert.ok(skill.includes(s), s);
  assert.ok(!fs.existsSync(path.join(__dirname, '..', 'harness', '.claude', 'skills', 'trail')), 'not installed in the projects');
});

test('a project is named by its initials or its name', () => {
  assert.match(projectDir('TIMC', 'X'), /ThisIsMatheusCastro$/);
  assert.match(projectDir('InvoiceMe', 'X'), /InvoiceMe$/);
  assert.throws(() => projectDir('nope', 'X'), /unknown project/);
});
