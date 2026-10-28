// Usage: node runs.js [--json] [--projects <dir>]
// Re-prices every run in runs.json from its transcripts, split by phase, with one method (research/11).
// Phases: A (plan), B (build), C (review and fixes), close. A session starts in its `start` phase;
// /scope, /review, /close and the Skill calls for build, review and close move it on. Baseline runs
// have no phases ("all"), and phases only move forward. Main-session calls that drive the browser
// pane, and the calls between them (gaps of up to UI_GAP calls), are counted as ui in their phase.
// Subagents go by agentType. A session's `extra.from` puts everything from then on in "extra",
// which is reported but left out of the total.
const fs = require('fs');
const path = require('path');
const os = require('os');

// $/MTok, platform.claude.com/docs/en/about-claude/pricing (fetched 2026-10-21), as cost.js
const PRICE = {
  'claude-opus-5-5':   { in: 4, w5: 5,   w1: 8, read: 0.20, out: 20 },
  'claude-sonnet-5-5': { in: 2, w5: 2.5, w1: 4, read: 0.10, out: 10 },
};
const UI_GAP = 4;
const BROWSER = /^mcp__Claude_Browser__/;

const read = f => fs.readFileSync(f, 'utf8').split('\n').map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

// One entry per API call, in order. Streaming writes one line per content block with the same
// message id: keep the last usage, the first timestamp, and every tool name.
function calls(lines) {
  const byId = new Map(), order = [];
  lines.forEach((o, i) => {
    if (o.type === 'user') { order.push({ marker: marker(o), i }); return; }
    if (o.type !== 'assistant' || !o.message || !o.message.usage || o.message.model === '<synthetic>') return;
    let c = byId.get(o.message.id);
    if (!c) { c = { model: o.message.model, ts: o.timestamp, tools: [], i }; byId.set(o.message.id, c); order.push(c); }
    c.u = o.message.usage;
    for (const b of o.message.content || []) if (b.type === 'tool_use') c.tools.push({ name: b.name, input: b.input || {} });
  });
  return order.filter(x => x.u || x.marker);
}

function text(o) {
  const c = o.message && o.message.content;
  if (typeof c === 'string') return c;
  return Array.isArray(c) ? c.filter(b => b.type === 'text').map(b => b.text).join('\n') : '';
}
function marker(o) {
  const m = /<command-name>\/(scope|review|close)<\/command-name>/.exec(text(o));
  return m ? { scope: 'A', review: 'C', close: 'close' }[m[1]] : null;
}
function toolPhase(t) {
  if (t.name === 'Skill') {
    const s = String(t.input.skill || '').split(':').pop();
    return { build: 'B', review: 'C', close: 'close' }[s] || null;
  }
  if (t.name === 'Agent' && t.input.subagent_type === 'red-team') return 'C';
  return null;
}

function split(u) {
  const cc = u.cache_creation || {};
  const w1 = cc.ephemeral_1h_input_tokens ?? 0;
  const w5 = cc.ephemeral_5m_input_tokens ?? ((u.cache_creation_input_tokens || 0) - w1);
  return { in: u.input_tokens || 0, w5, w1, read: u.cache_read_input_tokens || 0, out: u.output_tokens || 0 };
}
function price(c) {
  const s = split(c.u), p = PRICE[c.model];
  if (!p) throw new Error('no price for ' + c.model);
  return Object.keys(s).reduce((x, k) => x + s[k] * p[k] / 1e6, 0);
}
const ctx = c => { const s = split(c.u); return s.in + s.w5 + s.w1 + s.read; };

const RANK = { A: 0, B: 1, C: 2, close: 3 };

// Tag each main-session call with its phase and whether it is part of a browser check.
function tagMain(entries, start) {
  let phase = start || 'all';
  const to = p => { if (phase !== 'all' && p && RANK[p] > RANK[phase]) phase = p; };
  const out = [];
  for (const e of entries) {
    if (e.marker) { to(e.marker); continue; }
    out.push({ ...e, phase, browser: e.tools.some(t => BROWSER.test(t.name)) });
    for (const t of e.tools) to(toolPhase(t));
  }
  markUi(out);
  return out;
}
function markUi(cs) {
  let last = -Infinity;
  cs.forEach((c, i) => {
    if (!c.browser) return;
    if (i - last - 1 <= UI_GAP) for (let j = last + 1; j < i; j++) if (cs[j].phase === c.phase) cs[j].ui = true;
    c.ui = true; last = i;
  });
}

const zero = () => ({ cost: 0, calls: 0, peak: 0 });
function add(acc, key, c) {
  const a = acc[key] = acc[key] || zero();
  a.cost += price(c); a.calls++; a.peak = Math.max(a.peak, ctx(c));
}

function findSession(dir, id) {
  const f = fs.readdirSync(dir).find(x => x.startsWith(id) && x.endsWith('.jsonl'));
  if (!f) throw new Error(`no transcript ${id} in ${dir}`);
  return path.join(dir, f);
}

function priceRun(run, projectsDir, projects) {
  const dir = path.join(projectsDir, projects[run.repo]);
  const parts = {}, starts = [];
  let total = 0, extra = 0, mainPeak = 0, over200 = 0;
  for (const s of run.sessions) {
    const f = findSession(dir, s.id), from = s.extra && s.extra.from;
    const isExtra = c => from && c.ts >= from;
    const main = tagMain(calls(read(f)), s.start);
    if (main.length) starts.push(ctx(main[0]));
    for (const c of main) {
      if (isExtra(c)) { add(parts, 'extra', c); extra += price(c); continue; }
      add(parts, c.ui ? `${c.phase}:ui` : c.phase, c);
      total += price(c); mainPeak = Math.max(mainPeak, ctx(c)); if (ctx(c) > 200e3) over200++;
    }
    const sub = path.join(dir, path.basename(f, '.jsonl'), 'subagents');
    if (fs.existsSync(sub)) for (const x of fs.readdirSync(sub).filter(n => n.endsWith('.jsonl'))) {
      const meta = JSON.parse(fs.readFileSync(path.join(sub, x.replace('.jsonl', '.meta.json')), 'utf8'));
      const cs = calls(read(path.join(sub, x))).filter(e => e.u);
      if (cs.length && isExtra(cs[0])) { for (const c of cs) { add(parts, 'extra', c); extra += price(c); } continue; }
      const ui = cs.map(c => ({ ...c, phase: meta.agentType, browser: c.tools.some(t => BROWSER.test(t.name)) }));
      markUi(ui);
      for (const c of ui) { add(parts, c.ui ? `${meta.agentType}:ui` : meta.agentType, c); total += price(c); }
    }
  }
  return { total, extra, parts, mainPeak, over200, starts };
}

const r2 = n => Math.round(n * 100) / 100;
const median = xs => { const s = [...xs].sort((a, b) => a - b), m = s.length >> 1; return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : NaN; };
const sum = (p, keys) => keys.reduce((x, k) => x + (p[k] ? p[k].cost : 0), 0);

// Named groups for the tables. Each key of `parts` falls in exactly one.
function groups(p) {
  const keys = Object.keys(p), pick = re => keys.filter(k => re.test(k));
  return {
    plan: sum(p, pick(/^A(:ui)?$/)) + sum(p, pick(/^surveyor/)),
    build: sum(p, pick(/^B$/)) + sum(p, pick(/^builder$/)),
    ui: sum(p, pick(/:ui$/)),
    review: sum(p, pick(/^C$/)) + sum(p, pick(/^red-team$/)),
    close: sum(p, pick(/^close$/)),
    other: sum(p, keys.filter(k => !/^(A|B|C|close)(:ui)?$|^(surveyor|builder|red-team)(:ui)?$|^extra$/.test(k))),
  };
}

function main() {
  const args = process.argv.slice(2);
  const pi = args.indexOf('--projects');
  const projectsDir = pi >= 0 ? args[pi + 1] : path.join(os.homedir(), '.claude', 'projects');
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'runs.json'), 'utf8'));
  const rows = data.runs.map(run => ({ run, ...priceRun(run, projectsDir, data.projects) }));
  if (args.includes('--json')) {
    console.log(JSON.stringify(rows.map(({ run, total, extra, parts, mainPeak, over200, starts }) => ({
      issue: run.issue, repo: run.repo, config: run.config, tier: run.tier || null, kind: run.kind,
      diff: run.diff || null, recorded: run.recorded, total: r2(total), extra: r2(extra), groups: Object.fromEntries(Object.entries(groups(parts)).map(([k, v]) => [k, r2(v)])),
      parts: Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, { cost: r2(v.cost), calls: v.calls, peak: Math.round(v.peak / 1e3) }])),
      mainPeak: Math.round(mainPeak / 1e3), over200, starts: starts.map(s => Math.round(s / 1e3)),
    })), null, 1));
    return;
  }
  const d = n => '$' + n.toFixed(2), k = n => Math.round(n / 1e3) + 'k';
  console.log('| Run | Config | Tier | Diff | Plan | Build | UI check | Review | Close | Other | Total | Recorded | Extra | Main peak | Turns |');
  console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const { run, total, extra, parts, mainPeak } of rows) {
    const g = groups(parts), diff = run.diff ? `${run.diff[0]}f +${run.diff[1]} −${run.diff[2]}` : '—';
    const cell = n => n ? d(n) : '—';
    console.log(`| ${run.repo === 'InvoiceMe' ? 'IM' : run.repo === 'BabyBuddyHelper' ? 'BBH' : 'HE101'} #${run.issue} | ${run.config} | ${run.tier || '—'} | ${diff} | ${cell(g.plan)} | ${cell(g.build)} | ${cell(g.ui)} | ${cell(g.review)} | ${cell(g.close)} | ${cell(g.other)} | **${d(total)}** | ${d(run.recorded.cost)} | ${cell(extra)} | ${k(mainPeak)} | ${run.recorded.turns} |`);
  }
  console.log('\n| Config | Tier | Runs | Median cost | Median plan | Median build | Median review | Median main peak | Median turns |');
  console.log('|---|---|---|---|---|---|---|---|---|');
  const keyOf = r => `${r.run.config}|${r.run.tier || '—'}|${r.run.kind}`;
  for (const key of [...new Set(rows.map(keyOf))]) {
    const rs = rows.filter(r => keyOf(r) === key), [config, tier, kind] = key.split('|'), gs = rs.map(r => groups(r.parts));
    const md = f => config === 'baseline' ? '—' : d(median(gs.map(f)));
    console.log(`| ${config}${config === 'baseline' ? ` (${kind})` : ''} | ${tier} | ${rs.length} | ${d(median(rs.map(r => r.total)))} | ${md(g => g.plan)} | ${md(g => g.build)} | ${md(g => g.review)} | ${k(median(rs.map(r => r.mainPeak)))} | ${median(rs.map(r => r.run.recorded.turns))} |`);
  }
}

if (require.main === module) main();
module.exports = { calls, tagMain, markUi, priceRun, groups, median, PRICE };
