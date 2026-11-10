# R13: Meta-analysis of D25

Date: 2026-11-10, at the close of ThisIsMatheusCastro's Epic 3. Data: [scripts/runs.json](scripts/runs.json), 49 runs. Script: [scripts/runs.js](scripts/runs.js). The runs and their findings are in [research/12](12-d25-validation.md); this is the analysis that research/11 §12 set up. The transcripts stay out of git.

**How to read the numbers:** as in [research/11](11-meta-analysis.md). Costs are list-price equivalents, phases come from the transcripts' markers, and the samples are small. Two things are new:
- **D25 ran mostly on a new project.** 16 of its 18 runs are on ThisIsMatheusCastro, a new Next.js site whose issues added about three times the lines of D24's (median +795 against +243 on Standard). Several were content the owner co-wrote with `scope`. D24 ran on two older repos.
- **`runs.js` mis-split one run, and now doesn't.** #26 opened with `/close`, and phases only moved forward, so its plan, build and review landed under close, and the Epic audit's red-team under review. ProdHarnessConfig#4 fixed that (E13): `/scope` starts the phases again, and a subagent counts in the phase that launched it. The figures below are from the fixed script; the totals didn't change.

## 1. The runs

The D25 runs, from `node Evidence/research/scripts/runs.js`. #155 ran its plan and build on D24's files and is kept apart.

| Run | Tier | Diff | Plan | Build | UI check | Review | Close | Total | Main peak | Turns |
|---|---|---|---|---|---|---|---|---|---|---|
| BBH #155 (D24/D25) | Standard | 15f +185 −49 | $1.58 | $1.23 | — | $6.60 | $0.46 | **$9.88** | **254k** | 13 |
| IM #140 | Standard | 22f +815 −316 | $2.38 | $2.97 | $1.25 | $3.08 | $0.35 | **$10.02** | 142k | 9 |
| TIMC #6 | Standard | 26f +1064 −138 | $1.95 | $1.09 | $0.04 | $4.50 | $0.39 | **$8.33** | 167k | 11 |
| TIMC #12 | Standard | 18f +775 −29 | $2.24 | $2.14 | $0.36 | $3.18 | $0.15 | **$8.46** | 136k | 7 |
| TIMC #13 | Standard | 25f +4677 −259 | $2.74 | $2.33 | $0.65 | $3.59 | $0.39 | **$9.69** | 149k | 11 |
| TIMC #14 | Standard | 17f +424 −11 | $1.79 | $2.54 | $0.67 | $3.07 | $0.22 | **$8.28** | 135k | 9 |
| TIMC #21 | Standard | 12f +184 −20 | $1.54 | $1.25 | $0.49 | $2.21 | $0.25 | **$5.74** | 128k | 8 |
| TIMC #18 | Standard | 24f +723 −337 | $2.32 | $2.14 | $0.11 | $2.91 | $0.32 | **$8.30** | 167k | 13 |
| TIMC #27 | Standard | 23f +1017 −18 | $1.87 | $1.37 | — | $3.80 | $0.07 | **$7.11** | 144k | 9 |
| TIMC #34 | Standard | 13f +1073 −194 | $4.45 | $2.53 | $0.81 | $1.78 | $0.14 | **$9.71** | **230k** | 13 |
| TIMC #29 | Standard | 13f +105 −97 | $2.18 | $0.99 | — | $3.16 | $0.32 | **$6.65** | 146k | 9 |
| BBH #157 | Small (code) | 4f +7 −4 | $1.41 | $0.66 | — | $1.55 | $0.37 | **$3.99** | 154k | 7 |
| TIMC #9 | Small (code) | 2f +228 −2 | $1.07 | $0.35 | — | $0.82 | $0.20 | **$2.44** | 131k | 7 |
| TIMC #20 | Small (code) | 9f +187 −4 | $1.33 | $0.56 | $0.31 | $2.54 | $0.31 | **$5.06** | 184k | 6 |
| TIMC #11 | Small (docs) | 7f +27 −14 | $1.34 | $0.51 | — | $1.20 | $0.39 | **$3.43** | 148k | 6 |
| TIMC #28 | Small (docs) | 7f +56 −10 | $1.16 | $0.60 | — | $2.35 | $0.16 | **$4.28** | 156k | 6 |
| TIMC #30 | Small (docs) | 3f +182 −13 | $1.86 | $0.46 | — | $3.69 | $0.39 | **$6.40** | **205k** | 8 |
| TIMC #31 | Small (docs) | 2f +29 −8 | $3.10 | $0.43 | — | $1.97 | $0.25 | **$5.75** | 187k | 10 |
| TIMC #26 | Small (docs) | 6f +17 −14 | $1.18 | $0.50 | — | $1.20 | $2.49 | **$5.37** | 164k | 7 |

#26's close is the first, stopped `/close` ($0.46), the Epic audit ($1.85) and the reply after it ($0.20).

| Config | Tier | Runs | Median cost | Plan | Build | Review | Main peak | Turns | Median diff (+) |
|---|---|---|---|---|---|---|---|---|---|
| Baseline (code) | — | 10 | $9.99 | — | — | — | 291k | 11 | |
| D24 | Standard | 5 | $6.03 | $1.68 | $1.61 | $2.09 | 125k | 7 | 243 |
| **D25** | **Standard** | **10** | **$8.32** | $2.21 | $2.14 | $3.12 | 145k | 9 | 795 |
| D24 | Small (code) | 3 | $4.88 | $1.20 | $0.85 | $1.67 | 189k | 6 | 34 |
| **D25** | **Small (code)** | **3** | **$3.99** | $1.33 | $0.56 | $1.55 | 154k | 7 | 187 |
| D22 | Small (docs) | 3 | $2.92 | $1.05 | $0.61 | $1.22 | 134k | 5 | |
| **D25** | **Small (docs)** | **5** | **$5.37** | $1.34 | $0.50 | $1.97 | 164k | 7 | 29 |

## 2. Did D25 hold?

**Its behaviour changes held; its targets didn't.**

| Change | What the runs had to show | Result |
|---|---|---|
| C1 | The UI check in the builder, on throwaway data or read-only | **Held**, 7 of 7 runs where it ran, $0.03–1.25, no write to the owner's data. But it took two builders over 200k (#140 259k, #34 222k) |
| C2 | On Small, `review` starts with no owner turn | **Held**, 8 of 9 |
| C3 | After "continue <n>", `build` first | **Held**, 10 of 10 |
| C4 | Every UI sub-phase names `frontend-design` | **Held** on every UI run since #140 |
| C5 | `scope` raises the tier when G1 adds work | **Not tested.** No G1 added enough work to raise it; the recheck ran the other way on #157 |
| C8 | Numbered decisions, one reply | **Held**, 18 of 19 |
| All | Standard: median ≤ $7.49, ≤ 7 turns. Small: ≤ 6 turns. Peak ≤ 200k | **Missed.** Standard $8.32 and 9 turns; Small 7 turns; 4 of 19 runs had a block over 200k |

**Against the baseline, the harness still pays:** D25 Standard is 17% cheaper per issue than the code baseline ($8.32 against $9.99) on issues that are larger, with half the context (145k against 291k) and two fewer owner turns (9 against 11).

**Against D24, D25 Standard costs $2.29 more per run.** None of D25's changes adds cost; C1 moved the UI check to the cheaper model. The difference is in what the runs did:

| Part (median) | D24 Standard | D25 Standard | Change | Why |
|---|---|---|---|---|
| Plan: the main session | $1.43 | $1.94 | +$0.51 | More G1 rounds (median 2 against 1) and content co-written in `/scope` (#29, #34) |
| Surveyor | $0.25 | $0.22 | — | |
| Build: the main session | $0.47 | $0.42 | — | |
| Build: the builder | $1.11 | $1.02 | — | **Flat on diffs three times larger** |
| UI check | $0.51 | $0.42 | — | Now in the builder on every run |
| Review: the main session | $1.07 (23 calls) | $1.85 (37 calls) | **+$0.78** | G2 fixes made in the Opus review session at 120–200k (#27 $2.09, #29 $1.28, #155 $4.75), CI waits, PR events and stop-hook rounds |
| Review: the red-team | $0.93 (19 calls) | $1.31 (25 calls) | +$0.38 | Larger diffs, and T4's lens on most runs |
| Close | $0.28 | $0.30 | — | |

**Small code met its old cost line; Small docs did not.** D25's three code Smalls cost a median $3.99, against D24's $4.88, because no UI check ran in the main session. The five docs Smalls cost $5.37, against D22's $2.92: they were the owner's own content (WhoAmI, the résumé, `WhoIsMatheus.md`, the stories) and an Epic close with its audit, not D22's doc fixes.

**Turns:** the shortest Standard path is 7 turns with one G1 round. D25 Standard's G1 took a median of 2 rounds (1 to 4), and on this project the second round usually built on the first's answers. The rest of the extra turns are the owner's own changes mid-run (#14's patterns, #18's Neon setup, #34's art drafts) and process defects (§8).

## 3. Where the money goes

In a D25 Standard run, review is 38% of the cost (D24: 35%), plan 27%, build 26%, UI check 5%, close 4%.

**The review session is now the dearest single block.** It is Opus, it starts at about 75k and climbs to 120–200k, and on D25 it did more of the work: 9 of 10 Standard runs made G2 fixes in that session, #6 and #29 needed a second round, and #155 built a whole sub-phase there ($4.75). Every call in it reads the session's full context on Opus. The forked builder does the same kind of edit on Sonnet from about 57k.

**The plan grows with G1's rounds, and jumps when `/scope` drafts content.** #34's four art drafts cost $2.02 and left `/scope` at 188k before the plan was written ($1.45 more). #31's plan was sent back and redrafted ($0.71). #29 and #30 co-wrote their text in `/scope`. When the content is right, the build and review that follow are cheap (#29's build $0.99, #34's review $1.78), so the cost moves rather than grows; but it moves into the most expensive context.

**The build scales well.** The builder cost $0.63–2.41 on diffs of +105 to +4677. It is the one block whose cost didn't follow the diffs.

## 4. Tiers

**Small is right for code with nothing heavy after G1:** $2.44–5.06, median $3.99, against D25 Standard's $8.32.

**Small docs runs cost more than Small code runs** ($5.37 against $3.99), because:
- The red-team on docs reads every claim against its sources (30 calls median, $1.01, against 13 and $0.52 on Small code). It earned it: #28's PDF metadata (9), #30's missing CI job (8), #31's unsupported source (4).
- Content co-written at G1 makes long sessions. #30 and #31 ran planning, build and three or two G2 rounds in one session, to 205k and 187k.

**The tier check worked when used.** `scope` recommended Small on #28, #30 and #31, and the owner passed it on #11 and #26. It lowered #157 after G1. No run needed raising.

## 5. Subagents

**Builder (Sonnet, forked):** $0.25–2.41. It now runs the UI check too, and that check is where its context goes over 200k. Builders without a UI check peaked at 99–125k; with one, at 139–259k (#140 259k, #34 222k, where the check took it from 157k).

**Red-team (Opus):** $0.29–1.57 per run, median $1.31 on Standard, plus $1.30 for the Epic 3 audit. It made the call on every quality finding of note, and on docs runs it reads what a script can't (a PDF's properties, whether a source backs a claim). Narrow re-reviews cost $0.09–0.47. They found something new on four runs: a regression in a fix (#6), the session's own Roadmap line (#30), and wording notes left as they were (#18, #27).

**Surveyor (C6):** used on 7 of 10 D25 Standard runs ($0.18–0.31). With it, the plan's main session cost $1.55–2.48 (median $1.93); without it, $1.54 (#21) and $2.32 (#18), leaving out #34's art. That is no measurable saving either way, the same answer as research/11. Its best use was different work: #31's three surveyors drafted twelve candidate stories from three repos with their sources ($0.68), which is research, not orientation.

**`reviewOnReady` (C11), BabyBuddyHelper's CI reviewer:** no comment in 5 runs (#134, #133, #150, #155, #157), and on #155 it skipped the new commits of a PR it had already seen.

## 6. Trials

| Trial | Runs | Result | Recommendation |
|---|---|---|---|
| **T1**, the smallest complete change | Every D25 run | No red-team finding traced to something T1 cut. Planning cost rose, but with G1's rounds and co-written content, not with T1. #141, the second run research/11 waited for, hasn't run under the harness | **Keep, and make it a standing rule** (no longer a trial) |
| **T4**, the error-handling lens | 12 runs | A finding on 9 (scores 5–7, most fixed); 0 on #20, #34 and #29; skipped with a reason on #157 | **Keep, and make it standing** |
| **T5**, `security-review` | 4 runs (#6, #12, #13, #18) | 0 findings the red-team missed, in 4 runs. #18 cost about $0.70, over the $0.50 line, which is T5's drop condition. It triggered correctly every time, and stayed off on every run it didn't apply to | **Drop**, as its rule says |
| **T6**, the UI check | 7 runs | In the builder every time (C1). Owner UI rounds after G2: 0 on every run. #14's owner change came before review, as a design choice | **Make it standing**, and move it out of the builder's context (§9, E7) |
| **T7**, `frontend-design` | 4 used, the rest "not needed" with a reason | Judgeable since C4. Used for palettes, nav, compositions and a fallback; no UI round after G2 on those runs | **Keep, and make it standing** |

## 7. Quality

| | D25 Standard (10) | D25 Small (8) |
|---|---|---|
| Fix-worthy findings fixed at G2 | 0–5 per run | 0–3 per run |
| Blocking at merge | 0 | 0 |
| Runs with a fix round | 9 | 6 |
| Older bugs found and sent on | #140 (3, to InvoiceMe's backlog #153), #14 (1, opened as an issue), #29 (the slow migrate test, #38, then fixed in the PR) | — |

**The first escapes, all doc drift.** The Epic 3 knowledge audit (#26) found five places where an ADR or a spec no longer matched the code or content. They came from #27, #29, #30, #31 and #34, whose red-teams had each approved. None is a code bug. Each phase's review reads its own diff; the drift showed only across the Epic. The other D25 windows run to 2026-12-09, and D24's close on 2026-11-25.

**Most G2 fixes are still docs,** as research/11 found. The red-team is the doc checker, and the Epic audit is the second net.

**The owner's live check found what review couldn't,** once: #155's root cause, which only reproduced on the owner's device.

## 8. Process defects

The R12 candidates, grouped by cause. "Runs" are the runs that showed it.

| Defect | Runs | Cost | Cause | R12 |
|---|---|---|---|---|
| **`set_monitor` denied, Auto-fix left on** | 6 of 13 denied | A turn on #34; CI events the session has to read and ignore | Not in `settings.json`'s allow list | R12-5 |
| **G2 fixes and new scope built in the Opus review session** | #155, #27, #29, #30, and most fix rounds | $1.28–4.75 on the worst runs | `review` step 5 has no fork for fixes | R12-3 |
| **Owner content and art drafted inside `/scope`** | #34, #30, #31, #29 | #34: $3.47 and `/scope` at 230k | No step for drafting before planning | R12-15 |
| **An Epic's close has no set order** | #11, #26 | #11: no audit. #26: a stopped `/close` ($0.46, a turn), and the audit's five findings missed the docs pass | Only project memory holds the order | R12-6, R12-12, R12-19 |
| **The handoff's CI line trusts only the jobs that ran** | #30 | A false "CI: pass" | `gh pr checks` lists what ran | R12-17 |
| **A detail the plan forbids was posted, then edited** | #28 | Edit history keeps it | No check before posting | R12-14 |
| **A deferred item wasn't recorded** | #30 | A G2 fix | "Recorded as a follow-up" with no step | R12-18 |
| **A rule written at G1 wasn't checked against its content** | #31 | An escape | The criteria checked the rule's line only | R12-20 |
| **`check-gate` blocks on a failure already filed** | #29 | A turn and $1.28 | The gate can't tell a known failure from a new one | R12-16 |
| **The UI check takes the builder over 200k** | #140, #34 | Peaks 259k and 222k | The check runs in the builder's context | R12-10 |
| **A question for a tier recheck that only confirms or lowers** | #157 | A turn | Asked apart from the G1 accept | R12-4 |
| **A typed value asked in a choice's notes** | #13 | Two G1 rounds for one URL | Done right on #28 | R12-9 |
| **A question after G2's decisions that needed none** | #27, #18, #11 | A turn each | Done right on #29 | R12-13 |
| **Small's criteria and the plan's size disagree** | #9 | A tier the owner corrected at the plan | A dependency move fails Small's test | R12-8 |
| **The checkout isn't on an up-to-date default branch** | #155 | Planned on stale code | Nothing checks it | R12-1 |
| **A bug only the owner can reproduce** | #155 | $4.75, 6 turns | No "reproduce first" step | R12-2 |
| **A new ADR with no review check** | #21, #18 | The rule isn't checked from the next issue | Nothing drafts it | R12-11 |
| **`Decisions.md` misread on install** | #6 | A G2 question | The install docs don't say what it holds | R12-7 |
| **`runs.js` mis-splits a run that opens with `/close`** | #26 | About $1 moved between phases | Phases only move forward; subagents go by type | — |

## 9. Candidate changes, ranked

| # | Change | Saves | Evidence | Size |
|---|---|---|---|---|
| E1 | **G2 fixes go to a forked builder.** `review` amends the plan with the approved fixes (or the new sub-phase), runs `build` forked, then the narrow re-review. Typos and one-line doc fixes stay in the session | $0.50–1.50 per run with real fixes; $3–4 on a #155 | Strong: review's session is +$0.78 and +14 calls over D24 | Medium: `review` step 5, `build` takes an amendment, tests |
| E2 | **Allow `set_monitor`,** and `review` turns Auto-fix off after each push and before the ready-to-merge note | A turn on some runs, and no unwanted pushes | Strong: 13 runs | Tiny |
| E3 | **The Epic close as one sequence:** the knowledge audit first, then a docs pass scoped with its findings, then `/close <n> epic` to clean up. `/close` on an Epic issue with no branch runs the audit and names the docs pass as next; on an Epic issue it always asks before skipping the audit | A turn and $0.46 on #26; the audit's findings land in the same PR | Strong: both Epic closes | Small: `close` and the CLAUDE.md template |
| E4 | **Drafting comes before `/scope`:** owner content, art or design is drafted in its own session and ends in an approved file; `/scope` plans from the file | `/scope` stays near 150k. #34's plan was written at 190–230k for $1.45 | Medium: #34, with #29–#31 | Small: a CLAUDE.md line and `scope` step 3 |
| E5 | **The handoff checks itself before posting:** CI's required jobs by name, a missing one is not passing; the plan's "never quote" list is checked first; a comment with such a detail is deleted and reposted, never edited | A false pass; a privacy leak | Medium: #30, #28 | Small: `build`'s handoff step, `handoff-check` |
| E6 | **The plan's checks cover what G1 adds:** a deferred item is a step with its own criterion; a rule G1 writes is checked against every item it governs; a new or changed ADR comes with a draft `guardrails-review` check for G2 | One escape, one G2 fix, and new ADRs checked from the next issue | Medium: #30, #31, #21, #18 | Small: `scope`'s plan rules |
| E7 | **The UI check runs in its own read-only subagent** with the plan's UI criteria, outside the builder's context | Keeps the builder under 200k | Medium: 2 runs over | Small–medium |
| E8 | **Fewer questions:** a recheck that confirms or lowers the tier goes in the plan; a typed value is its own question; after G2's decisions, anything that needs no change is a note with a recommendation | 1 turn on some runs | Medium: #157, #13, #27, #18, #11 | Tiny |
| E9 | **`check-gate` reports a failure that an open issue names,** and still blocks on anything else | A turn and a forced G2 reversal | Weak: 1 run | Small; risk of hiding a real failure |
| E10 | **Small's criteria allow a dependency move** that adds, removes and upgrades nothing | A tier correction at the plan | Weak: 1 run | Tiny |
| E11 | **Session start warns when the checkout is behind the default branch;** a bug only the owner can reproduce gets a "reproduce first" step | Rework like #155's | Weak: 1 run | Tiny |
| E12 | **Get Started says what `Decisions.md` holds** | A G2 question | Weak: 1 run | Docs only |
| E13 | **`runs.js`:** a `/scope` after `/close` restarts the phases, and a subagent counts in the phase that launched it. Done in ProdHarnessConfig#4 | Correct medians | 1 run | Small, with a test |

**Trials and open items:**
- **T1, T4, T6 and T7 become standing rules;** they stop being labelled as trials in `scope` and `review`.
- **T5 is dropped,** as its rule says. `security-review` stays installable for an owner who asks for it.
- **C6, the surveyor, off by default** when the issue names its files, and on for unfamiliar code or when the survey is the work (#31). Two analyses show no saving at this size.
- **C11, `reviewOnReady`:** remove it from BabyBuddyHelper's CI, in that repo, at its reinstall PR. Five runs, no comment.

**The targets.** D25 missed them on issues three times D24's size, and the misses trace to G2 fixes in the review session, G1 drafting and owner changes, which E1 and E4 address. Keep $7.49 and 7 turns for Standard, and judge them again after E1 and E4 ship. Count a second G1 round that builds on the first's answers apart, so the record shows the planned path.

**Considered and not recommended:**
- **A lighter red-team for docs runs.** It is half of a docs Small's cost, but it made the findings that mattered on #28, #30 and #31.
- **Ending a long Small session at G2.** E1 and E4 shorten it without the extra turn a new session costs.
- **The red-team on Sonnet.** Still untested, and still where quality comes from.

## 10. Triage (owner's decisions, 2026-11-10)

The owner accepted every recommendation, and took E9 too, which this analysis had left as weak.

| # | Change or item | Decision | Where |
|---|---|---|---|
| E1 | G2 fixes go to a forked builder through a plan amendment; typos and one-line doc fixes stay in the session | **Do** | ProdHarnessConfig#4 |
| E2 | Allow `set_monitor`; `review` turns Auto-fix off after each push and before the ready-to-merge note | **Do** | #4 |
| E3 | The Epic close as one sequence: audit, docs pass, `/close <n> epic` | **Do** | #4 |
| E4 | Owner content, art and design drafted before `/scope`, in its own session, ending in an approved file | **Do** | #4 |
| E5 | The handoff checks the required CI jobs by name and the plan's "never quote" list before posting; delete and repost, never edit | **Do** | #4 |
| E6 | The plan covers what G1 adds: deferred items as steps, new rules checked against their content, a draft `guardrails-review` check with each new ADR | **Do** | #4 |
| E7 | The UI check in its own read-only subagent | **Do** | #4 |
| E8 | Fewer questions: tier rechecks in the plan, typed values on their own, notes after G2's decisions | **Do** | #4 |
| E9 | `check-gate` reports a failure an open issue names, and blocks on anything else | **Do**, against the recommendation to defer | #4 |
| E10 | Small allows a dependency move that adds, removes and upgrades nothing | **Do** | #4 |
| E11 | A warning when the checkout is behind the default branch; "reproduce first" for owner-only bugs | **Do** | #4 |
| E12 | Get Started says what `Decisions.md` holds | **Do** | #4 (docs) |
| E13 | `runs.js`: `/scope` after `/close` restarts the phases; subagents count in the phase that launched them | **Do** | #4, with a test |
| T1, T4, T6, T7 | Standing rules, no longer trials | **Do** | #4 |
| T5 | Dropped; `security-review` stays available on request | **Do** | #4 |
| C6 | The surveyor off by default when the issue names its files; on for unfamiliar code or when the survey is the work | **Do** | #4 |
| C11 | `reviewOnReady` removed from BabyBuddyHelper's CI | **Do** | BabyBuddyHelper's reinstall PR |
| Targets | $7.49 and 7 turns kept for Standard, ≤ 6 turns for Small; a second G1 round that builds on the first is recorded apart; judged again after E1 and E4 ship | **Keep** | The next runs' record |

## 11. Open after this analysis

- **Escapes:** D24's windows close on 2026-11-25, D25's between 2026-11-26 and 2026-12-09.
- **The Epic 3 audit's five findings** wait at ThisIsMatheusCastro's 4.2 G1.
- **ThisIsMatheusCastro links here:** its Harnesses write-up quotes the README's Results, and Calvo's stories link `Evidence/research/11-meta-analysis.md`, `05-pilot-v1.md` and `OPTIMIZATION_PLAN.md` D23. A move in #4 has to keep those paths, or tell the owner.
