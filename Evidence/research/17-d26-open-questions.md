# R17: The open questions after D26's meta-analysis

Date: 2026-11-23. This is the second iteration of D26's meta-analysis. [research/16](16-d26-meta-analysis.md) answered the cost questions and research/14's first open question. This file answers the other four, Q2 to Q5 of [research/14](14-d26-validation.md)'s "Questions for the D26 meta-analysis".
- **The data:** the same 34 D26 runs.
- **The method:** figures marked "by transcript" come from a script over the transcripts at `runs.js`'s prices, which isn't committed. Q2 also draws on the projects' own documentation, read on this date.

**In short:**

| # | Question | Answer |
|---|---|---|
| Q2 | Run ProdHarnessConfig from an external harness (Hermes, OpenClaw)? | **No, not now.** Neither would fix a cost, turn or quality problem D26 measured, and both would cost the gates and the measurement |
| Q3 | A lower thinking level? | **Try it where the work is checked downstream:** the builder, `ui-check` and the surveyor. Keep the plan, the review session and the red-team at high. The direct saving is small, and the trial says whether there are indirect ones (R17-1) |
| Q4 | A structured output per phase? | **Not as a general rule.** The plan and the handoff already have one. The closing messages are a small part of the output. The G2 report is the one place a fixed shape would help, mostly with turns, and #9 §14 and §26 cover it |
| Q5 | `/draft` → `/route`? | **Yes.** One router replaces the routing rules #9 spreads across `/draft`, `/scope` and `/close`. The data has nine runs that went wrong at the entry, and the router costs nothing when the route is "plan now" (R17-2) |

## Q2. An external harness: Hermes or OpenClaw

**What they are** (from their own sites and documentation, 2026-11-23):

| | Hermes Agent | OpenClaw |
|---|---|---|
| Made by | Nous Research, MIT license | An open-source foundation, MIT license. It began as Clawdbot, then Moltbot, in November 2025 |
| What it is | An agent harness: persistent memory, a skills system in the agentskills.io format, 47 built-in tools, scheduled jobs, MCP servers | A personal agent that runs as a background process on your own machine and acts on your apps and files |
| How you reach it | The terminal, a desktop app, and messaging (Telegram, Discord, Slack, WhatsApp, email) | Messaging apps (WhatsApp, Telegram, Slack, Discord) |
| Models | Any provider: Nous Portal, OpenRouter, OpenAI, a custom endpoint | Any model; the harness supplies the hands, the model the reasoning |
| Subagents | `delegate_task` spawns children with isolated context and restricted tools, a few at a time (its pages give 3 or 10 as the default) | Not documented as a core feature |
| Hooks | Event hooks, for example on compression and for subagents | Not documented as a core feature |
| Context | Compresses at half the context limit, through an auxiliary model | — |
| Caveats | — | Reviewers warn it isn't secure by default; its gateway needs broad permissions |

**What ProdHarnessConfig depends on in Claude Code:**
- **Skills,** forked with `context: fork` and run on a set model and effort.
- **Subagents with a model and effort each:** builder, red-team, surveyor, `ui-check`.
- **Hooks that block:**
  - `check-gate` stops the agent from stopping while checks fail;
  - `docs-gate` stops a commit that leaves a doc stale;
  - `file-check` and `finish-guard`.
- **Plan mode,** which is G1's approval.
- **The desktop app's PR tools,** which turn Auto-fix off (E2).
- **Claude Code's transcripts,** which `runs.js` prices. Every figure in research/11–16 comes from them.

**Weighed against D26's measured problems** (research/16 §3), neither harness helps:

| Problem | Would Hermes or OpenClaw fix it? |
|---|---|
| UI checks reading screenshots into context | No. It is how the UI agent works, and #9 §23 fixes it in any harness |
| G2 fixes costing a builder and an unchanged review session | No. It is the workflow's design (#9 §26) |
| Owner changes, drafting, wrong entries | No. They are the workflow's routing (Q5) |
| Hangs and stuck CI | No. #9 §6 and §25 are harness-neutral |
| Thinking's share of output | Partly. A model-agnostic harness could put cheaper models on some blocks, but Claude Code already sets a model and effort per agent (Q3) |

**What would be lost:**
- **The gates.** `check-gate`, `docs-gate`, `file-check` and `finish-guard` are blocking hooks, and they are the "enforce with code, not with prompts" principle. Hermes documents event hooks. Whether they can block a tool call or a stop the same way would have to be shown before anything moved.
- **The measurement.** `runs.js` reads Claude Code's transcripts. A different harness means a different record and a new pricing method, so D27 would not be comparable with D22–D26.
- **The app's PR integration.** Auto-fix control and PR status.
- **For OpenClaw, the security model.** A harness that acts with broad permissions on the owner's machine, reached by messaging, is a different risk from Claude Code's per-tool permissions with a GitHub ruleset behind them.

**What would carry over:** the ideas. [Platform_Neutral/](../../Platform_Neutral/README.md) already separates them from Claude Code: the gates, the contracts, the fresh-context reviewer, the docs gate, and pricing each run. If the owner ever moves, that is the starting point.

**Where they might fit later:** as a front end. One example is starting `/route <n>` on a phone through a messaging channel, with the work itself still in Claude Code. That is a convenience, not a cost lever, and nothing in the data asks for it.

## Q3. A lower thinking level

**Today everything runs at `high`:** the session (`effortLevel` in `settings.json`), and each agent's frontmatter (builder, red-team, surveyor, `ui-check`).

**Output by agent across D26's 34 runs** (by transcript):

| | Share of all D26 spend | Output's share of its cost | Thinking's share of its visible output |
|---|---|---|---|
| Main sessions (Opus) | 48.6% | 24% | 24% |
| Builder (Sonnet) | 22.0% | 22% | 23% |
| Red-team (Opus) | 16.2% | 37% | 47% |
| `ui-check` (Sonnet) | 10.4% | 21% | 33% |
| Surveyor (Sonnet) | 1.5% | 35% | 14% |

Thinking billed in full is likely larger than the visible share: research/16 §3.5 puts thinking at 60–70% of all output, about 15–17% of an issue's cost.

**What a lower level could save directly is small.** Suppose a lower effort halved the builder's and `ui-check`'s thinking. The builder's output was $14.25 over 34 runs and `ui-check`'s $6.53. Halving their thinking saves about $0.20 a run, around 2%. Doing the same in the main sessions would save about $0.3–0.4 a run, but they plan and triage, where reasoning is the work.

**The indirect effect is unknown.** Effort also changes how much an agent explores: how many files it reads and how many screenshots it takes. On the builder and `ui-check`, that is where the money is (research/16 §3.2–3.3). It could cut cost, or cost quality.

**Where quality is checked downstream, a trial is cheap to run safely:**
- The builder's work is checked by CI, the red-team and `ui-check`.
- `ui-check`'s findings are triaged at G2.
- The surveyor only reads.

The plan, the review session and the red-team are where a missed step costs most, so they stay at `high`.

**R17-1: a labelled effort trial.** After the reinstall:
- run the builder, `ui-check` and the surveyor at `medium` for a block of runs, labelled apart in `runs.json`;
- price them against D27's `high` runs;
- compare G2 findings per run, `BLOCKED` handoffs, builder retries, and escapes.

It combines with #9 §18's Sonnet trial only if the two are labelled apart, so that each effect can be read.

## Q4. A structured output per phase

**Where the output goes.** In D26's main sessions (by transcript), the visible output splits as:
- 63% tool inputs: file edits, scripts, comments, the plan and the handoff;
- 24% thinking;
- 13% text to the owner.

At Opus's output price, the text to the owner is at most about $0.13 a run. Shortening it saves little.

**What is already structured:**
- **The plan:** required sections and a 12k budget, checked by `handoff-check --plan`.
- **The handoff:** required sections, an 8k budget and `--verify-head`.
- **The G2 report:** numbered decisions with recommendations (D25 C8, D26 E8).

These are what keep the runs consistent, and they were followed in every D26 run.

**Where shape still costs:**
- **In turns, not tokens.** #66's G2 offered to draft a rule rather than quoting it, which cost a turn (#9 §14).
- **In the plan's amendments,** which go over budget and get trimmed in several Opus calls (#9 §2).
- **In the scripts the sessions write to make edits,** a large part of the 63%. #9 §11 (the scripting runtime) and §25 (no stray `cat`) make those cheaper and safer.

**Conclusion:** no general structured-output rule. If the G2 report still varies after §14 and §26, a fixed template in `review` (decisions, each with the quoted text and a recommendation) is the one to add.

## Q5. `/draft` → `/route <issue>`

**The owner's proposal:** one entry point for every issue, which decides what the issue needs and in what order: an issue-workflow orchestrator.

**What #9 does today:** it spreads that decision over several places.

| Section | Rule | Where it lives |
|---|---|---|
| §1 | Draft content, art or design first, or go straight to `/scope` | `/draft` |
| §12 | An Epic issue goes to the one-command close | `/draft`, and `/scope` refuses an Epic |
| §17 | A tiny docs, config or decline issue gets the light lane | `/scope`, at G1 |
| §21 | An unused-dependency removal can be Small | `/scope`'s tier check |
| §22 | A "find, then fix" issue gets its audit first | `/draft` |
| §20 | Laying out an Epic | its own skill |
| §28, §29 | Which steps run in a fresh session | `review`, `build` |

**The runs that went wrong at the entry, all in D26:**

| Run | What happened | Cost |
|---|---|---|
| TIMC #44, #63 | Epic closes opened with `/scope`; the audit ran last | The findings became the next Epic's first phase (#64: $4.92, 7 turns); #63 peaked at 234k |
| IM #136 | The close in the right order, over three entry points | 9 turns against Small's 6 |
| BBH #71 | `/scope 167`, the Epic's number | $0.76, 1 turn |
| TIMC #53 | Art drafted inside `/scope` | 238k peak, 3 turns off the planned path |
| IM #170 | Design drafted inside `/scope`, at the owner's choice | The session to 187k |
| BBH #176 | An audit run inside the build | $4.62 and 3 turns |
| TIMC #68 | A 17-line decline through the whole loop | About $0.75 and 5 minutes over the light lane |
| BBH #191 | A bug that couldn't be reproduced, parked at G1 | It ended well; a router would have offered "diagnose first" from the start |

**What a router would cost:** almost nothing on the common path. `/draft` (§1) was already designed to read the issue and invoke `/scope` itself when nothing needs drafting. `/route` does the same reading, and so do the ordinary issues.

When the route has more than one step, it writes it once:
- **where:** `.harness/work/<n>/route.md`, and a comment on the issue;
- **what:** the steps in order, which session each runs in, and the tier it expects.

It then starts the first step. Each later step reads `route.md` instead of rediscovering the order, as `/scope` did on #44 and #63.

**R17-2: `/draft` becomes `/route <n>`.** It is the entry point for every issue, and it chooses one of:
1. **Scope now:** the common case; it invokes `/scope`.
2. **Draft first** (§1).
3. **Audit first** (§22).
4. **Diagnose first:** a bug that can't be reproduced.
5. **The light lane** (§17).
6. **The Epic close** (§12).
7. **Lay out the Epic** (§20).

It states the tier with its reason (E8). The skills it routes to keep their own rules, but no longer decide the route themselves: `/scope` no longer offers drafting or refuses Epics, because `/route` already has.

The skill must fit the 2.5k-token budget. The choices table is its core, and the routes' details stay in the skills they call.

## Triage

**2026-11-23:** the owner took R17-2. It rewrites ProdHarnessConfig#9 §1 as `/route <n>`, with §12, §17, §20 and §22 now reached through it. R17-1 (the effort trial) was not taken. Q2 stands as answered: no move.

For the owner, before #9 and #8 are built:
- **R17-1, an effort trial** for the builder, `ui-check` and the surveyor, after the reinstall: take it into #9 (beside §18), or not.
- **R17-2, `/route`:** take it as a rewrite of #9 §1, folding the routing in §12, §17 and §22 into it, or not.
- **Q2:** no move, as above, unless the owner wants a messaging front end explored separately.
- **research/16 §8, the Standard target:** still open.
