# R16: Meta-analysis of D26

Date: 2026-11-23. Data: [scripts/runs.json](scripts/runs.json), 83 runs, 34 of them on D26. Script: [scripts/runs.js](scripts/runs.js). The runs and their findings are in [research/14](14-d26-validation.md); the candidates they raised are sections of ProdHarnessConfig#9. The transcripts stay out of git.

**This first iteration covers four things, as the owner set them:**
1. the research data;
2. comparison with prior versions;
3. what has been pushing the price of an issue up, and what would bring it down;
4. the improvement candidates.

research/14's five questions for the meta-analysis are answered in §9: the first here from the data, the other four (an external harness, thinking level, structured output, `/route`) in the next iteration.

**How to read the numbers:** as in [research/13](13-d25-meta-analysis.md).
- Costs are list-price equivalents, re-priced from the transcripts by one script at fixed prices.
- Phases come from the transcripts' markers.
- The samples are small, so medians show direction, not effect size.

Two things are new:
- **D26 is the first version measured in all three projects:** ThisIsMatheusCastro 16 runs, InvoiceMe 9, BabyBuddyHelper 9. D25 was 16 of 18 on ThisIsMatheusCastro.
- **Some figures below don't come from `runs.js`'s table.** These are the split by token class, first builds against amend builds, screenshots read and gaps between calls. They come from a script over the same transcripts and the same prices, which isn't committed. Where a figure comes from it, the text says "by transcript".

## 1. The runs

The D26 runs, from `node Evidence/research/scripts/runs.js`:
- **Build** includes every builder, the amends too.
- **UI check** is `ui-check` plus any browser-pane calls.
- **Other** is drafting sessions and web-fetch subagents.

| Run | Tier | Diff | Plan | Build | UI check | Review | Close | Other | Total | Main peak | Turns |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TIMC #45 | Standard | 28f +827 −24 | $2.43 | $4.76 | $1.33 | $3.32 | $0.22 | $2.32 | **$14.30** | 162k | 23 |
| TIMC #46 | Standard | 14f +353 −49 | $2.18 | $2.63 | $2.23 | $3.29 | $0.28 | — | **$10.61** | 157k | 11 |
| TIMC #47 | Standard | 16f +168 −34 | $3.31 | $1.65 | $1.16 | $2.04 | $0.32 | — | **$8.48** | 162k | 10 |
| TIMC #52 | Standard | 23f +283 −82 | $2.26 | $5.22 | $2.16 | $3.36 | $0.39 | $0.92 | **$14.31** | 153k | 16 |
| TIMC #48 | Standard | 21f +359 −87 | $2.12 | $1.63 | $0.65 | $2.41 | $0.45 | $0.01 | **$7.26** | 150k | 9 |
| TIMC #64 | Standard | 11f +76 −46 | $1.64 | $1.08 | — | $1.88 | $0.31 | — | **$4.92** | 129k | 7 |
| TIMC #65 | Standard | 18f +1169 −14 | $1.37 | $1.40 | — | $2.05 | $0.28 | $0.06 | **$5.16** | 123k | 9 |
| TIMC #66 | Standard | 50f +2107 −39 | $2.34 | $8.14 | $2.23 | $5.81 | $0.48 | $1.22 | **$20.21** | 184k | 22 |
| TIMC #67 | Standard | 34f +1140 −151 | $2.55 | $4.24 | $1.09 | $3.38 | $0.34 | — | **$11.60** | 151k | 14 |
| TIMC #69 | Standard | 13f +423 −13 | $0.88 | $1.50 | $0.60 | $1.96 | $0.15 | $0.01 | **$5.09** | 157k | 7 |
| IM #141 | Standard | 26f +1225 −157 | $2.52 | $2.41 | $0.77 | $4.29 | $1.14 | — | **$11.14** | 154k | 8 |
| IM #153 | Standard | 4f +40 −12 | $1.70 | $1.10 | $1.86 | $1.82 | $0.26 | — | **$6.74** | 131k | 8 |
| IM #168 | Standard | 6f +145 −96 | $1.50 | $1.33 | $1.72 | $2.47 | $0.31 | — | **$7.33** | 152k | 8 |
| IM #171 | Standard | 25f +744 −52 | $1.95 | $2.52 | — | $3.06 | $0.33 | — | **$7.86** | 148k | 10 |
| IM #172 | Standard | 23f +833 −25 | $2.05 | $3.28 | $1.09 | $3.57 | $1.07 | — | **$11.06** | 150k | 10 |
| BBH #76 | Standard | 16f +753 −37 | $2.07 | $3.05 | — | $3.12 | $0.43 | — | **$8.67** | 140k | 7 |
| BBH #71 | Standard | 5f +33 −11 | $1.45 | $1.05 | — | $1.59 | $0.23 | — | **$4.33** | 128k | 8 |
| BBH #175 | Standard | 22f +228 −88 | $2.28 | $3.76 | $3.35 | $4.93 | $0.25 | — | **$14.57** | 161k | 8 |
| BBH #176 | Standard | 19f +530 −341 | $1.74 | $12.40 | $3.16 | $3.36 | $0.29 | — | **$20.96** | 137k | 12 |
| BBH #177 | Standard | 29f +642 −153 | $2.26 | $6.35 | $7.64 | $7.95 | $0.35 | — | **$24.54** | 189k | 9 |
| IM #169 | Standard (docs) | 3f +52 −12 | $1.38 | $0.76 | $0.89 | $1.63 | $0.32 | $0.06 | **$5.03** | 158k | 8 |
| TIMC #53 | Small (code) | 6f +196 −55 | $2.95 | $1.54 | $0.74 | $1.80 | $0.41 | — | **$7.45** | **238k** | 8 |
| TIMC #54 | Small (code) | 9f +31 −7 | $1.13 | $0.57 | $0.42 | $1.10 | $0.24 | — | **$3.46** | 148k | 5 |
| TIMC #56 | Small (code) | 2f +13 −12 | $1.22 | $0.46 | — | $1.29 | $0.27 | — | **$3.24** | 153k | 5 |
| BBH #169 | Small (code) | 3f +5 −5 | $1.34 | $0.76 | $0.35 | $0.97 | $0.24 | — | **$3.66** | 158k | 6 |
| BBH #192 | Small (code) | 3f +62 −30 | $1.09 | $0.79 | $1.18 | $2.04 | $0.12 | — | **$5.23** | 153k | 5 |
| TIMC #68 | Small (docs) | 4f +7 −10 | $0.75 | $0.43 | — | $0.62 | $0.18 | — | **$1.98** | 168k | 5 |
| IM #170 | Small (docs) | 4f +45 −6 | $1.74 | $0.81 | — | $2.27 | $0.34 | — | **$5.16** | 187k | 7 |
| TIMC #44 | Small (docs), Epic close | 7f +37 −20 | $1.27 | $0.65 | — | $2.07 | $2.34 | — | **$6.32** | 173k | 5 |
| TIMC #63 | Small (docs), Epic close | 7f +21 −15 | $1.84 | $0.89 | $0.91 | $5.41 | — | — | **$9.05** | **234k** | 7 |
| IM #136 | Small (docs), Epic close | 9f +33 −21 | $1.59 | $1.18 | — | $2.12 | $3.27 | — | **$8.16** | 179k | 9 |
| BBH #166 | Small (docs), Epic close | 6f +18 −9 | $0.90 | $0.72 | — | $1.38 | $1.42 | — | **$4.42** | 153k | 6 |
| IM #173 | Small (docs), Epic close | 18f +68 −57 | $0.98 | $1.17 | — | $2.31 | $3.76 | — | **$8.22** | 173k | 6 |
| BBH #191 | Parked at G1 | — | $1.23 | — | — | — | $0.09 | — | **$1.32** | 106k | 4 |

Some rows need a note:
- **#52** is $14.31 here and $14.12 in research/14. Its interrupted session went on in two transcripts that share a call, which `runs.js` counts twice (R14-7, #9 §7).
- **#63's and #136's** close and audit sit under Review, because the owner typed the close in a message, not as the command. research/14 places them by time.
- **#63** leaves out the Epic 6 layout after it ($0.43).

## 2. Compared with prior versions

| Config | Tier | Runs | Median cost | Plan | Build | Review | Main peak | Turns | Median diff (+) |
|---|---|---|---|---|---|---|---|---|---|
| Baseline (code) | — | 10 | $9.99 | — | — | — | 291k | 11 | |
| D24 | Standard | 5 | $6.03 | $1.68 | $1.61 | $2.09 | 125k | 7 | 243 |
| D25 | Standard | 10 | $8.32 | $2.21 | $2.14 | $3.12 | 145k | 9 | 795 |
| **D26** | **Standard (code)** | **20** | **$9.64** | $2.09 | $2.57 | $3.20 | 152k | 9 | 477 |
| D24 | Small (code) | 3 | $4.88 | $1.20 | $0.85 | $1.67 | 189k | 6 | 34 |
| D25 | Small (code) | 3 | $3.99 | $1.33 | $0.56 | $1.55 | 154k | 7 | 187 |
| **D26** | **Small (code)** | **5** | **$3.66** | $1.22 | $0.76 | $1.29 | 153k | 5 | 31 |
| D22 | Small (docs) | 3 | $2.92 | $1.05 | $0.61 | $1.22 | 134k | 5 | |
| D25 | Small (docs) | 5 | $5.37 | $1.34 | $0.50 | $1.97 | 164k | 7 | 29 |
| **D26** | **Small (docs)** | **7** | **$6.32** | $1.27 | $0.81 | $2.12 | 173k | 6 | 33 |

**What the table says:**
- **Standard went up again.** D26 Standard is $9.64, against D25's $8.32 and D24's $6.03, on issues with half D25's added lines (+477 against +795). It is now only 4% below the code baseline ($9.99), though it still runs at half the baseline's context (152k against 291k) and with two fewer owner turns (9 against 11).
- **Small code got cheaper again:** $3.66, against $3.99 and $4.88.
- **Small docs went up:** $6.32. Five of D26's seven Small docs runs were Epic closes, each with its knowledge audit ($1.58–2.92). The two that weren't cost $1.98 and $5.16.

**The prior versions, for reference** ([research/13](13-d25-meta-analysis.md)):
- D24 cut the baseline's cost by about 40%, mostly by running the build forked on Sonnet. The builder cost a median $1.11 on D24 and $1.02 on D25, on issues about three times the size.
- D25 cost more than D24 because the review session made its G2 fixes on Opus at high context (+$0.78 per run), and planning took more rounds (+$0.51).
- D26 was built to fix both (E1, E4).

**By project, Standard (code):**

| Project | D24 | D25 | D26 | D26 without a UI check |
|---|---|---|---|---|
| ThisIsMatheusCastro | — | $8.30 (9) | $9.54 (10) | $5.04 (2) |
| InvoiceMe | $6.12 (4) | $10.02 (1) | $7.86 (5) | $7.86 (1) |
| BabyBuddyHelper | $6.03 (1) | — | $14.57 (5) | $6.50 (2) |

On BabyBuddyHelper, D26's Standard median ($14.57) is above that project's own pre-harness baseline ($9.99). It is the only place it is. The cause is §3.2, not the build.

## 3. What has been pushing the price up

D26's Standard median rose $1.32 over D25's. The rise has three sources, in this order: the issues, two of D26's own changes, and work off the planned path. The rates didn't change.

### 3.1 Not the rates or the billing

The figures are list-price equivalents, priced by `runs.js` at fixed rates (fetched 2026-10-21, Haiku added 2026-11-12). A change in what the owner is billed, or in a subscription's limits, can't move them. Within the transcripts, nothing that the rates act on grew either (by transcript, Standard code medians):

| | D24 | D25 | D26 |
|---|---|---|---|
| Share of cache writes at the dearer 1-hour rate | 38% | 42% | 33% |
| A session's first call (its fixed context) | 76k | 72k | 78k |
| Opus's share of the cost | 71% | 77% | 59% |
| Output's share of the cost (thinking included) | 26% | 28% | 26% |

The fixed context a session starts with is flat at 72–79k, so the global overhead (D6, R15-7) didn't grow. Opus's share fell, because more of the work moved to Sonnet subagents. If the owner's actual usage has felt higher, it is the work below, not the price per token. A subscription's own accounting can't be read from the transcripts.

### 3.2 The issues: UI checks cost twice as much

**D26's Standard runs that had a UI check cost a median $11.14 (15 runs). Those without one cost $5.16 (5 runs).** Without the UI runs, D26 Standard is under D24's $6.03 and under the $7.49 target.

D26's issues leaned to UI more than earlier versions did:
- ThisIsMatheusCastro's sections, forms and Calvo.
- BabyBuddyHelper's mobile polish: #175's known fixes, #176's phone-width audit and #177's accessibility pass, each checked on Android and Windows, at several widths and font scales.

The size of the change isn't what drives cost. #65 added 1,169 lines for $5.16, #177 added 642 for $24.54.

The UI runs cost more in three ways:
- **`ui-check` itself:** 13% of D26 Standard spend, $1.39 a run on average. BabyBuddyHelper's median was $3.16. Two platforms and several font scales multiply the views, and each view was a screenshot read into the agent's context.
  - **By transcript:** D26's subagents read 325 screenshots, and 244 subagent calls ran over 200k of context, all in #66, #176 and #177.
  - **D25,** with the UI check in the builder, read 3.
- **Rework after seeing the product.** The owner's changes after the build came on UI issues: #45's layout, #46's tweak, #66's rework, #67's headings, #177's second G2 round.
- **More G2 rounds.** `ui-check`'s re-checks found regressions (#177's Chat page) and leftover gaps, and each round is another builder, red-team and `ui-check` pass.

The issue mix isn't the harness's doing. How the harness checks a UI is, and that is where most of the extra money went.

### 3.3 Two of D26's own changes moved cost instead of cutting it

| Part (median, Standard code) | D24 | D25 | D26 | Change from D25 |
|---|---|---|---|---|
| Plan: the main session | $1.43 | $1.94 | $1.83 | — |
| Surveyor | $0.25 | $0.22 | $0.24 | — |
| Build: the main session | $0.47 | $0.42 | $0.35 | — |
| The first builder | $1.78 | $1.37 (with the UI check) | $1.60 | +$0.23 |
| Later builders (`build amend`) | — | — | $0.37 (mean $1.00, 13 of 20 runs) | **new** |
| `ui-check` | — | (in the builder) | $0.80 (mean $1.39, 15 of 20 runs) | **new** |
| Review: the main session | $1.07 | $1.85 | $1.80 | — |
| Review: the red-team | $0.93 | $1.31 | $1.29 | — |
| Close | $0.28 | $0.29 | $0.32 | — |

The medians of the parts don't add up to the median total.

**E1 moved the G2 fixes to the Sonnet builder, but the Opus review session didn't get cheaper.** It cost $1.85 on D25 and $1.80 on D26. On D26 it still:
- drafts each amendment and trims the plan back to budget, often in several calls (#9 §2);
- re-verifies the new handoff;
- briefs the narrow re-review and, on UI runs, a second `ui-check`;
- writes the ready note.

So each G2 round now costs a builder ($0.37 median) on top of a review session that costs what it did.

**E7 moved the UI check out of the builder,** as intended. It made it a full agent run with its own screenshots, and in review it runs again after each fix round. The builder kept looking at the page anyway, on 7 runs (#9 §8).

### 3.4 Off the planned path

Taking out what research/14 marked off the planned path brings the Standard median from $9.64 to $8.69. That covers:
- drafting sessions;
- the owner's changes after the build or after G2;
- stuck CI;
- the stopped and hung commands;
- cache rewrites after gaps of over an hour.

Off-path work was $31.20 of the 20 Standard runs' $219.14, 14%. Its parts:
- **The owner's changes after the build or G2:** #45, #46, #66 ($7.18), #67, #172. These are G1's decisions revisited after seeing the result, mostly on UI.
- **Drafting:** #45, #52 and #66, $0.92–2.32 each, in side sessions (E4).
- **Gaps:** an answer or a close more than an hour later rewrites the whole context to the cache. That cost $4.92 over 7 D26 runs, up to $1.29 on one (by transcript). The close is the clearest case: $0.32 median, but $1.07–1.25 after a gap (#141, #172, #177).
- **Failures:** #52's stuck CI ($3.32), #171's hung `cat` and #172's stopped build.

### 3.5 Output and thinking

Output, billed at five times the input rate, is 25.5% of all D26 spend (by transcript). The transcripts hold the visible text, the tool inputs and summarized thinking. Counting those at 3.5–4 characters a token, they account for 47–54% of the billed output tokens. The rest is most likely thinking that isn't shown in full. With the visible thinking added, thinking is probably 60–70% of output, about 15–17% of an issue's cost. This is an estimate, not a measurement. Whether a lower thinking level would keep the quality is research/14's question 3, for the next iteration.

## 4. Did D26 hold?

**Its behaviour changes mostly held. Its targets held on Small and on Standard without UI, and were missed on Standard with UI.**

| Change | Result over 34 runs |
|---|---|
| E1, G2 fixes and new scope through `build amend` | **Held** for G2. Missed for the owner's tweaks after the build, made in the main session (#46, #67), which left the handoff stale (#9 §3) |
| E2, Auto-fix off | **Held.** Bot and Copilot reviews still woke sessions (#9 §19) |
| E3, an Epic's close: the audit first | **Missed** on ThisIsMatheusCastro #44 and #63, opened with `/scope`. **Held** on InvoiceMe #136, BabyBuddyHelper #166 and InvoiceMe #173, but over three entry points (#9 §12) |
| E4, drafting before `/scope` | **Held** in side sessions (#45, #52, #66) and in a G1 preview (#67). **Missed** on #53 (to 238k); declined by the owner on IM #170 |
| E5, required CI jobs by name | **Held,** except #53's builder |
| E6, the plan covers what G1 adds | **Held,** but twice missed a conflict with the red-team skill's rules (#66, #67; #9 §15) |
| E7, the UI check in `ui-check` | **Held** in review on every UI run. The builder still looked on 7 runs, with screenshots on BBH #176 (#9 §8, §23) |
| E8, fewer questions | **Held** at G2. The tier was asked rather than stated on #53, #56 and BBH #192. E10's rule set BBH #169's tier against the owner's wish (#9 §21) |
| E9, known failures | **Held** within an issue; missed across issues (#53; #9 §10) |
| E11, the stale checkout | **Held,** 34 of 34 |
| C6, the surveyor off when the issue names its files | **Held** |

**Against the targets:**
- **Standard:** cost ≤ $7.49 on 7 of 20 runs; ≤ 7 turns on 3 of 20 (median 9); the main session's peak ≤ 200k on 20 of 20. Subagents went over 200k on #66, #176 and #177.
- **Small:** ≤ 6 turns on 8 of 12; the peak ≤ 200k on 10 of 12. #53 and #63 exceeded it, both from long single sessions.

**Turns** are missed mostly at G1, where two or three dialogs are the norm on Standard, and on the off-path work in §3.4. #64, #69 and BBH #76 met 7.

## 5. What would bring the price down

| Driver (§) | What covers it today | Expected effect |
|---|---|---|
| Screenshots in UI agents' context (3.2) | #9 §23: screenshots stay out of context, the builder takes none | The largest single lever: `ui-check` is 13% of Standard spend, and 244 calls ran over 200k |
| `ui-check` re-running in full after G2 fixes (3.2) | #9 §24: a narrow re-check | #177's re-check ran 119 calls against the code re-review's 11 |
| The builder looking at the UI (3.3) | #9 §8, extended by §23 | Removes a second UI pass on 7 runs |
| An audit run inside the build (3.2) | #9 §22: an audit before `/scope` | #176's audit and stop cost $4.62 |
| G2 fixes costing a builder and an unchanged review session (3.3) | Not covered | **R16-1** below |
| How much a UI check covers, set by nobody (3.2) | Not covered | **R16-2** below |
| Gaps before the close (3.4) | Not covered | **R16-3** below |
| Owner changes after the build (3.4) | #9 §3 keeps them from stalling review; §1 drafts content first | The changes are the owner's; the harness can only make them cheaper and safer |
| Drafting, Epic closes, wrong entries (3.4, §4) | #9 §1, §12, §20, §22, and research/14 Q5 (`/route`) | Turns more than cost |
| Hangs and stops (3.4) | #9 §6 (CI never starts), §25 (a `cat` with no input) | Rare, but each costs a turn and up to an hour |
| Thinking (3.5) | Not covered | research/14 Q3, next iteration |

**New candidates:**

| # | From | Candidate |
|---|---|---|
| R16-1 | §3.3 | **G2 fixes go to the builder only when they're worth a builder.** Fixes to doc and rule text, and code fixes of a few lines in one or two files, stay in the review session, as E1 already allows for typos and one-line doc fixes. Multi-file code fixes and the owner's scope changes go through `build amend`. With #9 §2 (an amended plan condenses without asking), the review session's own share of a round shrinks too. On D26, a G2 round through the builder cost a median $0.37 on top of a review session that didn't get cheaper |
| R16-2 | §3.2 | **A UI check's scope is set at G1.** The plan's UI sub-phase names the pages, platforms, widths and font scales `ui-check` will cover, with a rough count of views. The owner can trim it at G1, as for any other scope. BabyBuddyHelper's UI runs checked up to two platforms × several scales × every page; ThisIsMatheusCastro's checked one browser at two widths |
| R16-3 | §3.4 | **`/close` runs in a fresh session.** It reads the PR, `close.cjs` and the memory, and needs nothing from the session before it. A fresh session starts at about 78k; a close after a gap rewrote 140–180k ($1.07–1.25, against a $0.32 median), and on Small it is the last block of a session already at 170–190k |
| R16-4 | §9, Q1 | **`/review` runs in the build's session on Standard.** Three runs say the fresh session buys nothing (§9). `build`'s last line names `/review <n>` without a `/clear` |

## 6. The improvement candidates

ProdHarnessConfig#9 holds the 25 sections the owner took from the D26 runs (R14-1 to R14-26). Ranked by what the data says they would change:

**Cost, first:**
- §23 screenshots out of context;
- §24 a narrow `ui-check` re-check;
- §8 the builder leaves the UI to `ui-check`;
- §22 an audit before `/scope`;
- §2 an amended plan condenses without asking. It recurs on most G2 rounds and costs Opus calls at 110–160k.

**Turns and stalls:**
- §1 `/draft`, which the owner may widen to `/route` (Q5);
- §3 main-session commits wait for CI;
- §12 the one-command Epic close;
- §25 a `cat` with no input;
- §6 CI that never starts;
- §10 repo-level known failures;
- §19 Copilot off;
- §13 checking outside dependencies before G1;
- §14 and §16, G2's rule wording quoted and applied;
- §15 the red-team skill checked when a rule changes;
- §21 removing an unused dependency on Small;
- §17 a light lane for tiny issues;
- §20 `/layout-epic`.

**Measurement and tooling:**
- §4 and §7 `runs.js` fixes;
- §9 `/trail`;
- §11 the scripting runtime (a missing Python cost a retry on most runs in all three projects);
- §5 `docs-gate`'s message;
- §18 a labelled trial of Sonnet in the main session.

**Size.** Several sections add text to `scope`, `build`, `review` and `close`, and to the CLAUDE.md template, and each has a size budget (`test/config.test.cjs`). If one binds when #9 is built, cut the turns-and-stalls sections' wording before the cost sections' (R15-5).

## 7. Quality

- **Every D26 PR was merged with no blocking finding open.** The red-team's blocking findings were real:
  - #66's honeypot tell;
  - #69's false retention claim;
  - #172's sign-in loop;
  - #67's limit that blocked a retry.
- **`ui-check` found failures the code doesn't show:** IM #168's focus contrast, BBH #175's missing button and #177's Chat regression.
- **One inaccuracy shipped knowingly:** #69's Turnstile sentence. The re-review found it after its one round had been used.
- **Escapes:** the windows run to mid-December, so escapes are judged in the next iteration.

## 8. Targets

The $7.49 and 7-turn Standard targets came from D24's issues, which had no separate UI check. D26 meets the cost target on Standard runs without a UI check ($5.16) and misses it by half again on runs with one ($11.14). Two choices, for the owner:
- Keep one target, and judge §23, §24 and R16-2 by how far they bring UI runs down.
- Or set a second target for Standard runs with a UI check, from the runs after #9 is installed.

## 9. research/14's questions

1. **Does `/review` need a fresh session after the build? No, on this data.** Three runs, IM #168, BBH #71 and IM #169, ran `/review` in the build's session, starting at 80k, 84k and 83k. A fresh session starts at 78–80k. With the build forked, the session that started it stays near its starting size. R16-4 proposes dropping the `/clear`.
2. **An external harness (Hermes, OpenClaw):** next iteration.
3. **A lower thinking level:** next iteration. §3.5 sizes it at roughly 15–17% of cost.
4. **A structured output per phase:** next iteration.
5. **`/route`:** next iteration. It would change #9 §1, §12, §17 and §22 before they're built.

## 10. Triage

**2026-11-23:** the owner took R16-1 to R16-4. They are ProdHarnessConfig#9 §26–§29. The owner then moved to the open questions (Q2–Q5), before the build. The Standard target (§8) is still open.

The owner's decisions, before #9 and #8 are built:
- **R16-1 to R16-4:** take each into #9, or not.
- **§8:** one Standard target, or a second one for UI runs.
- **Order:** whether the next iteration (Q2–Q5) comes before the build, or after the reinstall as D27's first data.
