'use strict';
// Evidence/research/scripts/runs.js: phases, the UI check, extra work, and the data file's shape.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { tempDir, write } = require('./helpers.cjs');
const { priceRun, groups } = require('../Evidence/research/scripts/runs.js');

const OPUS = 'claude-opus-5-5', SONNET = 'claude-sonnet-5-5';
// 1M cache reads on Opus cost $0.20, on Sonnet $0.10: easy totals.
let n = 0;
const call = (ts, tools = [], model = OPUS) => ({
  type: 'assistant', timestamp: ts,
  message: { id: 'm' + (++n), model, usage: { input_tokens: 0, cache_read_input_tokens: 1e6, output_tokens: 0 },
    content: tools.map(([name, input]) => ({ type: 'tool_use', name, input: input || {} })) },
});
const user = text => ({ type: 'user', message: { content: text } });
const cmd = name => user(`<command-name>/${name}</command-name>`);
const jsonl = lines => lines.map(l => JSON.stringify(l)).join('\n') + '\n';
const B = 'mcp__Claude_Browser__computer';

function project(main, subs = []) {
  const root = tempDir('runs test ');
  write(root, 'P/abcd1234-0000.jsonl', jsonl(main));
  subs.forEach(([type, lines], i) => {
    write(root, `P/abcd1234-0000/subagents/agent-${i}.jsonl`, jsonl(lines));
    write(root, `P/abcd1234-0000/subagents/agent-${i}.meta.json`, JSON.stringify({ agentType: type }));
  });
  return root;
}
const run = extra => ({ repo: 'R', sessions: [{ id: 'abcd1234', start: 'A', ...extra }] });

test('a Small session moves A → B → C → close and never back', () => {
  const root = project([
    cmd('scope'), call('t01'),
    call('t02', [['Skill', { skill: 'build' }]]), call('t03'),
    call('t04', [['Skill', { skill: 'harness:review' }]]), call('t05'),
    cmd('close'), call('t06'),
    call('t07', [['Agent', { subagent_type: 'red-team' }]]), // an audit after close stays in close
  ], [['builder', [call('t02b', [], SONNET)]], ['red-team', [call('t04b')]]]);
  const r = priceRun(run(), root, { R: 'P' });
  assert.deepStrictEqual(Object.fromEntries(Object.entries(r.parts).map(([k, v]) => [k, v.calls])),
    { A: 2, B: 2, C: 1, close: 2, builder: 1, 'red-team': 1 });
  const g = groups(r.parts);
  assert.strictEqual(g.build.toFixed(2), '0.50'); // 2 Opus + 1 Sonnet
  assert.strictEqual(r.total.toFixed(2), (7 * 0.2 + 0.1 + 0.2).toFixed(2));
});

test('browser calls and short gaps between them count as the UI check', () => {
  const root = project([
    call('t01'), call('t02', [[B]]), call('t03'), call('t04'), call('t05', [[B]]),
    call('t06'), call('t07'), call('t08'), call('t09'), call('t10'), call('t11', [[B]]),
  ]);
  const r = priceRun(run({ start: 'B' }), root, { R: 'P' });
  // t02–t05 is one span (gap 2); t11 is alone (gap 5 > 4)
  assert.strictEqual(r.parts['B:ui'].calls, 5);
  assert.strictEqual(r.parts.B.calls, 6);
});

test('a builder that drives the browser has its UI check counted apart', () => {
  const root = project([call('t01', [['Skill', { skill: 'build' }]])],
    [['builder', [call('b1', [], SONNET), call('b2', [[B]], SONNET), call('b3', [], SONNET)]]]);
  const r = priceRun(run(), root, { R: 'P' });
  assert.strictEqual(r.parts['builder:ui'].calls, 1);
  assert.strictEqual(groups(r.parts).ui.toFixed(2), '0.10');
});

test('extra work is priced apart and left out of the total', () => {
  const root = project([call('2026-10-26T21:00:00Z'), call('2026-10-26T21:05:00Z')],
    [['red-team', [call('2026-10-26T21:06:00Z')]]]);
  const r = priceRun(run({ extra: { from: '2026-10-26T21:04:00Z' } }), root, { R: 'P' });
  assert.strictEqual(r.total.toFixed(2), '0.20');
  assert.strictEqual(r.extra.toFixed(2), '0.40');
});

test('runs.json: every run has a known config, a project, a recorded cost and session ids', () => {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'Evidence', 'research', 'scripts', 'runs.json'), 'utf8'));
  for (const r of data.runs) {
    const name = `${r.repo} #${r.issue}`;
    assert.ok(data.configs[r.config], name + ': config');
    assert.ok(data.projects[r.repo], name + ': project');
    assert.ok(typeof r.recorded.cost === 'number' && typeof r.recorded.turns === 'number', name + ': recorded');
    assert.ok(r.sessions.length && r.sessions.every(s => /^[0-9a-f]{8}$/.test(s.id)), name + ': sessions');
    if (r.config !== 'baseline') assert.ok(['Standard', 'Small'].includes(r.tier) && r.sessions.every(s => s.start), name + ': tier and start');
  }
});

test('README: every cost and context figure is one research/11 reports', () => {
  // The README's results come from runs.js through research/11 (#3); a figure typed in by hand would drift.
  const readme = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');
  const r11 = fs.readFileSync(path.join(__dirname, '..', 'Evidence', 'research', '11-meta-analysis.md'), 'utf8');
  const figures = readme.match(/\$\d+\.\d\d|\b\d+(?:–\d+)?k\b/g) || [];
  assert.ok(figures.length >= 8, 'the README states its results');
  for (const f of new Set(figures)) assert.ok(r11.includes(f), `README's ${f} appears in research/11`);
});
