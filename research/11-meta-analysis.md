# R11: Meta-analysis of every priced run

Date: 2026-10-28. Data: [scripts/runs.json](scripts/runs.json), 30 runs. Script: [scripts/runs.js](scripts/runs.js). It re-prices every run from its transcripts with one method, and every total matches its first record within a cent (#68 once its epic audit is set apart). The transcripts stay out of git.

**How to read the numbers:**
- All costs are list-price equivalents; the owner is on a subscription.
- **Phases** come from the transcripts' own markers:
  - **Plan** is Block A plus the surveyor.
  - **Build** is Block B's main session plus the builder.
  - **Review** is Block C's main session plus the red-team, with fix rounds.
  - **Close** is `/close`.
- **UI check** counts the browser calls and the short gaps between them, in whichever session made them. It is narrower than the time windows research/10 used ($2.73 against $2.91 for #149's).
- **Configurations:**
  - **Baseline:** before the harness, one long session per issue (research/02).
  - **V1:** the pilot with Block B on Opus in the main session (research/05).
  - **V3:** Block B forked on a Sonnet builder (research/08).
  - **D22:** the Small tier's first runs (research/09).
  - **D24:** this batch, with D23's surveyor rule and the five trials (research/10).
- **Small samples.** 2–5 runs per group, on two repos, with issues of different sizes. Medians say which way things move; they don't measure effects.

## 1. The runs

The harness runs, from `node research/scripts/runs.js`. The 15 baseline runs are summarized in the second table.

| Run | Config | Tier | Diff | Plan | Build | UI check | Review | Close | Total | Main peak | Turns |
|---|---|---|---|---|---|---|---|---|---|---|---|
| BBH #96 | V1 | Standard | 29f +1327 −72 | $2.40 | $9.38 | — | $8.65 | $0.43 | **$20.86** | 303k | 10 |
| BBH #97 | V1 | Standard | 33f +1041 −157 | $1.88 | $8.04 | — | $3.76 | $0.52 | **$14.20** | 278k | 9 |
| IM #72 | V3 | Standard | 15f +5799 −559 (mostly a lock file) | $1.36 | $1.61 | — | $2.00 | $0.20 | **$5.17** | 114k | 8 |
| IM #73 | V3 | Standard | 5f +746 −0 | $1.61 | $1.25 | — | $1.58 | $0.36 | **$4.80** | 123k | 7 |
| BBH #134 | D22 | Small | 1f +2 −0 | $1.05 | $0.71 | — | $0.17 | $0.30 | **$2.23** | 125k | 4 |
| IM #68 | D22 | Small | 3f +7 −7 | $1.02 | $0.40 | — | $1.22 | $0.27 | **$2.92** | 134k | 5 |
| IM #120 | D22 | Small | 7f +52 −22 | $1.65 | $0.61 | — | $1.50 | $0.18 | **$3.93** | 152k | 6 |
| BBH #133 | D24 | Standard | 70f +294 −184 | $1.69 | $1.99 | — | $2.09 | $0.26 | **$6.03** | 121k | 7 |
| BBH #150 | D24 | Small | 20f +34 −23 | $1.15 | $0.84 | — | $1.67 | $0.18 | **$3.83** | 150k | 6 |
| IM #69 | D24 | Standard | 15f +259 −41 | $1.68 | $1.27 | — | $2.16 | $0.25 | **$5.36** | 129k | 7 |
| IM #137 | D24 | Standard | 19f +243 −83 | $1.66 | $1.81 | $0.51 | $2.00 | $0.28 | **$6.26** | 124k | 7 |
| IM #138 | D24 | Standard | 15f +199 −61 | $1.84 | $1.61 | $0.77 | $1.90 | $0.31 | **$6.43** | 129k | 7 |
| IM #139 | D24 | Standard | 15f +146 −36 | $1.30 | $1.57 | $0.68 | $2.14 | $0.29 | **$5.99** | 125k | 9 |
| IM #149 | D24 | Small | 6f +75 −32 | $1.27 | $0.98 | $2.73 | $2.46 | $0.36 | **$7.80** | **221k** | 8 |
| IM #151 | D24 | Small | 3f +3 −2 | $1.20 | $0.85 | $1.42 | $1.14 | $0.27 | **$4.88** | 189k | 5 |

| Config | Tier | Runs | Median cost | Plan | Build | Review | Main peak | Turns |
|---|---|---|---|---|---|---|---|---|
| Baseline (code) | — | 10 | $9.99 | — | — | — | 291k | 11 |
| Baseline (docs) | — | 5 | $10.01 | — | — | — | 289k | 19 |
| V1 | Standard | 2 | $17.53 | $2.14 | $8.71 | $6.21 | 290k | 9.5 |
| V3 | Standard | 2 | $4.98 | $1.48 | $1.43 | $1.79 | 118k | 7.5 |
| D22 | Small | 3 | $2.92 | $1.05 | $0.61 | $1.22 | 134k | 5 |
| D24 | Standard | 5 | $6.03 | $1.68 | $1.61 | $2.09 | 125k | 7 |
| D24 | Small | 3 | $4.88 | $1.20 | $0.85 | $1.67 | 189k | 6 |

## 2. Did the harness pay off?

**Yes, on Standard: 40% cheaper per issue, with less than half the context and fewer owner turns.**
- **Cost:** D24 Standard's median is $6.03, against the code baseline's $9.99. Every D24 Standard run was under §8.4's $7.49 (highest $6.43).
- **Context:** the main sessions peak at 121–129k, against a baseline median of 291k. No Standard block went over 200k; the builder's highest was 172k. V1 made 148 calls above 200k across two issues; the D24 Standard runs made none.
- **Owner turns:** a median of 7, against 11. That meets D20's desktop floor of 7, though #139 needed 9.
- **Context before the first prompt:** 73–80k in every session of every harness run, under the 85k target.

**What did it: the forked Sonnet build, then the gates.**
- Block B fell from $8.04–9.38 on Opus in the main session (V1) to $1.25–1.99 forked on Sonnet (V3 and D24). That one change is most of the saving between V1 and V3.
- The gates keep each block short. A Standard block now starts at about 75k and ends near 125k; the baseline ran one session to 250–410k.

**D24 Standard costs about $1 more than V3** ($6.03 against $4.98). It's not one cause:
- 3 of the 5 runs had a UI check in the builder ($0.51–0.77). Without them the median is $5.66.
- The D24 issues changed server, client and docs together, where #72 and #73 were tests only.
- The trials themselves cost little: T4's red-team first runs average $0.72, against #73's $0.71.

**Small: cheaper when nothing heavy follows G1, and expensive when something does.**
- D22's three docs-only runs had a median of $2.92, under the $3.08 target. D24's three code runs had a median of $4.88, missing it.
- Without its UI checks, D24 Small would cost $3.83, $5.07 and $3.46; the target is still missed. Small code issues cost more than Small docs issues.

### Against §8.4 and D20

| Target | Standard (D24, 5 runs) | Small (D22 and D24, 6 runs) |
|---|---|---|
| Cost | Median $6.03, every run ≤ $7.49: **met** | D22 median $2.92: met. D24 median $4.88: **missed** against $3.08 |
| Peak context ≤ 200k | 121–129k main, builder ≤ 172k: **met** | 5 of 6 met; **#149 missed (221k)** |
| Start ≤ 85k | 73–80k: **met** | 76–77k: **met** |
| Owner turns (D20: ≤ 7 Standard, ≤ 6 Small) | 4 of 5 at 7; #139 at 9 | 5 of 6 within 6; #149 at 8 |
| Quality | 0 blocking findings left at merge; no escapes reported yet | Same |

**Escapes:** none reported as of 2026-10-28. The tracking windows close between 2026-11-19 (#96) and 2026-11-25 (#149, #151). §8.4's own caveat holds: zero escapes in a few issues is weak evidence.

## 3. Where the money goes

**In a D24 Standard run, review is the largest phase:** median shares are review 35%, plan 28%, build 27%, close 5%, plus the UI check when there is one.

| Phase | D24 Standard | What drives it |
|---|---|---|
| Plan | $1.30–1.84 | The Opus main session ($1.30–1.62), plus a surveyor ($0.22–0.27) on 4 of 5. The G1 decisions and any experiments ($1.84 on #138, which ran two time-zone scripts) |
| Build | $1.27–1.99 | The main session around the fork ($0.45–0.49, mostly the session's first cache write) and the Sonnet builder ($0.82–1.88). A UI check is 28–41% of the builder |
| Review | $1.90–2.16 | A fresh Opus session ($0.91–1.33) and the Opus red-team ($0.82–1.18 with re-reviews). 4 of 5 runs had a fix round |
| Close | $0.25–0.31 | `close.cjs` and the memory notes |

**By model:** Opus is 66–80% of a D24 Standard run and 75–92% of a Small one. Sonnet does the volume (builder, surveyor) and costs least per call. That split is D12's design, and the data supports it: the D16 replay found no quality cost from a Sonnet build.

**By context:** cost tracks calls × context, as the baseline showed. The harness controls it by ending blocks at gates. Where a session runs long after G1 (Small), every call reads 120–220k on Opus. That is where #149's money went.

## 4. Tiers

**Small saves about $1.50–2.00 against Standard, but only on its first half.**
- Planning is about $0.40 cheaper (no surveyor on 5 of 6 Small runs: $1.02–1.27, against $1.66–1.84).
- The build's main session costs $0.10–0.48, with no fresh session's first cache write.
- Review costs about the same. Small's G2 runs at 130–200k context, but it skips Standard's fresh-session start ($0.20 or so) and re-reading the plan. Small's main-session review was $0.83–1.46, against Standard's $0.91–1.33.

**Small loses when heavy work follows G1.** Each call after G1 runs on Opus at the session's highest context. On #149 and #151 the UI check ran there ($2.73 and $1.42); on Standard the builder ran it on Sonnet for $0.51–0.77. With the check in the builder, #149 would have cost about $5.80 and #151 about $4.00.

**The criteria don't predict cost.** `scope`'s Small test (one sub-phase; no schema, migration, auth, security or dependency change; no public interface change) is checked once, before the G1 decisions.
- #149 met it, then took 5 decisions in two rounds and a 5-step browser check, and became the dearest run under the harness.
- #139 failed it, and `scope` said so before planning.
- Neither a UI check nor the number of G1 decisions counts against Small today.

## 5. Subagents

**Builder (Sonnet, forked): the harness's biggest win.** Build cost fell by about 80% from V1, and its context stays off the main session. On 3 runs it also drove the browser well, against throwaway data. Its peaks reached 158–172k with a UI check; that is the block closest to 200k.

**Surveyor (D23): no visible saving at this size.**
- With a surveyor (#133, #69, #137, #138), planning cost $1.66–1.84, and the main session alone $1.39–1.62.
- Without one, on a same-sized issue (#139: 15 files, +146 / −36), planning cost $1.30, main session included. Its plan was complete: G2 found 2 doc lines and a trim the builder had already raised.
- After a survey, the main session still read files itself (#137: 3 more commands).
- This is one comparable run. It suggests the surveyor adds about $0.25 and doesn't reduce the main session's reading on issues that name their files, as `scope`'s step 3 already allows. It doesn't show the surveyor is useless on unfamiliar areas.

**Red-team (Opus): where quality comes from, at a stable price.**
- First runs: $0.61–1.18 on Standard (median $0.78), $0.28–0.75 on Small.
- A fresh narrow re-review costs $0.11–0.24. Resuming the first red-team with SendMessage cost $0.29 (#150), because its cache had expired.
- Across 8 re-reviews since D22, one found something new: #138's stale code comment, priority 4, left as it was.

## 6. Trials (D24)

| Trial | Runs | Result | Verdict (owner's choice, 2026-10-28) |
|---|---|---|---|
| **T4**, the error-handling lens | 6 InvoiceMe issues | 5 fix-worthy findings, all fixed (scores 9, 7, 6, 6, 5); 1 low declined; 1 run reported zero, naming the 3 paths it checked. Red-team first runs average $0.72, 1% above #73's $0.71. Caveat: on #69 and #138 the brief pointed at the issue | **Keep.** Both halves of the rule are met |
| **T1**, the smallest complete change | 8 issues | Schema epic planning median $1.67, $0.18 above the $1.49 baseline (limit $0.20). No red-team finding traced to something T1 cut, in 8 runs; plans name their rejected approaches | **Keep, provisionally.** Judged again after #140 and #141. Planning cost tracks the surveyor and the G1 decisions more than T1 |
| **T6**, the UI check | 5 InvoiceMe issues | 0 owner UI adjustment rounds after G2 (baseline #96: 2). Two ways of running it: builder on Sonnet with throwaway data ($0.51–0.77), or the Opus main session on the owner's data ($1.42–2.73). The pane doesn't draw the PDF or the table | **Carry on** to the UI epic, as the rule says. Fix how it runs (§8) |
| **T7**, `frontend-design` | 0 | Not used. Skipped with a reason on #137 and #139; no mention at all on #138, #149 and #151 | **Carry on**, but it can't be judged while it is skipped silently |
| **T5**, `security-review` | 0 | No issue touched auth | **Carry on** to the auth epic |

## 7. Quality

| | Standard D24 | Small D24 | Earlier harness runs |
|---|---|---|---|
| Fix-worthy findings fixed at G2 | 0–3 per run (8 in 5 runs) | 0–3 (5 in 3 runs) | 0–3 (#96 2, #72 3, #68 1, #120 1) |
| Blocking at merge | 0 | 0 | 0 (#97's blocking finding was fixed) |
| Fix rounds | 4 of 5 | 2 of 3 | — |
| Pre-existing bugs found and sent on | #144, #145 (from #69); #149 (from #139) | #151 (from #149); backlog #153 (from #151) | — |

**Most G2 fixes are docs.** Of the 13 fixes since D24, 8 were doc lines that the change had made untrue (a wrong issue number, a missing caveat, a stale header). The stale-docs script can't see these because they name no path. In practice the red-team is the doc checker, and it catches them.

**The red-team finds real bugs in old code.** 6 follow-up issues came from adjacent findings, and the owner started a backlog (#153) for them. That's work the review creates, and it's worth having.

**Reviewers outside the harness:** BabyBuddyHelper's CI reviewer (`reviewOnReady`) commented on none of its 3 runs (#134, #133, #150). Its cost isn't in the transcripts. InvoiceMe has none.

## 8. Process defects

| Defect | Seen | Cost | Cause |
|---|---|---|---|
| **The UI check runs in the Opus main session on Small** | 2 of 2 Small UI runs (#149, #151) | $1.42 and $2.73, against $0.51–0.77 in the builder. #149 passed 200k | `scope`'s Small plans routed it there; the builder said it had "no app tools". CLAUDE.md's "the fork can't reach the app's tools" means the PR tools |
| **The check wrote to the owner's dev data** | 1 (#151); #149 used it read-only | An incomplete undo: a customer's phone was re-saved in the new form | `scope`'s rules don't forbid it; `build`'s do. The owner approved the plan at G1 |
| **Tier slip:** the fork ends with Standard's line on a Small run | 3 of 3 Small runs (#150, #149 in full; #151 half) | 1 owner turn on 2 runs | `build` step 6 leaves the tier to the fork's reading |
| **"continue <n>" doesn't start `build` at once** | 5 of 5 Standard runs | $0.05–0.12 each; on #139, 1 owner turn and $0.28 | After `/clear` the session knows only the number; on #139 it waited for a go |
| **T7 skipped without a reason** | 3 of 5 UI runs | The trial can't be judged | Nothing requires the plan to say |
| **The plan names `UIAutomationClient` for a web app** | 1 (#139) | A recorded deviation | `scope`'s T6 wording fits only BabyBuddyHelper |
| **The tier isn't revisited after G1** | 1 (#149) | The run that cost $7.80 | `scope` checks the tier once, at step 2 |
| **A G2 question asked twice** | 1 (#139) | 1 owner turn | The owner's reply answered the fixes only |

None of these is a design failure. Each is a line of wording that the model read one way, or a check made once where it needs twice.

## 9. Candidate changes, ranked

Estimated savings use the data above. "Evidence" is how many runs show the problem.

| # | Change | Saves | Evidence | Size |
|---|---|---|---|---|
| C1 | **The builder runs the UI check on both tiers, against throwaway data.** CLAUDE.md says "the app's PR tools". `scope`'s UI rule: the builder runs it, never on the owner's data, the browser pane for a web app and `UIAutomationClient` for a desktop app | $0.90–2.00 per Small UI run; no more writes to real data; keeps Small under 200k | Strong: 5 UI runs, 2 each way | Small: 3 lines, 1 test |
| C2 | **Tier hand-back:** `build` ends with the plan's tier line; on Small the main session runs `review` whatever the reply says | 1 owner turn on 2 of 3 Small runs | Strong: 3 of 3 | Small: 2 lines, 1 test |
| C3 | **"continue <n>" invokes `build` at once** (a CLAUDE.md line) | $0.05–0.12 per Standard; 1 turn on #139 | Strong: 5 of 5 | Tiny |
| C4 | **T7 named on every UI sub-phase,** required by the plan check when a sub-phase lists a UI file | Makes T7 judgeable | Strong: 3 of 5 silent | Small: `handoff-check` and a test |
| C5 | **Tier check after G1:** `scope` checks the tier again when the decisions add a sub-phase, a fix, or a UI check | #149's kind of overrun; less with C1 | Medium: 1 run | Small |
| C6 | **Surveyor off by default when the issue names its files;** kept for unfamiliar areas | About $0.25–0.40 per Standard | Weak: 1 comparable run | Tiny, but it changes D23 |
| C7 | **No re-review for a doc-only fix round,** unless the owner asks | About $0.15 per such run | Medium: 1 of 8 re-reviews found anything, and that was minor | Tiny, but it loosens the "reviewed SHA = head" rule |
| C8 | **G2 asks its open decisions as numbered questions,** so one reply answers all | 1 turn on #139 | Weak: 1 run | Tiny |
| C9 | **InvoiceMe's `ux-design`:** record the browser-check method and its limits | Fewer re-discoveries | Medium | Repo change, at rollout |

**Considered and not recommended:**
- **The red-team on Sonnet.** It is a third of review's cost, but nothing here tests it, and the review is where the quality comes from. It would need a replay, as D16 did for the builder.
- **Dropping the Small tier.** It still saves $1.50–2.00 when nothing heavy follows G1. C1 removes the main case where it doesn't.
- **Compacting the Small session before G2.** C1 removes most of the long tail's cost, and a compact would add an owner turn.

## 10. Triage (owner's decisions, 2026-10-28)

The owner accepted every recommendation as it stood.

| # | Change or item | Decision | Where |
|---|---|---|---|
| C1 | The builder runs the UI check on both tiers. CLAUDE.md says "the app's PR tools". `scope`'s UI rule: the builder runs it; throwaway data where the project can make it, otherwise read-only, never a write to the owner's data; the browser pane for a web app, `UIAutomationClient` for a desktop app | **Do** | Harness pass (D25) |
| C2 | Tier hand-back: `build` ends with the plan's tier line; on Small the main session runs `review` whatever the reply says | **Do** | Harness pass |
| C3 | "continue <n>" invokes `build` at once | **Do** | Harness pass |
| C4 | Every UI sub-phase says "`frontend-design`: used for …" or "not needed, because …", and the plan check requires it | **Do** | Harness pass |
| C5 | `scope` checks the tier again after G1 when the decisions add a sub-phase, a fix or a UI check, or number more than 3; it recommends, the owner decides | **Do** | Harness pass |
| C6 | Surveyor off by default when the issue names its files | **Defer.** Record which runs went without it; judge after 3 more same-sized Standard issues | Follow-up |
| C7 | No re-review for a doc-only fix round | **Not done.** The reviewed SHA stays the merged SHA | — |
| C8 | G2 asks its open decisions as numbered questions | **Do** | Harness pass |
| C9 | InvoiceMe's `ux-design` records the browser-check method and its limits | **Do** | InvoiceMe's rollout PR |
| C10 | Docs-gate noise (F-IM-1): folder mentions flag docs that need an ack | **Not done for now.** Low cost; tuning risks hiding real staleness | — |
| C11 | BabyBuddyHelper's `reviewOnReady`: no comments in 3 runs | **Keep.** Look again after the UI epic | Follow-up |
| H1 | Stale entries in OPTIMIZATION_PLAN §10 "Next" (D21 shipped in `6be4510`; D19's cost check met at a $6.03 median; ProdHarnessConfig#1 closed) and §11 (InvoiceMe's test suite came with Phase 0) | **Do** | Harness pass (docs) |
| H2 | The 12k plan cap (research/08 #8) | **Keep watching.** Not hit since #73 | — |
| H3 | ProdHarnessConfig#3, the public README and "Get Started" | **Defer** until after the rollout, as the issue says | Follow-up |
| H4 | ProdHarnessConfig#2, third-party skills | **Keep open** until the trials end | — |

## 11. Open after this analysis

- **T1:** judge again after #140 and #141.
- **Escapes:** check on 2026-11-25, when the last window closes.
- **T5, T6, T7:** wait for the auth and UI epics.
- **The surveyor (C6):** judge after 3 more same-sized Standard issues.
- **`reviewOnReady` (C11):** look again after the UI epic.
