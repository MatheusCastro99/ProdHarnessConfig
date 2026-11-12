# R14: Validating D26

Started 2026-11-11. This is the log of the runs after D26, judged against [research/13](13-d25-meta-analysis.md) §9–10. Every run is priced by [scripts/runs.js](scripts/runs.js) from [scripts/runs.json](scripts/runs.json), at list price. The transcripts stay out of git. The owner's observations from these runs, and the harness changes they lead to, are collected in ProdHarnessConfig#9.

## Criteria tracker

The targets stay as research/13 §10 set them: Standard median ≤ $7.49 and ≤ 7 owner turns, Small ≤ 6 turns, peak ≤ 200k. They're judged again once E1 and E4 have run on enough issues.

| Change | What counts | Runs so far |
|---|---|---|
| E1 | G2 fixes, and new scope after the build, go through `build <n> amend` on the forked builder; typos and one-line doc fixes stay in the session | **#45: met, twice.** The owner's layout changes after the build went in as sub-phase 5 ($0.76 builder), and the G2 fixes as sub-phase 6 ($0.47 builder), each followed by the narrow re-review. The review session still cost $1.91, against D25 Standard's median of $1.85 (finding 3). **#46: met for G2, missed for the owner's tweak.** The owner's G2 finding went in as sub-phase 6 ($0.35 builder); the doc line and the re-review's one-character bug stayed in the session. The owner's tweak after the build went in the main session, which left the handoff behind the head (#46 finding 1). **#47: met.** Seven G2 decisions, five of them doc and rule fixes, went in as one sub-phase through `build 47 amend` ($0.35 builder), with one narrow re-review. The review session's main thread was $1.32 before `/close`, the first D26 run under D25's median of $1.85. **#52: met.** The G2 doc fixes were one-line edits in three files, made in the session, with one narrow re-review; no amend was needed. **#53: doesn't apply.** G2 found nothing to fix. **#54: doesn't apply.** G2 found nothing to fix. **#56: met.** The one G2 doc fix stayed in the session, with a narrow re-review |
| E2 | Auto-fix off after each push and before the ready-to-merge note | **#45: met.** It was already off at each check; `set_monitor` wasn't needed. **#46: met.** The main session turned it off after the build; one Vercel bot event still arrived just after, and needed no change. **#47: met.** Auto-fix was already off after the build; the Vercel bot's comment still woke the main session ($0.13), as in #45 and #46. **#52: met.** The main session turned it off after the build; the Vercel bot's comment still woke it ($0.08). **#53: met.** Auto-fix was turned off after the build; the Vercel bot's comment still woke the session. **#54: met.** Auto-fix was off; the Vercel bot's comment still woke the session mid-review. **#56: met.** Auto-fix stayed off; no bot comment woke the session |
| E4 | Content, art or design drafted before `/scope`, ending in an approved file | **#45: met, in a side session that `/scope` proposed.** `/scope` peaked at 162k, against #34's 230k. Drafting was 25 calls and $2.32, and 7 owner turns (finding 1). **#46: doesn't apply.** Calvo's sprite was approved in #34, and `/scope` went straight to G1. **#47: doesn't apply.** Nothing to draft. **#52: met, in a side session that `/scope` proposed, again.** The issue asked for the lines to be drafted first, and they weren't. The proposal card worked this time; drafting was $0.92 and 5 owner turns (#52 finding 1). **#53: missed.** The issue asked for the art to be drafted inside `/scope`, which took it from 79k to 191k by G1 and the Small session to 238k (#53 finding 1). **#54: doesn't apply.** The wording and placement were G1 questions with previews. **#56: doesn't apply** |
| E5 | The handoff checks the required CI jobs by name | **#45: met.** Lighthouse failed on one head and isn't required; the handoff passed on the four required jobs, and G2 said Lighthouse failed. **#46: met.** Lighthouse failed on the first two heads; G2 reported it, and the owner declined it (#46 finding 5). **#47: met.** Lighthouse failed its first run and passed on a re-run; every job passed on both heads. **#52: met.** The handoff passed on the four required jobs. Lighthouse failed after G2, on `main` as well (#52 finding 5). **#53: missed in the builder.** The four required jobs passed, but the builder wrote "CI on that head: fail" for Lighthouse and BLOCKED the handoff (#53 finding 3). **#54: met.** The builder wrote READY on the four required jobs while Lighthouse failed (#56). **#56: met.** Every job passed on both heads |
| E6 | The plan covers what G1 adds | **#45: doesn't apply.** No item deferred at G1, no new rule, and ADR-010 only changed status. **#46: met.** The story rule G1 reworded was checked against all 9 stories, and the four doc items landed as worded. **#47: met.** G1 amended ADR-011, and the plan drafted the matching guardrails check, which the owner approved, reworded, at G2. **#52: met.** G1 amended ADR-011 again; the guardrails check stayed as drafted, approved at G2. **#53: doesn't apply**. **#54: doesn't apply**. **#56: doesn't apply** |
| E7 | The UI check runs on `ui-check` in `review`, not in the builder | **#45: met.** 42 calls, $0.83, 13 of 13 checks passed, at a 112k peak. The builder ran no UI check and peaked at 158k. **#46: met, with a look in the builder.** `ui-check` ran twice (77 calls, $1.75, a 168k peak) and caught the builder's bug with the red-team. The builder still looked at the page in the browser pane (6 calls, $0.08) (#46 finding 4). **#47: met.** The builder made no browser calls. `ui-check` ran once (45 calls, $0.76, a 104k peak) and saved its screenshots under `.harness/work/47/ui/`. **#52: met, with a longer look in the builder.** `ui-check` ran once (74 calls, $1.86) and peaked at 189k, the closest to the ceiling yet. The builder looked at the page in the browser pane for 16 calls ($0.30) (#52 finding 4). **#53: met.** The builder made no browser calls; `ui-check` ran once (33 calls, $0.74). **#54: met.** The builder made no browser calls; `ui-check` ran once (22 calls, $0.42). **#56: doesn't apply.** No UI sub-phase, so `review` ran the red-team alone |
| E8 | Fewer questions | **#45: met for the tier recheck,** which went in the plan ("confirmed Standard"). G1 still took three dialogs, the third after the draft (finding 2). **#46: met.** No tier question; G1 took two dialogs (7 decisions). **#47: met at G2.** The report put seven decisions, each with a recommendation, to one question, and the owner answered "All as recommended". G1 took three dialogs, two of them after the owner added scope (#47 finding 1). **#52: met.** G1 took two dialogs (5 decisions), one of them about the missing lines; G2 took one reply. **#53: missed for the tier.** G1's first dialog asked "Which tier?" with Small recommended, rather than stating it in the plan (#53 finding 5). **#54: met.** `/scope 54 small` set the tier; G1 took one dialog (4 decisions). **#56: missed for the tier again.** G1's one dialog asked "Tier" with Small recommended (#56 finding 3) |
| E9 | `check-gate` reports a known failure, blocks on anything else | **#45: doesn't apply.** **#46: doesn't apply.** **#47: doesn't apply**. **#52: met, for the first time.** Lighthouse's blocking-time failure, also on `main` since #46, went to #56 at the owner's choice and into `known-failures.md`. **#53: missed across issues.** `known-failures.md` is per issue, so #52's entry for #56 didn't carry over, and the handoff was BLOCKED (#53 finding 3). **#54: met within the issue.** The review session wrote #54's own `known-failures.md` for #56, at no turn. **#56: closes the known failure.** Lighthouse's blocking time and score become warnings |
| E11 | `scope` warns when the checkout is stale | **#45: met.** `git fetch` and `git status -sb` ran first; the checkout was current. **#46: met,** the same. **#47: met,** the same. **#52: met,** the same. **#53: met,** the same. **#54: met,** the same. **#56: met,** the same |
| C6 | The surveyor is off when the issue names its files | **#45: ran** ($0.24). The issue named its content files but not the code; the section's components were new. **#46: ran** ($0.34), for the same reason. **#47: ran** ($0.28), though the issue named both files it changes; the section component was new. **#52: met.** The issue named its files, and the surveyor didn't run. **#53: met.** The issue named its files, and the surveyor didn't run. **#54: met.** The issue named its files, and the surveyor didn't run. **#56: met.** The surveyor didn't run |
| Targets | See above | **#45** missed cost ($14.30) and turns (23), and met peak (162k; the builder 158k). On the planned path, without the drafting session ($2.32, 7 turns) and the owner's changes after the build ($2.82, 5 turns), $9.15 and 11 turns. **#46** missed cost ($10.61) and turns (11), and met peak (157k; `ui-check` 168k). On the planned path, without the owner's tweak and the stale handoff it left ($1.91, 2 turns), $8.70 and 9 turns. **#47** missed cost ($8.48) and turns (10), and met peak (162k). Nothing was off the planned path: the owner's additions came at G1. **#52** missed cost ($14.12) and turns (16), and met peak (153k; `ui-check` 189k). On the planned path, without the drafting ($0.92, 5 turns) and the stuck CI ($3.32, 3 turns), $9.88 and 8 turns. **#53** (Small) missed turns (8 against 6) and peak (238k, 25 calls over 200k). On the planned path, without the redraw, the blocked handoff and the usage limit (3 turns, $0.35), $7.10 and 5 turns. **#54** (Small) met every target: $3.46, 5 turns and a 148k peak, the first D26 run to do so. **#56** (Small) met every target: $3.24, 5 turns and a 153k peak |

## Log

| Issue | Repo | Config | Tier | Findings by source | Owner turns | Cost | Notes |
|---|---|---|---|---|---|---|---|
| #45 | ThisIsMatheusCastro | D26 | Standard | `red-team` 2 (8, 7), fixed through `build 45 amend`; 1 adjacent (3), a correcting comment on the issue; `ui-check` 13 of 13 pass; the re-review 1 (stale doc lines left by fix 1), noted on Epic #44 for its close | 23 (11 on the planned path) | $14.30 | The first D26 run. The silhouette was drafted in a side session; the owner's layout changes after the build went through `build amend`. See Runs |
| #46 | ThisIsMatheusCastro | D26 | Standard | `red-team` 2 (8, 8): blocking time, declined by the owner; a stale doc line, fixed in the session. `ui-check` 1 (2), declined. The owner's own 1, through `build 46 amend`. The re-review 2 (12, 4), both fixed in the session | 11 (9 on the planned path) | $10.61 | Nothing to draft. The owner's tweak after the build went in the main session and left the handoff stale. See Runs |
| #47 | ThisIsMatheusCastro | D26 | Standard | `red-team` 2 (8, 6): docs and rule files still giving ADR-011's old rule, and the drafted guardrails check's wording, both fixed through `build 47 amend`; 2 low, declined. `ui-check` all pass. The re-review 0. Follow-up #52 opened at G2 | 10 | $8.48 | Nothing to draft. The plan waited 1 h 43 min at G1, then the owner added scope to it. See Runs |
| #52 | ThisIsMatheusCastro | D26 | Standard | `red-team` 2 (8, 6): stale docs on Calvo's drop, fixed in the session; the bubble can cover Calvo at large font sizes, noted in the content file. `ui-check` all pass. The re-review 0. Lighthouse sent to #56 as a known failure | 16 (8 on the planned path) | $14.12 | The lines drafted in a side session; CI stuck queued for an hour in a GitHub incident while the builder polled. See Runs |
| #53 | ThisIsMatheusCastro | D26 | Small | `red-team` 0. `ui-check` 5 of 5 pass. Lighthouse already tracked in #56, recorded as a known failure in review | 8 (5 on the planned path) | $7.45 | The art drafted inside `/scope`; the handoff BLOCKED on #56's failure; a usage limit paused the review; peak 238k. See Runs |
| #54 | ThisIsMatheusCastro | D26 | Small | `red-team` 0. `ui-check` 4 of 4 pass. Lighthouse recorded as #56's known failure | 5 | $3.46 | One session, nothing off the planned path; the first D26 run to meet every target. See Runs |
| #56 | ThisIsMatheusCastro | D26 | Small | `red-team` 1 (optional doc line), fixed in the session; the re-review 0. No UI, so no `ui-check` | 5 | $3.24 | The Lighthouse failure from #46 ends: blocking time and score become warnings. Met every target. See Runs |

## Runs

### ThisIsMatheusCastro #45 Phase 4.1: WhoAmI section (Standard), PR #49

The WhoAmI section on `/dev/shell`: the background text, the hobbies silhouette (ADR-010), the Tech Stack JSON block, the project cards and the links, all rendered from `content/`.
- `/scope` settled six decisions, then stopped: the issue asked for the silhouette to be drafted with the owner first.
- It proposed a drafting session, which the owner started. When the draft was approved, `/scope` resumed by itself, settled four layout decisions and wrote a 10k-character plan in four sub-phases.
- After the build, the owner changed the layout. The changes went in as sub-phase 5 through `build 45 amend`; then came three small tweaks in the main session and one commit of the owner's own.
- G2's two fixes went in as sub-phase 6 through `build 45 amend`.

The diff is 28 files, +827 / −24, in 9 commits.

| Block | Transcript | Model | Calls | Context: first → peak | Time | Cost |
|---|---|---|---|---|---|---|
| A `/scope` to the drafting proposal | 4358cf72 | Opus 5.5 | 14, plus 8 surveyor (Sonnet, $0.24) | 79k → 118k | 9 min, 2 dialogs (6 decisions) | $1.40 |
| The drafting session, proposed by `/scope` | a0e776a6 | Opus 5.5 | 25, 2 of them in the browser pane | 79k → 154k | 16 min, 5 dialogs and a plan accept | $2.32 |
| A, resumed after the draft: G1 and the plan | 4358cf72 | Opus 5.5 | 12 | 118k → 162k | 9 min, 1 dialog (4 decisions) | $1.03 |
| B: "continue 45", the main session | 95189cae | Opus 5.5 | 5 | 75k → 80k | 14 min | $0.31 |
| B `build`: the forked builder, sub-phases 1–4 | 95189cae/subagents | Sonnet 5.5 | 66, no UI check | 58k → 158k | (same) | $1.57 |
| The owner's layout changes: a dialog, then `build 45 amend` (sub-phase 5) | 95189cae | Opus 5.5 and Sonnet 5.5 | 12, plus 23 builder ($0.76) | → 105k | 16 min | $1.39 |
| The owner's three tweaks in the main session, and the handoff after CI | 95189cae | Opus 5.5 | 35, 9 in the browser pane | 105k → 139k | 11 min | $1.43 |
| C `review` to the G2 report | 6ea5b2c6 | Opus 5.5 | 11, plus 13 red-team (Opus, $1.11) and 42 `ui-check` (Sonnet, $0.83) | 78k → 107k | 6 min | $2.73 |
| C: the G2 fixes, through `build 45 amend` (sub-phase 6), and the narrow re-review | 6ea5b2c6 | Opus 5.5 and Sonnet 5.5 | 18, plus 20 builder ($0.47) and 7 red-team ($0.30) | → 132k | 9 min, 1 dialog (the plan's size) | $1.58 |
| C: the note on Epic #44 and the ready-to-merge note | 6ea5b2c6 | Opus 5.5 | 7 | → 139k | 2 min | $0.31 |
| `/close 45` | 6ea5b2c6 | Opus 5.5 | 5 | → 144k | under 1 min | $0.22 |
| **Total** | | | | | ≈ 1 h 50 min | **$14.30** |

`runs.js` gets the total right but not the split: the forked builder's transcript records no `toolUseId`, so E13 can't place the G2 fixes' builder in review, and it counts under build. The drafting session is under "other", because `runs.js` has no `draft` phase yet (ProdHarnessConfig#9). The table above is split by the sessions' own markers.

**Against the targets:**
- **Owner turns:** 23. Of these, 7 were drafting (starting the session from its card, five dialogs, and the plan accept) and 5 were the owner's changes after the build (the request, its dialog, two tweaks, and "CI passed, finalize the handoff"). The other 11 were `/scope`, three G1 dialogs, the G1 accept, "continue 45", `/review`, the G2 reply, the plan-size question, "mark ready" and `/close`.
- **Context:** met. The main peak was 162k, in `/scope` after the draft; the builder 158k; `ui-check` 112k.
- **Cost:** $14.30, the dearest harness run so far. Without drafting and the owner's changes, $9.15, against D25 Standard's median of $8.32 (10 runs, a median of +795 lines). By block, on that path:
  - plan $2.43 (median $2.21);
  - build $1.88 (median $2.14);
  - review to G2 $2.73 (the red-team $1.11 and `ui-check` $0.83);
  - G2 fixes $1.58;
  - ready and close $0.53.
- **Quality:**
  - The red-team found 2: screen readers heard every hobby twice, once from the silhouette's hidden list and once from the YAML block the owner added after the build (8); and stale docs (7). Both were fixed through `build 45 amend`. A third, adjacent: the posted handoff named a grid that sub-phase 5 removed (3), corrected by a comment on the issue.
  - `ui-check` passed all 13 checks at four widths, with keyboard and contrast.
  - The narrow re-review confirmed both fixes and found that fix 1 made two doc lines untrue: they still said screen readers read the silhouette. The owner sent it to the Epic 4 close and had it noted on #44.
  - **Escapes** are tracked to 2026-12-11.

**Findings:**
1. **E4 kept `/scope` small, but the drafting cost the owner a separate session and 7 turns** (R14-1). `/scope` peaked at 162k against #34's 230k, and its plan was 10k characters. But nothing named the step:
   - `/scope` stopped and proposed a session.
   - Its first try to start the session itself was refused. The turn had been started by the surveyor's notification, not by the owner, so the app allowed only a proposal card, and the owner had to start it.
   - The drafting session ran in plan mode and showed its drafts as dialog previews, with 2 browser calls.
   - When it ended, `/scope` resumed without an owner turn.

   The owner's observation from this run is ProdHarnessConfig#9's first section: `/draft <n>` becomes the entry point to every issue.
2. **G1 took three dialogs, 10 decisions in all, one of them against the recommendation** (the wording "Code-flavoured"). The third dialog came after the draft and built on it, so research/13 §10 counts it apart. The tier recheck went in the plan, as E8 says.
3. **E1 worked as designed, but the review session didn't get cheaper.** Both rounds of new work went to the forked builder on Sonnet: the owner's layout changes ($0.76) and the G2 fixes ($0.47). Each needed one narrow re-review at most. The review session's main thread still cost $1.91, against D25's median of $1.85, with 36 calls. About $0.55 of it was one window: the G2 decisions, the plan's size question and condensing the plan (finding 4).
4. **The amended plan went over its budget, and that cost a turn** (R14-2). Sub-phases 5 and 6 took `plan.md` to 16,414 characters, against 12,000. `handoff-check --plan` failed, and the session asked the owner whether to go over budget (its recommendation) or condense the done sub-phases. The owner chose to condense. The full plan was still on the issue.
5. **The owner's tweaks in the main session left the handoff waiting on CI** (R14-3). After two commits in the main session, the session ended its turn with CI running. `handoff-check` won't accept "pending", so it took the owner's "CI passed, finalize the handoff". `build amend` waits for CI itself; the main session didn't.
6. **E5 held when it mattered:** Lighthouse failed on `47e3a93` (total blocking time, 293 ms against 200 ms) and isn't a required job. The handoff passed on the four required jobs, and G2 reported the Lighthouse failure separately. Lighthouse passed on the final head.
7. **E7 held:** the builder made no browser calls, and the UI check ran in `review`, beside the red-team, both in the background. `ui-check` saved its screenshots under `.harness/work/45/ui/`.
8. **C6:** the surveyor ran for $0.24. The issue named its content files, but the components were new code, so the survey was in scope.
9. **The owner made a commit of their own** (`47e3a93`, a wording fix) during the tweaks. The session put it in the handoff before G2, so the review was pinned to the head that included it.

### ThisIsMatheusCastro #46 Phase 4.2: Project sections (Standard), PR #50

One shared project section template, rendered for Harnesses, InvoiceMe and BabyBuddyHelper from `content/projects/`, with Calvo's full body beside each section and his bust below it on phones. G1 also settled five doc items from Epic 3's close audit, including a reworded story rule.
- Nothing needed drafting: Calvo's sprite was approved in #34. `/scope` asked two dialogs and wrote an 11k-character plan in four sub-phases.
- After the build, the owner asked the main session to lower Calvo 80px. It committed and pushed the change without a new handoff, so `/review` stopped, and the change was re-handed off through `build 46 amend`.
- At G2 the owner declined the blocking-time finding, fixed a doc line, and added a finding of their own, which went through `build 46 amend`. The narrow re-review caught a bug the builder left, which was fixed in the session.

The diff is 14 files, +353 / −49, in 8 commits.

| Block | Transcript | Model | Calls | Context: first → peak | Time | Cost |
|---|---|---|---|---|---|---|
| A `/scope` to G1 | cc40ac1e | Opus 5.5 | 26, plus 11 surveyor (Sonnet, $0.34) | 79k → 148k | 17 min, 2 dialogs (7 decisions) | $2.18 |
| B: "continue 46", the main session | ed193b5a | Opus 5.5 | 6 | 75k → 80k | 14 min | $0.33 |
| B `build`: the forked builder, sub-phases 1–4 | ed193b5a/subagents | Sonnet 5.5 | 46, 6 of them in the browser pane | 58k → 125k | (same) | $1.01 |
| The owner's tweak in the main session | ed193b5a | Opus 5.5 | 20, 4 in the browser pane | 82k → 110k | 3 min | $0.87 |
| C `review`, stopped: the head was past the handoff | 72f0d76b | Opus 5.5 | 4 | 78k → 84k | under 1 min | $0.35 |
| C: the tweak re-handed off through `build 46 amend` (sub-phase 5) | 72f0d76b | Opus 5.5 and Sonnet 5.5 | 7, plus 10 builder ($0.31) | → 99k | 2 min | $0.69 |
| C `review` to the G2 report | 72f0d76b | Opus 5.5 | 7, plus 23 red-team (Opus, $0.97) and 51 `ui-check` (Sonnet, $1.24) | 104k → 116k | 6 min | $2.57 |
| C: the G2 fixes, the doc line in the session and the owner's finding through `build 46 amend` (sub-phase 6) | 72f0d76b | Opus 5.5 and Sonnet 5.5 | 5, plus 12 builder ($0.35) | → 122k | 6 min | $0.57 |
| C: the narrow re-review | 72f0d76b | Opus 5.5 | 7, plus 4 red-team (Opus, $0.24) and 26 `ui-check` (Sonnet, $0.51) | → 137k | 2 min | $1.13 |
| C: the re-review's fix in the session, CI and the ready-to-merge note | 72f0d76b | Opus 5.5 | 14, 5 in the browser pane | 138k → 151k | 5 min | $0.63 |
| `/close 46` | 72f0d76b | Opus 5.5 | 5 | → 157k | under 1 min | $0.28 |
| **Total** | | | | | ≈ 1 h 15 min | **$10.61** |

`runs.js` gets the total, and again puts both amend builders ($0.66) under build rather than review (R14-4).

**Against the targets:**
- **Owner turns:** 11: `/scope`, two G1 dialogs, the G1 accept, "continue 46", the tweak, `/review`, "Amend build for it", the G2 reply, "Fix 1 and 2 here" and `/close`. The tweak and "Amend build for it" are off the planned path, which leaves 9.
- **Context:** met. The main peak was 157k, at `/close` in the review session. `ui-check` peaked at 168k on its first run.
- **Cost:** $10.61. Without the tweak and its stale handoff ($1.91), $8.70, against D25 Standard's median of $8.32 (a median of +795 lines, against #46's +353). By block, on that path:
  - plan $2.18 (median $2.21);
  - build $1.34 (median $2.14);
  - review to G2 $2.57 (the red-team $0.97 and `ui-check` $1.24);
  - the G2 fixes, the re-review and ready $2.33;
  - close $0.28.
- **Quality:**
  - The red-team found 2 (both 8): `/dev/shell`'s total blocking time went from 91 ms on `main` to a 230 ms median, from about 2,300 SVG pixel squares, against a 200 ms budget that is one of the issue's done-when items; and a stale doc line. The owner declined the first and had the second fixed.
  - `ui-check` passed every check but the budget, and raised one adjacent item (2), declined.
  - The narrow re-review, the red-team and `ui-check` together, found the builder's bug in the owner's finding: a missing space (`md:hiddenml-auto`) showed two Calvos on two sections from md up (12, blocking), and a comment over the line limit (4). Both were fixed in the session, which checked three widths in the browser and waited for CI before the ready note.
  - **Escapes** are tracked to 2026-12-11. The blocking time is a known gap, not an escape: it reaches `/` with Phase 4.4.

**Findings:**
1. **The owner's tweak after the build cost a stop in review and an owner turn** (R14-3 again). The main session made the change, checked it in the browser, committed and pushed `01f28ee`, and ended with "I haven't looked at CI for the new commit". The handoff still named `cc85f76`. `/review` checked the head first, as it should, stopped, and asked; the owner's "Amend build for it" led the review session to append a sub-phase 5 describing the committed change, and `build 46 amend` checked it and posted a new handoff. That repair was $1.04 and one turn, on top of the tweak's $0.87. ProdHarnessConfig#9 §3 covers it: the main session would have waited for CI and updated the handoff itself.
2. **The amended plan went over budget again, and the review session condensed it without asking** (R14-2 again). The appended sub-phase 5 took `plan.md` to 12,753 characters; the session rewrote its own section shorter (11,860), and did the same for sub-phase 6 (11,990). No turn this time, but by improvising; #9 §2 makes it the rule.
3. **E1's fork left a bug, and the narrow re-review caught it.** The owner's finding (the phone bust should alternate sides like the full body) went to the builder ($0.35), which dropped a space in a class name. The red-team and `ui-check` both found it. The fix was one character, so it stayed in the session, as E1 says, with the session's own browser check at 375, 768 and 1280px instead of a second re-review. The review session's main thread cost $2.60 in all, against #45's $1.91 and D25's median of $1.85, $0.73 of it from the stale handoff.
4. **`ui-check` is now the dearest part of review, and the builder still looks at the page.** Its two runs cost $1.75 (77 calls) against the red-team's $1.21, and its first run peaked at 168k. It couldn't save screenshots, because the browser pane only returns images inline; its spec allows that ("where the tools allow it"), and it reported measurements instead. The builder took a quick look at two widths (6 calls, $0.08). The `build` skill says the UI check isn't the builder's job, but doesn't forbid a look.
5. **Lighthouse failed, and the owner declined it.** Total blocking time failed on `cc85f76` and `01f28ee`. It isn't a required job, so E5 let the handoff pass, and G2 reported it with three options. The owner declined ("not worry about Lighthouse metrics for now"), though the budget was one of the issue's done-when items. Lighthouse passed on `9662971` and on the final head; the builder had seen single runs between 142 and 379 ms.
6. **G1: two dialogs, 7 decisions, two answered in the owner's own words** (Calvo alternating sides, and the story rule's wording). E6 held: the acceptance criteria checked the reworded rule against every story, and G2 confirmed all 9 comply. No tier question (E8).
7. **C6:** the surveyor ran for $0.34. The issue named its content files and docs, but the section components were new code.
8. **`docs-gate` blocked an acknowledgement written in the same command as the commit, twice** (R14-5). The builder and the main session each wrote the `stale-docs.md` line with `echo … >>` in the same Bash call as `git commit`. The hook checks the command before it runs, so the line didn't exist yet, and the commit was blocked; each retried with the acknowledgement already written. One call each, but the hook's message could say so.
9. **The close was clean.** `close.cjs` fast-forwarded `main` and deleted the branch, and the session updated its own project memory (4.2 done, 4.3 #47 next).

### ThisIsMatheusCastro #47 Phase 4.3: Other Work and the page close (Standard), PR #51

The Other Work section, one line, a repository link and stat chips for each entry in `other-work.md`, and the page close: Calvo's bust saying a closing line, a way back to the top, and the footer reading its links from `whoami.md`.
- Nothing needed drafting. `/scope` asked one dialog and presented a 12k-character plan, which waited unanswered for 1 h 43 min.
- The owner came back with additions to the plan: a measurement for each Other Work entry. That took two more dialogs, one about amending ADR-011 so Calvo can say a fixed page line, before G1.
- The build ran clean. At G2 the owner took all seven recommendations in one reply; the doc and rule fixes went through `build 47 amend`, and the narrow re-review confirmed them.

The diff is 16 files, +168 / −34, in 5 commits.

| Block | Transcript | Model | Calls | Context: first → peak | Time | Cost |
|---|---|---|---|---|---|---|
| A `/scope` to the first plan | 3cac3ffb | Opus 5.5 | 21, plus 9 surveyor (Sonnet, $0.28) | 79k → 128k | 7 min, 1 dialog (4 decisions) | $1.74 |
| The plan waits unanswered | 3cac3ffb | Opus 5.5 | 1 | 128k | 1 h 43 min | $0.04 |
| A resumed with the owner's additions: G1 | 3cac3ffb | Opus 5.5 | 23, 9 in the browser pane | 129k → 162k | 15 min, 2 dialogs (5 decisions) and the accept | $1.93 |
| B: "continue 47", the main session | 7a5b2e9c | Opus 5.5 | 4 | 75k → 79k | 16 min | $0.28 |
| B `build`: the forked builder, sub-phases 1–4 | 7a5b2e9c/subagents | Sonnet 5.5 | 43, no browser calls | 58k → 115k | (same) | $0.89 |
| The Vercel bot's comment wakes the main session | 7a5b2e9c | Opus 5.5 | 4 | → 83k | under 1 min | $0.13 |
| C `review` to the G2 report | 885379db | Opus 5.5 | 11, plus 11 red-team (Opus, $0.56) and 45 `ui-check` (Sonnet, $0.76) | 78k → 103k | 4 min | $2.07 |
| C: the G2 fixes through `build 47 amend` (sub-phase 5) | 885379db | Opus 5.5 and Sonnet 5.5 | 7, plus 14 builder ($0.35) | → 110k | 5 min | $0.61 |
| C: the narrow re-review and the ready-to-merge note | 885379db | Opus 5.5 | 8, plus 3 red-team (Opus, $0.16) | → 118k | 1 min | $0.47 |
| `/close 47` | 885379db | Opus 5.5 | 7 | → 127k | under 1 min | $0.32 |
| **Total** | | | | | ≈ 2 h 35 min, 50 min of it working | **$8.48** |

`runs.js` gets the total, and again puts the amend builder ($0.35) under build (R14-4).

**Against the targets:**
- **Owner turns:** 10: `/scope`, three G1 dialogs, the additions to the plan, the G1 accept, "continue 47", `/review`, "All as recommended" and `/close`. All of them on the planned path; four were G1's.
- **Context:** met. The main peak was 162k, at G1 after the owner's additions.
- **Cost:** $8.48, against D25 Standard's median of $8.32 (a median of +795 lines, against #47's +168). By block:
  - plan $3.71 (median $2.21), $1.97 of it after the owner's additions;
  - build $1.17 (median $2.14);
  - review to G2 $2.07 (the red-team $0.56 and `ui-check` $0.76);
  - the G2 fixes, the re-review and ready $1.08;
  - close $0.32, and the bot's wake $0.13.
- **Quality:**
  - The red-team found 2: five doc and rule lines still said Calvo speaks on his own only through section stories, after G1 amended ADR-011 (8), and the drafted guardrails check could be read two ways (6). Both were fixed through `build 47 amend`, the rule files with the owner's approval of each wording. Two low items were declined: duplicate keys, and the footer outside an `ErrorBoundary`.
  - `ui-check` passed every check, at 375px and the pane's width, with keyboard and target sizes.
  - The narrow re-review confirmed both fixes.
  - **Escapes** are tracked to 2026-12-11.

**Findings:**
1. **The owner added scope at G1, and planning cost $3.71 and 4 turns.** The first plan waited 1 h 43 min; its approval prompt timed out, and the owner answered with additions in a message. They brought two more dialogs. Between them, the session tried to find one of the new figures in the browser pane (9 calls), couldn't read it, and asked. On resuming after the gap, 84k of context had to be cached again ($0.68). This is G1 doing its job, not a harness miss.
2. **R14-2, a third time, again without a question.** The G2 fixes sub-phase took `plan.md` to 12,739 characters, and the review session trimmed it in four tries (5 calls) to get under 12,000. The first plan, at G1, was also 13,248 and was trimmed in three tries, as the budget intends. #9 §2 would spare the second.
3. **E1 ran as designed, and the review session came in under D25's median for the first time on D26.** All five fixes went in one sub-phase through `build 47 amend` ($0.35) and one narrow re-review ($0.16). The review session's main thread was $1.32 to the ready note, against #45's $1.91, #46's $2.60 and the median of $1.85.
4. **G2 took one turn.** The report gave seven decisions, each with a recommendation, including two rule files' rewordings for the owner's approval and a follow-up issue, and the owner answered "All as recommended". #52 (a shared speech bubble and link class before 6.3) was opened by the review session.
5. **E6 and E7 held.** ADR-011's amendment came with a drafted guardrails check, approved at G2 after the red-team reworded it. The builder made no browser calls; `ui-check` ran once and saved its screenshots this time.
6. **The Vercel bot's comment woke the main session after the build, for the third run in a row.** Auto-fix was already off. It cost $0.13 and no owner turn.
7. **C6:** the surveyor ran for $0.28, though the issue named `other-work.md` and `site-footer.tsx`. The section component was new.
8. **The close was clean,** and the session recorded 4.3 as done and 4.4 #48 as next in its project memory.

### ThisIsMatheusCastro #52 Phase 4.5: Calvo speaks in every section (Standard), PR #55

An extra phase before Milestone 1, widened from #47's follow-up: a shared speech bubble and shared class constants (no visual change), then a fixed line from Calvo in WhoAmI and the three project sections, read from `content/`.
- The issue asked for the lines to be drafted with the owner before `/scope`. They weren't, so `/scope` asked, proposed a drafting session, and resumed by itself when the lines were approved.
- During the build, GitHub Actions queued the PR's CI run and never started it (a GitHub incident). The forked builder polled for 55 minutes. The owner interrupted the main session, which pushed an empty commit at their request, and the builder finally got a run by closing and reopening the draft PR.
- At G2 the owner took all four recommendations; the doc fixes were made in the session. Lighthouse then failed on the new head and on `main`, and the owner sent it to #56.

The diff is 23 files, +283 / −82, in 6 commits.

| Block | Transcript | Model | Calls | Context: first → peak | Time | Cost |
|---|---|---|---|---|---|---|
| A `/scope`, stopped for the lines, and the drafting proposal | e3d7e3f9 | Opus 5.5 | 11 | 79k → 97k | 1 min, 1 dialog | $0.62 |
| The drafting session, proposed by `/scope` | 8989cf7d | Opus 5.5 | 12 | 79k → 108k | 5 min, 2 dialogs and a plan accept | $0.92 |
| A, resumed after the draft: G1 and the plan | e3d7e3f9 | Opus 5.5 | 23 | 98k → 153k | 7 min, 1 dialog (4 decisions) and the accept | $1.63 |
| B: "continue 52", the main session | 79b055bf | Opus 5.5 | 5 | 75k → 80k | | $0.30 |
| B `build`: the forked builder, sub-phases 1–4 and the handoff | 79b055bf/subagents | Sonnet 5.5 | 71, 16 of them in the browser pane | 58k → 142k | 14 min | $1.63 |
| The builder waits on the stuck CI run | 79b055bf/subagents | Sonnet 5.5 | 19 | → 169k | 55 min | $2.68 |
| The owner's turns about CI, in the interrupted main session | c8142b3a | Opus 5.5 | 20 | 80k → 93k | 12 min, 3 turns | $0.64 |
| The Vercel bot's comment wakes the main session | 79b055bf | Opus 5.5 | 2 | → 83k | under 1 min | $0.08 |
| C `review` to the G2 report | c42cd992 | Opus 5.5 | 12, plus 26 red-team (Opus, $1.15) and 74 `ui-check` (Sonnet, $1.86) | 78k → 110k | 15 min | $3.87 |
| C: the G2 fixes in the session, the narrow re-review and CI | c42cd992 | Opus 5.5 | 20, plus 8 red-team (Opus, $0.25) | → 131k | 10 min | $1.08 |
| C: #56, the known failure and the ready-to-merge note | c42cd992 | Opus 5.5 | 6 | → 137k | 1 min | $0.28 |
| `/close 52` | c42cd992 | Opus 5.5 | 7 | → 147k | under 1 min | $0.39 |
| **Total** | | | | | ≈ 2 h 40 min | **$14.12** |

The main session's build turn was interrupted while the forked builder ran, and the session went on in two transcripts that share their first call. `runs.js` counts that call ($0.19) in both, so it reports $14.31 (R14-7). The table counts it once.

**Against the targets:**
- **Owner turns:** 16. Five were drafting (`/scope`'s question about the missing lines, starting the session from its card, two dialogs and the plan accept), and three were the stuck CI ("CI seems to be stuck", "Yes, re-run it", "Push an empty commit"). The other 8 were `/scope`, the G1 dialog, the G1 accept, "continue 52", `/review`, "All as recommended", the Lighthouse decision and `/close`.
- **Context:** met. The main peak was 153k, at G1. The builder peaked at 169k while it polled, and `ui-check` at 189k.
- **Cost:** $14.12. Without the drafting ($0.92) and the stuck CI ($3.32: the builder's wait and the owner's turns about it), $9.88, against D25 Standard's median of $8.32. By block, on that path:
  - plan $2.25 (median $2.21);
  - build $2.01 (median $2.14), of which the builder's look in the browser pane was $0.30;
  - review to G2 $3.87 (the red-team $1.15 and `ui-check` $1.86);
  - the G2 fixes, the re-review and ready $1.36;
  - close $0.39.
- **Quality:**
  - The red-team found 2: two docs still gave Calvo's old 80px drop, and the file tree missed the new files (8); and the bubble, sized in rem above a drop in px, can cover InvoiceMe's head at a default font of 20px or more (6). The first was fixed in the session; for the second the owner took the recommendation, a note in `calvo-stories.md` to re-measure the drop for a longer line.
  - `ui-check` passed all six checks.
  - The narrow re-review found nothing.
  - **Escapes** are tracked to 2026-12-11.

**Findings:**
1. **Drafting again needed a side session, and cost less than #45's** (#9 §1). The issue said the lines would be drafted before `/scope`, but nothing started that. `/scope` found no approved file, asked, and proposed a drafting session. The owner started it from the card, and `/scope` resumed by itself once the lines were approved. The drafting ran in plan mode again, for $0.92 and 5 turns, against #45's $2.32 and 7. `/draft <n>` would have started here.
2. **When CI stuck, the forked builder spent $2.68 and 55 minutes polling** (R14-6). The PR's run sat queued with no jobs during a GitHub incident. The builder polled in Bash loops of 7–10 minutes, each longer than the cache lasts, so each wake cached the whole context again as it grew to 169k. It then cancelled and re-ran both runs, and closed and reopened the draft PR, which started a run that passed. `build` has no rule for CI that never starts.
3. **The owner interrupted the main session, and two writers worked on one branch.** While the builder was still running, the owner asked the main session about CI. It checked GitHub's status, couldn't cancel or re-run the stuck run, and at the owner's request pushed an empty commit (`dc30d6e`) to the branch. The builder found the new head and waited on it instead. Nothing collided, but nothing kept them apart. The build's result reached the main session 45 minutes later, in a second transcript (R14-7).
4. **The builder's look in the browser pane grew, and `ui-check` came close to the ceiling** (R14-8). The builder made 16 browser calls ($0.30) against #46's 6, at two widths with screenshots, and `ui-check` repeated it all in review. `ui-check` peaked at 189k, its highest yet, against the 200k ceiling.
5. **E9 ran for the first time.** Lighthouse's blocking time failed twice on the G2 fixes' head, which only changed docs, and has failed on `main` since #46. The review session gave three options; the owner chose a follow-up (#56, with two approaches of their own) and the ready note, and the session wrote the failure to `known-failures.md`. #46's G2 had declined the same failure without an issue.
6. **The G2 fixes stayed in the session, as E1 allows,** and took one narrow re-review. G2 took one reply ("All as recommended").
7. **G1's plan was trimmed under its budget in five tries** (13,378 characters to 11,982), 6 calls. The budget held without a question.
8. **C6 held:** the issue named its files, and the surveyor didn't run. E11's fetch ran first.
9. **The Vercel bot's comment woke the main session after the build, for the fourth run in a row** ($0.08).

### ThisIsMatheusCastro #53 Phase 4.6: Harnesses bust look (Small), PR #57

The Harnesses bust gets the full body's white jacket and harness, and the headphones from #12. An issue comment from the owner added three green `$` on InvoiceMe's invoice, which grows every full body to 40x60.
- The issue asked for the art to be co-drafted during scoping, before G1, so `/scope` drafted it in the session. The first rendering didn't show for the owner and was redrawn as a static image.
- `/scope` ran the build on the Small tier. The builder wrote the handoff as BLOCKED, because Lighthouse failed, though #56 already tracked that failure. The owner said to treat it as known and run the review.
- A usage limit stopped the red-team and `ui-check` mid-run. After 54 minutes the session resumed both. G2 found nothing, and the owner had the PR marked ready.

The diff is 6 files, +196 / −55, in 1 commit.

| Block | Transcript | Model | Calls | Context: first → peak | Time | Cost |
|---|---|---|---|---|---|---|
| A `/scope`: reading, and the first draft, rendered in a widget | 94839708 | Opus 5.5 | 17 | 79k → 148k | 4 min | $1.56 |
| A: G1's dialog, the draft redrawn, and the second dialog | 94839708 | Opus 5.5 | 6 | 152k → 173k | 3 min, 2 dialogs (4 decisions) | $0.65 |
| A: the plan and the G1 accept | 94839708 | Opus 5.5 | 8 | 174k → 191k | 6 min | $0.67 |
| B `build`: the forked builder, one sub-phase | 94839708 and its subagent | Opus 5.5 and Sonnet 5.5 | 1, plus 43 builder ($1.14), no browser calls | 58k → 141k | 17 min | $1.22 |
| The BLOCKED handoff: Auto-fix off, the question, and the Vercel bot's comment | 94839708 | Opus 5.5 | 6 | 197k → 203k | 1 min | $0.35 |
| C `review` to the G2 report, with the usage limit's pause | 94839708 | Opus 5.5 | 14, plus 15 red-team (Opus, $0.72) and 33 `ui-check` (Sonnet, $0.74) | 203k → 229k | 4 min, then 54 min paused | $2.44 |
| C: the ready-to-merge note | 94839708 | Opus 5.5 | 3 | → 231k | under 1 min | $0.16 |
| `/close 53` | 94839708 | Opus 5.5 | 6 | → 238k | under 1 min | $0.41 |
| **Total** | | | | | ≈ 1 h 55 min, 54 min of it paused | **$7.45** |

**Against the targets:**
- **Owner turns:** 8, against Small's 6. Three were off the planned path: the second dialog after the rendering failed, "Yes, run review" for the blocked handoff, and the message after the usage limit. The other 5 were `/scope`, G1's dialog, the G1 accept, "Yes, mark ready" and `/close`.
- **Context:** **missed,** the first D26 run over the limit. The main session peaked at 238k, and 25 of its calls were over 200k, everything from the build's return on (finding 1).
- **Cost:** $7.45. Without the blocked handoff ($0.35), $7.10, against D25 Small (code)'s median of $3.99 (a median of +187 lines, against #53's +196). By block:
  - plan $2.88 (median $1.33), with the drafting in it;
  - build $1.22 (median $0.56);
  - review to G2 $2.44 (median $1.55);
  - ready and close $0.57.
- **Quality:**
  - The red-team found nothing to fix.
  - `ui-check` passed all 5 checks.
  - **Escapes** are tracked to 2026-12-11.

**Findings:**
1. **The art was drafted inside `/scope`, and the Small session went over 200k.** The issue asked for drafting "during scoping, before G1", as ThisIsMatheusCastro's own project memory says pixel art is drafted, a note from before D26's E4. Drafting took `/scope` from 79k to 191k by G1. On Small the build, the review and the close all follow in the same session, so everything from the build's return was over 200k, up to 238k. #9 §1 would take the drafting out (`/draft`, then `/clear`, then `/scope`). When it ships, the owner may want to update that memory note.
2. **The first draft didn't render for the owner.** The session drew it in an inline widget, and the owner answered G1's first question with "Visuals did not render correctly". It was redrawn as a static image and approved in a second dialog. #9 §1 drafts in the browser pane instead.
3. **The handoff was BLOCKED on a failure #56 already tracked, and the review needed an owner turn** (R14-9). Lighthouse's blocking time failed on the head, as it has on `main` since #46. The builder wrote "CI on that head: fail" because a job failed, though only the four required jobs passed or failed the handoff (E5), and #52's `known-failures.md` entry didn't carry over: the file is kept per issue. On Small, `review` is meant to start with no owner turn (D25 C2); here it took "Yes, run review". The review session then wrote #53's own `known-failures.md` and set the handoff to READY.
4. **A usage limit paused the review for 54 minutes.** The red-team and `ui-check` stopped mid-run, and the session resumed both by message when the owner came back. The cache held, so resuming cost little ($0.06 for the first call). It cost one owner turn and isn't a harness issue.
5. **The tier was asked at G1, not stated in the plan** (E8). `/scope 53` had no `small`, and the first dialog asked "Which tier?" with Small recommended. E8 says a recheck that lowers the tier goes in the plan with its reason. It cost no extra turn, since it shared the dialog.
6. **`/scope` read the issue's comments and planned the owner's added scope,** the `$$$` on InvoiceMe's full body, though the issue's out-of-scope list excluded full-body changes. G1 confirmed it.
7. **E7, E2, E11 and C6 held.** The builder made no browser calls, and `ui-check` ran once (33 calls, $0.74). Auto-fix was turned off after the build, and the Vercel bot's comment still woke the session (the fifth run in a row). `git fetch` ran first. The issue named its files, and the surveyor didn't run.
8. **G2 with nothing to decide still asked before marking the PR ready** ("Yes, mark ready"). That turn is G2's approval, so it's on the planned path.

### ThisIsMatheusCastro #54 Phase 4.7 (Small, Extra), PR #58

A badge in WhoAmI, read from `whoami.md`, for a credential the page had only mentioned in passing. The wording and placement were G1 decisions.
- `/scope 54 small` asked one dialog, with previews of each placement, and wrote an 8k-character plan in one sub-phase.
- The build ran clean, and the handoff passed on the four required jobs while Lighthouse failed (#56).
- `review` started with no owner turn. G2 found nothing to fix, and the owner answered both of its questions in one reply.

The diff is 9 files, +31 / −7, in 1 commit.

| Block | Transcript | Model | Calls | Context: first → peak | Time | Cost |
|---|---|---|---|---|---|---|
| A `/scope` to G1 | a54f882e | Opus 5.5 | 19 | 79k → 114k | 5 min, 1 dialog (4 decisions) and the accept | $1.10 |
| B `build`: the forked builder, one sub-phase | a54f882e and its subagent | Opus 5.5 and Sonnet 5.5 | 1, plus 20 builder ($0.46), no browser calls | 58k → 89k | 7 min | $0.49 |
| C `review` to the G2 report | a54f882e | Opus 5.5 | 11, plus 10 red-team (Opus, $0.37) and 22 `ui-check` (Sonnet, $0.42) | 116k → 137k | 4 min | $1.33 |
| The Vercel bot's comment wakes the session, during review | a54f882e | Opus 5.5 | 3 | → 129k | under 1 min | $0.11 |
| C: the known failure and the ready-to-merge note | a54f882e | Opus 5.5 | 5 | → 140k | under 1 min | $0.19 |
| `/close 54` | a54f882e | Opus 5.5 | 5 | → 148k | under 1 min | $0.24 |
| **Total** | | | | | ≈ 20 min | **$3.46** |

**Against the targets:**
- **Owner turns:** 5, within Small's 6: `/scope`, the G1 dialog, the G1 accept, "1, 2 yes" and `/close`.
- **Context:** met. The peak was 148k, at `/close`.
- **Cost:** $3.46, against D25 Small (code)'s median of $3.99 (a median of +187 lines, against #54's +31). Every block came in under the D25 median:
  - plan $1.10 (median $1.33);
  - build $0.49 (median $0.56);
  - review to G2 $1.33 (median $1.55);
  - ready and close $0.43.
- **Quality:**
  - The red-team found nothing to fix.
  - `ui-check` passed all 4 checks, at desktop width and 375px.
  - **Escapes** are tracked to 2026-12-11.

**Findings:**
1. **The first D26 run to meet every target.** It's a small change, but it ran the whole Small flow in one session with no question off the planned path, and every block came in under D25's median.
2. **E5 held in the builder this time.** Lighthouse failed as it has since #46, and the builder wrote the handoff READY on the four required jobs, unlike #53. With no repo-level known failures yet (#9 §10), the review session again wrote #54's own `known-failures.md` pointing at #56. That cost no turn.
3. **G1 put four decisions in one dialog, with previews** of each placement and wording, so the owner chose by looking. Two of the decisions were for later issues (4.4's metadata) and were recorded in the plan and the project's memory.
4. **C2 held:** on Small, `review` started with no owner turn once the build returned.
5. **E7, E11 and C6 held.** The builder made no browser calls, and `ui-check` ran once (22 calls, $0.42). `git fetch` ran first. The issue named its files, and the surveyor didn't run.
6. **The Vercel bot's comment woke the session mid-review, for the sixth run in a row** ($0.11). Auto-fix was off.

### ThisIsMatheusCastro #56 Lighthouse: Total Blocking Time over the 200 ms budget since #46 (Small), PR #59

The follow-up #52's G2 opened: Lighthouse's blocking-time assertion had failed on `main` since #46. G1 showed that the unchanged coming-soon page swung from 95 to 1,820 ms on GitHub's runners, so no code fix alone would make the job reliably green. The owner chose the recommendation: blocking time and the performance score become warnings, and Lighthouse runs 5 times.
- `/scope 56` asked one dialog (3 decisions) and wrote an 8k-character plan in one sub-phase.
- The build ran clean, with every CI job passing. There was no UI sub-phase, so `review` ran the red-team alone.
- G2 found one optional doc fix, which the owner took. It was made in the session, re-reviewed, and the PR was marked ready once CI passed.

The diff is 2 files, +13 / −12, in 2 commits.

| Block | Transcript | Model | Calls | Context: first → peak | Time | Cost |
|---|---|---|---|---|---|---|
| A `/scope` to G1 | cdf2cfae | Opus 5.5 | 17 | 79k → 120k | 6 min, 1 dialog (3 decisions) and the accept | $1.19 |
| B `build`: the forked builder, one sub-phase | cdf2cfae and its subagent | Opus 5.5 and Sonnet 5.5 | 1, plus 13 builder ($0.35) | 58k → 78k | 10 min | $0.38 |
| C `review` to the G2 report | cdf2cfae | Opus 5.5 | 11, plus 9 red-team (Opus, $0.30) | 121k → 135k | 2 min | $0.79 |
| C: the doc fix in the session, the narrow re-review, CI and the ready-to-merge note | cdf2cfae | Opus 5.5 | 13, plus 3 red-team (Opus, $0.11) | → 144k | 5 min | $0.61 |
| `/close 56` | cdf2cfae | Opus 5.5 | 5 | → 153k | under 1 min | $0.27 |
| **Total** | | | | | ≈ 25 min | **$3.24** |

**Against the targets:**
- **Owner turns:** 5, within Small's 6: `/scope`, the G1 dialog, the G1 accept, "1 fix" and `/close`.
- **Context:** met. The peak was 153k, at `/close`.
- **Cost:** $3.24, against D25 Small (code)'s median of $3.99. Every block came in under the D25 median:
  - plan $1.19 (median $1.33);
  - build $0.38 (median $0.56);
  - review to G2 $0.79 (median $1.55);
  - the fix, the re-review and ready $0.61;
  - close $0.27.
- **Quality:**
  - The red-team found one optional doc line (a sentence still said a missed budget turns the job red), fixed in the session; the narrow re-review found nothing.
  - **Escapes** are tracked to 2026-12-11.

**Findings:**
1. **The second D26 run in a row to meet every target,** in one 25-minute session with nothing off the planned path.
2. **The known Lighthouse failure is gone.** It had failed since #46 and touched #46, #52, #53 and #54. G1 brought the evidence for the decision (the unchanged page's swing on the runners) rather than a guess. #9 §10 still matters for the next failure an issue tracks.
3. **The tier was asked at G1 again** (E8, as on #53). `/scope 56` had no `small`, and the dialog asked "Tier" with Small recommended. It shared the dialog, so it cost no turn. If it recurs, it's a candidate.
4. **No UI sub-phase, so no `ui-check`** (E7): the review briefed the red-team alone.
5. **The review session waited without owner turns.** It ended its turn while the red-team ran, and twice more while the re-review and CI ran; each background result started it again. It marked the PR ready on its own once CI passed.
6. **E11 and C6 held:** `git fetch` ran first, and the surveyor didn't run. The Vercel bot's comment didn't wake the session this time.

## Candidates for the next pass

| # | From | Candidate |
|---|---|---|
| R14-1 | #45 finding 1 | Drafting gets its own skill, which every issue starts with: `/draft <n>`. Taken by the owner, in ProdHarnessConfig#9 |
| R14-2 | #45 finding 4 | When a plan amendment (`build <n> amend`) takes `plan.md` over its budget, condense the done sub-phases to their commits and the issue comment, without a question. The budget is for G1's plan. Taken by the owner, in ProdHarnessConfig#9 |
| R14-3 | #45 finding 5 | After a commit in the main session at the owner's request, the session waits for CI on that head and updates the handoff, as `build` does, rather than ending its turn with CI pending. Taken by the owner, in ProdHarnessConfig#9 |
| R14-4 | #45, the Runs note | `runs.js`: place a forked skill's subagent, which records no `toolUseId`, by the main-session phase at its first call, so the G2 fixes' builder counts in review. Taken by the owner, in ProdHarnessConfig#9 |
| R14-5 | #46 finding 8 | `docs-gate`'s message says to write the `stale-docs.md` acknowledgement in its own call before the commit, because the hook checks the command before it runs. Taken by the owner, in ProdHarnessConfig#9 |
| R14-6 | #52 finding 2 | When the required CI hasn't started some minutes after a push (queued, no jobs), `build` stops polling: it writes the handoff as blocked on CI and returns with a `MAIN SESSION:` line, so the owner decides what to do. Any wait it keeps stays within the cache's lifetime. Taken by the owner, in ProdHarnessConfig#9 |
| R14-7 | #52, the Runs note | `runs.js` counts an API call once per run, even when two of the run's transcripts both hold it (a session that went on in two transcripts). Taken by the owner, in ProdHarnessConfig#9 |
| R14-8 | #52 finding 4, #46 finding 4 | `build` doesn't use the browser pane; looking at the page is `ui-check`'s, in review. Taken by the owner, in ProdHarnessConfig#9 |
| R14-9 | #53 finding 3 | A failure an open issue already tracks doesn't block later issues. `build` writes the handoff READY when every required job passes, and names a failing job that isn't required. Known failures live at the repo level, each with its issue, and drop out when that issue closes. Taken by the owner, in ProdHarnessConfig#9 |
| R14-10 | The owner, after #53 | A ProdHarnessConfig skill, `/trail <repo> <n>`, records a finished run: it collects the issue, PR and transcripts and prices the blocks; annotates `runs.json` and the validation log; evaluates the run against the decision's changes and targets and proposes candidates; then tests, commits without pushing and reports. Taken by the owner, in ProdHarnessConfig#9 |
