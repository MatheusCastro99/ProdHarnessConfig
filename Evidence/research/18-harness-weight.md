# R18: The harness's weight, and what can go

Date: 2026-11-23. The second meta-analysis of D26, at the owner's request. It answers three questions:
1. What does each part of the next version (ProdHarnessConfig#9's 29 sections and #8) solve?
2. Which parts of the harness didn't survive the research and can be dropped?
3. Where is the weight the owner feels?

**The data:**
- the same 34 D26 runs as [research/16](16-d26-meta-analysis.md) and [research/17](17-d26-open-questions.md);
- InvoiceMe's `hooks.log`. ThisIsMatheusCastro and BabyBuddyHelper keep none;
- the harness's own files.

Figures marked "by transcript" come from a script over the transcripts at `runs.js`'s prices, which isn't committed:
- each hook's messages, counted in tool results and hook feedback, never in the model's own text;
- the calls spent on each mechanic, priced whole.

## 1. Where the weight is

"Weight" here means three things: the context every session carries, the calls the harness's own mechanics spend, and the steps the owner has to take. The first two are measured below.

**The context a session starts with:** about 78k tokens. The harness's share of it is small:
- the project's `CLAUDE.md`: 7.8–9.6k characters, about 2–2.4k tokens;
- the skills' one-line descriptions;
- one `session-state` line.

That is about 3k tokens, 4% of the start. The rest is Claude Code's own system prompt and tools, the desktop app's instructions and the connected tools. The skills' bodies (2.5–7.6k characters each) and the agents' prompts load only when used. The hooks add nothing unless they speak.

**The calls the mechanics spend,** D26, all 34 runs (by transcript):

| Mechanic | Spend | Share of all D26 spend | A run |
|---|---|---|---|
| **The app's wrap-up box and task list** (`wrap_up`, `update_plan`) | $27.98 | **9.6%** | $0.82 |
| Validating plans and handoffs (`handoff-check`), mostly re-trimming plans to their budget | $15.94 | 5.5% | $0.47 |
| Updating the project memory at the close | $6.66 | 2.3% | $0.20 |
| Posting the plan, the handoff and the notes to the issue or PR | $4.70 | 1.6% | $0.14 |
| The PR's status and Auto-fix (`mcp__ccd_pr__*`) | $3.04 | 1.0% | $0.09 |
| `docs-gate`'s acknowledgements | $2.25 | 0.8% | $0.07 |

Each call is priced whole. That includes reading the session's context, at 80–190k on Opus.

**The largest single item isn't the harness.** The desktop app ends every turn with a `wrap_up` call, and keeps a task list through `update_plan`. Each is a call at the session's full context, on top of the closing message. Across D26 that was 9.6% of the spend, about $0.82 a run. The harness can't remove it. Running the same skills in the terminal (`claude`) instead of the desktop app would, at the cost of the app's PR panel, Auto-fix control and boxes. It is the owner's choice, and worth a labelled trial if the weight matters more than the app.

**The fixed context is mostly Claude Code's and the app's.** The lever there is D6's re-test (R15-7): turning off the Artifact tool and the connectors the projects don't use.

## 2. The harness today, part by part

What each installed part did across D26's 34 runs (by transcript, and InvoiceMe's `hooks.log` from 2026-11-10):

| Part | What it's for | What it did in D26 | Verdict |
|---|---|---|---|
| `check-gate` (the Stop gate) | No stop while fast checks fail | **Never blocked** in 34 runs: 24 passes in InvoiceMe's log, and no block in any transcript. It blocked twice on D25. Its known-failure path (E9) was used for one failure, Lighthouse's, on #52–#54, which #56 then fixed in CI | Keep the gate: it costs no tokens and is the safety net under "enforce with code". **Drop the known-failure path** (§3) |
| `docs-gate` | No commit that leaves a doc stale | 47 denials in 24 runs, answered with **427 acknowledgement lines** ("still accurate"), $0.07 a run. The docs drifted anyway: the Epic audits found 6, 12, 9 and 5 doc gaps, and the red-team found more | **Demote to a report** (§3) |
| `stale-docs.cjs` | Lists the docs a change may affect | 97 lists, 10–14 candidates each | Keep, as the report's source and the red-team's doc lens |
| `file-check` | Formats and lints each edited file | Spoke 20 times in 3 runs (ThisIsMatheusCastro's lint errors); silent otherwise. InvoiceMe's 22 checks all passed | Keep: silent when there's nothing to say |
| `finish-guard` | A forked build can't return without a handoff | Fired once in 34 runs (3 messages) | Keep: tiny, and it caught a real early return |
| `quiet.cjs` | Rewrites a check command typed by hand to run through `check.cjs` | **Never fired:** no trace in any transcript or in InvoiceMe's log. The skills always call `check.cjs` themselves | **Drop** (§3) |
| `session-state` | One line of state when a session starts | 121 lines in 21 runs | Keep: one line |
| `handoff-check --plan` | A plan's sections and size | 250 passes. **89 failures on the 12k budget** in 13 runs, each followed by a trim and a recheck at 110–160k on Opus: most of the $0.47 a run above. 7 failures on T7's `frontend-design:` line | **Make the budget a warning** below a hard ceiling, and **drop the `frontend-design` line** (§3) |
| `handoff-check` (the handoff) | A handoff's sections, and the head it names | 22 failures, 11 of them a required CI job not passing (E5, working). 4 refusals of a moved head (#46, #171), both real | Keep |
| `close.cjs` | Cleans up after the merge | 62 closes; exit 4 on 8 Epic closes, as designed | Keep |
| `check.cjs` | Runs the project's checks with trimmed output | 251 passes, 15 failures caught | Keep |
| The surveyor | Reads unfamiliar code for `/scope` on Sonnet | 12 of 20 Standard runs, $0.24 median; C6 keeps it off when the issue names its files | Keep |
| The red-team | Reviews the handed-off commit | Found every blocking issue in D26 (#66, #67, #69, #172) | Keep |
| `ui-check` | Checks the UI in review | Found real failures (IM #168, BBH #175, #177), at 13% of Standard spend | Keep, slimmed by #9 §23, §24, §27 |
| `reviewOnReady` (the `review` skill and `lib/harness.cjs`) | Waits for a review bot when the PR is marked ready | **No project uses it** since BabyBuddyHelper's was removed (C11). Copilot reviews come off (#9 §19) | **Drop** (§3) |

## 3. What didn't survive, and can go

| # | Drop | Evidence | What goes | Saves |
|---|---|---|---|---|
| X1 | **`quiet.cjs`** | It never fired in D26: no transcript trace, nothing in InvoiceMe's log | The hook, its `settings.json` entry, its tests, its doc lines | A hook on every Bash call, and code to maintain. No tokens |
| X2 | **The known-failure path** (E9), with **#8** and **#9 §10** | Used for one failure in 34 runs. That failure was fixed at its source the next day (#56 made Lighthouse's blocking time a warning), which was the right fix. #8 patches a gap in this path, and §10 widens it to the repo | `check-gate`'s known-failure branch, `known-failures.md` in `review`, #8, and #9 §10. The gate goes back to "failing checks block; three in a row write `BLOCKED`" | Two open work items and a branch of the Stop gate. A real recurring failure goes to its issue and gets fixed or made non-blocking in CI |
| X3 | **The plan's hard 12k budget** | 89 failures in 13 runs, each a trim and recheck on Opus at 110–160k; InvoiceMe #141's first plan took seven, BabyBuddyHelper #76's eight. #9 §2 already lets an amended plan condense | `handoff-check --plan` warns above 12k and fails only above a hard ceiling (for example 20k, about 5k tokens). The handoff's 8k budget stays | Most of the $0.47 a run spent on validation |
| X4 | **T7's required `frontend-design:` line** on UI sub-phases | 7 plan failures. Nothing in the runs shows the line changed a design. The skill is used when it's useful (IM #170, TIMC's sections) | The check in `handoff-check` and the line in `scope` | A failure and a recheck on UI plans |
| X5 | **`reviewOnReady`** | No project sets it; Copilot comes off (#9 §19) | Its branch in `review` and `lib/harness.cjs`, its tests and doc lines | Skill text loaded on every review |
| X6 | **`docs-gate` as a deny**, kept as a report | 47 denials led to 427 "still accurate" lines; drift was still caught by the red-team and the Epic audits instead. The gate mostly makes the session write acknowledgements | `docs-gate` reports the candidate docs (a `systemMessage`), and the handoff lists them for the red-team's doc lens, instead of denying the commit. #9 §5 (the acknowledgement message) goes with it | A denial and an acknowledgement call on most runs, and the "ack" file. **This one changes a principle** ("enforce with code"), so it is the owner's call more than the others |

Together, X1–X6 remove:
- a hook, plus most of a second hook's blocking role;
- a script check and two plan rules;
- one skill branch;
- two open work items (#8, #9 §10) and one #9 section (§5).

No part with a measured catch goes: the Stop gate, the head check, E5, the red-team, `ui-check`, `finish-guard` and `file-check` all stay.

## 4. The next version, section by section

What each section of ProdHarnessConfig#9 solves, the D26 evidence for it, and where its weight lands. "Weight" is where the text or code goes. The skills have a 2.5k-token budget each, and `CLAUDE.md` 3k.

| § | What it solves | Evidence (D26) | Weight | Verdict |
|---|---|---|---|---|
| 1 | `/route`: the wrong entries (Epics via `/scope`, drafting in `/scope`, an audit in the build, the full loop on a tiny issue) | 9 runs (research/17 Q5) | A new skill replacing the planned `/draft`; one template line | **Keep** |
| 2 | An amended plan condenses without asking | Most G2 rounds | `build`, `review` | **Keep**, and extend to G1 with X3 |
| 3 | Main-session commits wait for CI and re-hand-off | #46, #67 | `review`, template | **Keep** |
| 4, 7 | `runs.js` places forked subagents; counts a shared call once | #45, #52 | ProdHarnessConfig only | **Keep** |
| 5 | `docs-gate`'s message: acknowledge first | #46 | `docs-gate` | **Drop with X6**, or keep if the gate stays a deny |
| 6 | `build` stops when CI never starts | #52 ($3.32) | `build` | **Keep**, one rule |
| 8 | The builder leaves the UI to `ui-check` | 7 runs | `build` | **Merge into §23** |
| 9 | `/trail`, recording runs | Every run, by hand | ProdHarnessConfig only | **Keep** |
| 10 | Known failures at the repo level | #53 | `check-gate`, `review` | **Drop with X2** |
| 11 | The scripting runtime; Auto-fix on PRs `/close` opens | Most runs; #48 | Template, `close` | **Keep** |
| 12 | The one-command Epic close | #44, #63, IM #136, BBH #166, IM #173 | `close`, reached by `/route` | **Keep** |
| 13 | Checking outside dependencies before G1 | #66, #63 | `scope` | **Keep**, one rule |
| 14, 16 | G2 quotes proposed wording, and applies it once approved | #66, #67, #63 | `review` | **Merge into one rule** |
| 15 | A rule G1 adds is checked against the red-team skill | #66, #67 | `scope` | **Keep**, one line |
| 17 | The light lane | #68 | One of `/route`'s routes | **Keep inside `/route`**; `/scope` doesn't offer it separately |
| 18 | A labelled Sonnet trial | #68, #69, #63 | Measurement | **Keep**, as a trial after the reinstall |
| 19 | Copilot reviews off | All three repos | Owner settings | **Keep** |
| 20 | `/layout-epic` | 2 layouts | A new skill per project (its description in every session's list) | **Keep**, the owner's proposal; it is small |
| 21 | Small allows an unused-dependency removal | BBH #169 | `scope`, one line | **Keep** |
| 22 | An audit before `/scope` | BBH #176 ($4.62) | One of `/route`'s routes | **Keep** |
| 23 | Screenshots out of context; the builder takes none | #66, #176, #177, #175 | `ui-check`, `build`, `runs.js` | **Keep**, the largest cost lever |
| 24 | A narrow `ui-check` re-check | #177 | `review`, `ui-check` | **Keep** |
| 25 | A `cat` with no input can't hang a session | IM #171, #172 | A small hook check, one template line | **Keep** |
| 26 | G2 fixes go to the builder only when worth it | 13 of 20 runs | `review` | **Keep** |
| 27 | A UI check's scope set at G1 | 15 UI runs | `scope`, `ui-check` | **Keep** |
| 28 | `/close` in a fresh session | IM #141, #172, BBH #177 | `review`, `close` | **Keep** |
| 29 | `/review` in the build's session | IM #168, BBH #71, IM #169 | `build` | **Keep** |
| #8 | `check-gate`'s known-failure gap | The review of #7; no run hit it | `check-gate` | **Drop with X2** |

**Net:** of 29 sections and #8, three go:
- **§10 and #8,** with X2;
- **§5,** with X6, if the owner takes it.

Two pairs merge: §8 into §23, and §14 with §16. §17 and §22 live inside `/route`.

The version adds:
- one skill to the projects, `/route`, which replaces the planned `/draft`;
- one skill to the projects, `/layout-epic`;
- a hook check in an existing hook (§25);
- skill and template text.

It removes:
- one hook (X1), a plan rule (X4), a skill branch (X5) and the hard budget (X3);
- if X6 is taken, most of a gate.

## 5. Size

D26's installed sizes:
- **Skills:** `scope` 6.4k characters, `build` 7.6k, `review` 7.1k, `close` 2.5k, against a 10k budget each.
- **`CLAUDE.md` template:** 4.5k, against 12k; the projects' own `CLAUDE.md` files run to 7.8–9.6k.

#9 adds text to all four skills and to the template. With X3–X6 and the merges, `scope` and `review` lose their T7 line, `reviewOnReady` branch and known-failure step. That leaves room under the budgets. If a skill still binds, the order to cut is the turns-and-stalls wording before the cost sections' (R15-5). Each section should land as one rule, not a paragraph.

## 6. Triage

For the owner, before #9 and #8 are built:
- **X1 to X5:** drop, or keep.
- **X6:** demote `docs-gate` to a report, or keep it a deny.
- **The merges:** §8 into §23, §14 with §16, and §17 and §22 inside `/route`.
- **Outside the harness:**
  - a labelled trial of the terminal instead of the desktop app, to measure the app's 9.6%;
  - D6's re-test (R15-7) for the fixed context.
