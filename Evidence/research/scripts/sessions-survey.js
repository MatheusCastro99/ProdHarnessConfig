// Usage: node survey.js <projectDir>  — one line per session: title, first prompt, span, calls, ctx, cost
const fs = require('fs'), path = require('path');
const PRICE = {
  'claude-opus-5-5': [4, 5, 8, 0.20, 20], 'claude-sonnet-5-5': [2, 2.5, 4, 0.10, 10],
  'claude-opus-5': [5, 6.25, 10, 0.5, 25], 'claude-sonnet-5': [2, 2.5, 4, 0.2, 10],
  'claude-haiku-5-5': [0.10, 0.125, 0.20, 0.01, 0.5], 'claude-fable-5-1': [10, 12.5, 20, 0.25, 50],
};
const read = f => fs.readFileSync(f, 'utf8').split('\n').map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
function cost(lines, models) {
  const byId = new Map();
  for (const o of lines) if (o.type === 'assistant' && o.message && o.message.usage && o.message.model !== '<synthetic>') byId.set(o.message.id, o);
  let c = 0, n = 0, ctx = [];
  for (const o of byId.values()) {
    const u = o.message.usage, p = PRICE[o.message.model]; models.add(o.message.model);
    if (!p) continue;
    const cc = u.cache_creation || {}, w1 = cc.ephemeral_1h_input_tokens || 0, w5 = (u.cache_creation_input_tokens || 0) - w1;
    c += ((u.input_tokens || 0) * p[0] + w5 * p[1] + w1 * p[2] + (u.cache_read_input_tokens || 0) * p[3] + (u.output_tokens || 0) * p[4]) / 1e6;
    n++; ctx.push((u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0));
  }
  return { c, n, ctx };
}
const dir = process.argv[2];
const rows = [];
for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.jsonl'))) {
  const L = read(path.join(dir, f)); if (!L.length) continue;
  const models = new Set();
  const main = cost(L, models);
  let sub = { c: 0, n: 0 };
  const sd = path.join(dir, f.replace('.jsonl', ''), 'subagents');
  if (fs.existsSync(sd)) for (const s of fs.readdirSync(sd).filter(x => x.endsWith('.jsonl'))) { const r = cost(read(path.join(sd, s)), models); sub.c += r.c; sub.n += r.n; }
  const title = (L.filter(o => o.type === 'custom-title').pop() || {}).customTitle || '';
  const ts = L.map(o => o.timestamp).filter(Boolean).sort();
  let first = '', turns = 0;
  for (const o of L) if (o.type === 'user' && !o.isMeta && o.message) {
    const c = o.message.content; const t = (typeof c === 'string' ? c : Array.isArray(c) ? c.filter(x => x.type === 'text').map(x => x.text).join(' ') : '').trim();
    if (t && !t.startsWith('<') ) { turns++; if (!first) first = t.replace(/\s+/g, ' ').slice(0, 70); }
  }
  const issues = [...new Set((JSON.stringify(L).match(/#(\d{1,3})\b/g) || []))].slice(0, 0);
  rows.push({ f: f.slice(0, 8), start: (ts[0] || '').slice(0, 16), title: title.slice(0, 40), first, turns, calls: main.n, sub: sub.n,
    ctx0: main.ctx.length ? Math.round(main.ctx[0] / 1e3) : 0, ctxMax: main.ctx.length ? Math.round(Math.max(...main.ctx) / 1e3) : 0,
    cost: main.c + sub.c, subCost: sub.c, models: [...models].map(m => m.replace('claude-', '')).join(',') });
}
rows.sort((a, b) => a.start.localeCompare(b.start));
for (const r of rows) console.log(`${r.f} ${r.start} | ${r.title.padEnd(40)} | turns ${String(r.turns).padStart(3)} calls ${String(r.calls).padStart(4)}+${String(r.sub).padStart(3)} | ctx ${r.ctx0}k→${r.ctxMax}k | $${r.cost.toFixed(2)} (sub $${r.subCost.toFixed(2)}) | ${r.models}\n      "${r.first}"`);
