// Usage: node cost.js <session.jsonl> [more.jsonl ...]
// Cost by token type at list price, per model, with 5m/1h cache-write split.
// Subagent transcripts are picked up from <session>/subagents/*.jsonl.
const fs = require('fs');
const path = require('path');

// $/MTok, platform.claude.com/docs/en/about-claude/pricing (fetched 2026-10-21)
const PRICE = {
  'claude-opus-5-5':   { in: 4, w5: 5,   w1: 8, read: 0.20, out: 20 },
  'claude-sonnet-5-5': { in: 2, w5: 2.5, w1: 4, read: 0.10, out: 10 },
};
const read = f => fs.readFileSync(f, 'utf8').split('\n').map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

function calls(lines) {
  const byId = new Map(); // streaming writes several lines per id; keep the last
  for (const o of lines) if (o.type === 'assistant' && o.message && o.message.usage)
    byId.set(o.message.id, { u: o.message.usage, model: o.message.model, ts: o.timestamp });
  return [...byId.values()].filter(c => c.model && c.model !== '<synthetic>');
}
function split(u) {
  const cc = u.cache_creation || {};
  const w1 = cc.ephemeral_1h_input_tokens ?? 0;
  const w5 = cc.ephemeral_5m_input_tokens ?? ((u.cache_creation_input_tokens || 0) - w1);
  return { in: u.input_tokens || 0, w5, w1, read: u.cache_read_input_tokens || 0, out: u.output_tokens || 0 };
}
const zero = () => ({ in: 0, w5: 0, w1: 0, read: 0, out: 0, calls: 0, cost: { in: 0, w5: 0, w1: 0, read: 0, out: 0 } });
function add(acc, c) {
  const s = split(c.u), p = PRICE[c.model];
  if (!p) throw new Error('no price for ' + c.model);
  for (const k of Object.keys(s)) { acc[k] += s[k]; acc.cost[k] += s[k] * p[k] / 1e6; }
  acc.calls++;
}
const total = a => Object.values(a.cost).reduce((x, y) => x + y, 0);
const tok = a => a.in + a.w5 + a.w1 + a.read + a.out;
function row(name, a) {
  const t = total(a), m = n => (n / 1e6).toFixed(2), d = n => '$' + n.toFixed(2), pc = n => (100 * n / t).toFixed(0) + '%';
  return `${name.padEnd(28)} calls ${String(a.calls).padStart(4)} | tokens ${m(tok(a))}M | in ${m(a.in)}M ${d(a.cost.in)} | w5m ${m(a.w5)}M ${d(a.cost.w5)} | w1h ${m(a.w1)}M ${d(a.cost.w1)} | read ${m(a.read)}M ${d(a.cost.read)} (${pc(a.cost.read)}) | out ${m(a.out)}M ${d(a.cost.out)} (${pc(a.cost.out)}) | writes ${pc(a.cost.w5 + a.cost.w1)} | TOTAL ${d(t)}`;
}

const groups = {}, grand = zero(), mainCalls = [];
for (const f of process.argv.slice(2)) {
  const sess = path.basename(f, '.jsonl').slice(0, 8);
  const main = zero();
  for (const c of calls(read(f))) { add(main, c); add(grand, c); mainCalls.push(c); }
  groups[`${sess} main`] = main;
  const dir = path.join(path.dirname(f), path.basename(f, '.jsonl'), 'subagents');
  if (fs.existsSync(dir)) for (const s of fs.readdirSync(dir).filter(x => x.endsWith('.jsonl'))) {
    const meta = JSON.parse(fs.readFileSync(path.join(dir, s.replace('.jsonl', '.meta.json')), 'utf8'));
    const cs = calls(read(path.join(dir, s)));
    const key = `${sess} sub:${meta.agentType}`;
    groups[key] = groups[key] || zero();
    const one = zero();
    for (const c of cs) { add(groups[key], c); add(grand, c); add(one, c); }
    console.log(row(`  ${meta.agentType} [${cs[0] && cs[0].model.replace('claude-', '')}]`, one), '·', meta.description);
  }
}
console.log();
for (const [k, a] of Object.entries(groups)) console.log(row(k, a));
console.log(row('ALL', grand));

// Biggest single main-session calls by cost: shows misses / rewrites.
console.log('\nTop 8 main-session calls by cost:');
mainCalls.map(c => { const a = zero(); add(a, c); return { ts: c.ts, a }; })
  .sort((x, y) => total(y.a) - total(x.a)).slice(0, 8)
  .forEach(({ ts, a }) => console.log(`  ${ts}  $${total(a).toFixed(2)}  w1h ${(a.w1 / 1e3).toFixed(0)}k  w5m ${(a.w5 / 1e3).toFixed(0)}k  read ${(a.read / 1e3).toFixed(0)}k  out ${(a.out / 1e3).toFixed(1)}k`));
// Context size trajectory and cost per call vs context size
const ctx = mainCalls.map(c => { const s = split(c.u); return s.in + s.w5 + s.w1 + s.read; });
console.log(`\nMain context: first ${(ctx[0] / 1e3).toFixed(0)}k, max ${(Math.max(...ctx) / 1e3).toFixed(0)}k, mean ${(ctx.reduce((a, b) => a + b, 0) / ctx.length / 1e3).toFixed(0)}k over ${ctx.length} calls`);
