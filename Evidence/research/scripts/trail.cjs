#!/usr/bin/env node
'use strict';
// The /trail skill's tools (D27, ProdHarnessConfig#9 §9): find a finished run's transcripts, read their timeline,
// and price them by window, with the same prices and call reading as runs.js.
// Usage:
//   node trail.cjs sessions <repo> [--since <ISO>]          recent sessions: id, span, owner messages, models, first message
//   node trail.cjs timeline <repo> <id>                     owner messages and the key calls, with time and context
//   node trail.cjs windows  <repo> <id> [<cut ISO> ...]     the main session split at the cuts, then each subagent, priced
// <repo> is a project's name or initials (TIMC, IM, BBH). --projects <dir> overrides ~/.claude/projects.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { calls, price, ctx, imageCount } = require('./runs.js'); // one pricing, shared with runs.js

const ALIASES = { TIMC: 'ThisIsMatheusCastro', IM: 'InvoiceMe', BBH: 'BabyBuddyHelper', HE101: 'HarnessEngineering101' };
const read = f => fs.readFileSync(f, 'utf8').split('\n').map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

function projectDir(repo, projectsDir) {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'runs.json'), 'utf8'));
  const name = ALIASES[repo.toUpperCase()] || repo;
  if (!data.projects[name]) throw new Error(`unknown project: ${repo}`);
  return path.join(projectsDir, data.projects[name]);
}
function findSession(dir, id) {
  const f = fs.readdirSync(dir).find(x => x.startsWith(id) && x.endsWith('.jsonl'));
  if (!f) throw new Error(`no transcript ${id} in ${dir}`);
  return path.join(dir, f);
}


// The owner's own messages: not tool results, hook output, notifications or local commands.
function ownerText(o) {
  if (o.type !== 'user' || o.isMeta || o.isSidechain) return null;
  const c = o.message && o.message.content;
  const s = typeof c === 'string' ? c : Array.isArray(c) ? c.filter(b => b.type === 'text').map(b => b.text).join(' ') : '';
  if (!s || /^<(local-command|system-reminder|task-notification|ci-monitor-event)/.test(s)) return null;
  return s.replace(/<\/?command-(message|name|args)>/g, ' ').replace(/\s+/g, ' ').trim();
}

function sessions(dir, since = '') {
  const out = [];
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.jsonl'))) {
    const lines = read(path.join(dir, f));
    const ts = lines.map(o => o.timestamp).filter(Boolean);
    if (!ts.length || ts[ts.length - 1] < since) continue;
    const owner = lines.map(ownerText).filter(Boolean);
    const models = [...new Set(lines.filter(o => o.type === 'assistant' && !o.isSidechain && o.message && o.message.model && o.message.model !== '<synthetic>').map(o => o.message.model.replace(/^claude-/, '')))];
    out.push({ id: f.slice(0, 8), start: ts[0], end: ts[ts.length - 1], owner: owner.length, models, first: (owner[0] || '').slice(0, 90) });
  }
  return out.sort((a, b) => (a.start < b.start ? 1 : -1));
}

const KEY = /^(Skill|Agent|AskUserQuestion|ExitPlanMode|EnterPlanMode|SendMessage|mcp__ccd_pr__|mcp__ccd_session__start_session)/;
function timeline(file) {
  const out = [];
  for (const o of read(file)) {
    if (o.isSidechain) continue;
    const t = (o.timestamp || '').slice(11, 19);
    const s = ownerText(o);
    if (s) out.push(`OWNER ${t} ${s.slice(0, 240)}`);
    if (o.type === 'assistant' && o.message && o.message.usage) for (const b of o.message.content || []) {
      if (b.type !== 'tool_use') continue;
      const cmd = String((b.input || {}).command || '');
      if (!KEY.test(b.name) && !/git push|gh pr (create|ready)|gh issue comment|close\.cjs|handoff-check/.test(cmd)) continue;
      const what = b.name === 'Agent' ? `${b.input.subagent_type} ${b.input.description || ''}` : b.name === 'Skill' ? `${b.input.skill} ${b.input.args || ''}`
        : b.name === 'AskUserQuestion' ? (b.input.questions || []).map(q => q.header).join(' / ') : b.name.startsWith('mcp__') ? b.name : cmd.split('\n')[0];
      out.push(`  ${t} ${Math.round(ctx({ u: o.message.usage }) / 1e3)}k ${b.name} ${what.replace(/\s+/g, ' ').slice(0, 160)}`);
    }
  }
  return out;
}

function summarize(cs, label) {
  if (!cs.length) return null;
  return { label, calls: cs.length, first: Math.round(ctx(cs[0]) / 1e3), peak: Math.round(Math.max(...cs.map(ctx)) / 1e3),
    from: cs[0].ts, to: cs[cs.length - 1].ts, cost: cs.reduce((x, c) => x + price(c), 0),
    over200: cs.filter(c => ctx(c) > 200e3).length, images: cs.reduce((x, c) => x + c.tools.reduce((y, t) => y + imageCount(t), 0), 0),
    models: [...new Set(cs.map(c => c.model.replace(/^claude-/, '')))] };
}
// Each API call counts once, as in runs.js (#9 §7): a call two transcripts both hold is priced in the first window only.
function windows(file, cuts = []) {
  const seen = new Set(), once = c => !c.id || (seen.has(c.id) ? false : (seen.add(c.id), true));
  const main = calls(read(file)).filter(c => c.u).filter(once);
  const bounds = ['', ...cuts, '￿'], out = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    const w = summarize(main.filter(c => c.ts >= bounds[i] && c.ts < bounds[i + 1]), `main ${bounds[i] || 'start'}..${bounds[i + 1] === '￿' ? 'end' : bounds[i + 1]}`);
    if (w) out.push(w);
  }
  const sub = path.join(path.dirname(file), path.basename(file, '.jsonl'), 'subagents');
  if (fs.existsSync(sub)) for (const x of fs.readdirSync(sub).filter(n => n.endsWith('.jsonl'))) {
    const meta = JSON.parse(fs.readFileSync(path.join(sub, x.replace('.jsonl', '.meta.json')), 'utf8'));
    const w = summarize(calls(read(path.join(sub, x))).filter(c => c.u).filter(once), `sub ${meta.agentType} ${(meta.description || '').slice(0, 30)}`);
    if (w) out.push(w);
  }
  return out;
}

function main() {
  const args = process.argv.slice(2);
  const pi = args.indexOf('--projects'), si = args.indexOf('--since');
  const projectsDir = pi >= 0 ? args[pi + 1] : path.join(os.homedir(), '.claude', 'projects');
  const skip = new Set([pi, si].filter(i => i >= 0).map(i => i + 1));
  const pos = args.filter((a, i) => !a.startsWith('--') && !skip.has(i));
  const [cmd, repo, id, ...cuts] = pos;
  if (!cmd || !repo) { console.error('usage: trail.cjs sessions|timeline|windows <repo> [<id> [<cut ISO> ...]]'); process.exit(2); }
  const dir = projectDir(repo, projectsDir);
  if (cmd === 'sessions') for (const s of sessions(dir, si >= 0 ? args[si + 1] : '')) console.log(`${s.id} ${s.start} ${s.end} ${s.owner} ${s.models.join(',')} | ${s.first}`);
  else if (cmd === 'timeline') console.log(timeline(findSession(dir, id)).join('\n'));
  else if (cmd === 'windows') for (const w of windows(findSession(dir, id), cuts))
    console.log(`${w.label.padEnd(40)} ${String(w.calls).padStart(4)} calls ${w.first}k -> ${w.peak}k ${w.from.slice(11, 19)}-${w.to.slice(11, 19)} $${w.cost.toFixed(4)} over200 ${w.over200} images ${w.images} ${w.models.join(',')}`);
  else { console.error(`unknown command: ${cmd}`); process.exit(2); }
}

if (require.main === module) main();
module.exports = { sessions, timeline, windows, ownerText, projectDir };
