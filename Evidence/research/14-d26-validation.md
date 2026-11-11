# R14: Validating D26

Started 2026-11-11. This is the log of the runs after D26, judged against [research/13](13-d25-meta-analysis.md) §9–10. Every run is priced by [scripts/runs.js](scripts/runs.js) from [scripts/runs.json](scripts/runs.json), at list price. The transcripts stay out of git. The owner's observations from these runs, and the harness changes they lead to, are collected in ProdHarnessConfig#9.

## Criteria tracker

The targets stay as research/13 §10 set them: Standard median ≤ $7.49 and ≤ 7 owner turns, Small ≤ 6 turns, peak ≤ 200k. They're judged again once E1 and E4 have run on enough issues.

| Change | What counts | Runs so far |
|---|---|---|
| E1 | G2 fixes, and new scope after the build, go through `build <n> amend` on the forked builder; typos and one-line doc fixes stay in the session | **#45: met, twice.** The owner's layout changes after the build went in as sub-phase 5 ($0.76 builder), and the G2 fixes as sub-phase 6 ($0.47 builder), each followed by the narrow re-review. The review session still cost $1.91, against D25 Standard's median of $1.85 (finding 3) |
| E2 | Auto-fix off after each push and before the ready-to-merge note | **#45: met.** It was already off at each check; `set_monitor` wasn't needed |
| E4 | Content, art or design drafted before `/scope`, ending in an approved file | **#45: met, in a side session that `/scope` proposed.** `/scope` peaked at 162k, against #34's 230k. Drafting was 25 calls and $2.32, and 7 owner turns (finding 1) |
| E5 | The handoff checks the required CI jobs by name | **#45: met.** Lighthouse failed on one head and isn't required; the handoff passed on the four required jobs, and G2 said Lighthouse failed |
| E6 | The plan covers what G1 adds | **#45: doesn't apply.** No item deferred at G1, no new rule, and ADR-010 only changed status |
| E7 | The UI check runs on `ui-check` in `review`, not in the builder | **#45: met.** 42 calls, $0.83, 13 of 13 checks passed, at a 112k peak. The builder ran no UI check and peaked at 158k |
| E8 | Fewer questions | **#45: met for the tier recheck,** which went in the plan ("confirmed Standard"). G1 still took three dialogs, the third after the draft (finding 2) |
| E9 | `check-gate` reports a known failure, blocks on anything else | **#45: doesn't apply** |
| E11 | `scope` warns when the checkout is stale | **#45: met.** `git fetch` and `git status -sb` ran first; the checkout was current |
| C6 | The surveyor is off when the issue names its files | **#45: ran** ($0.24). The issue named its content files but not the code; the section's components were new |
| Targets | See above | **#45** missed cost ($14.30) and turns (23), and met peak (162k; the builder 158k). On the planned path, without the drafting session ($2.32, 7 turns) and the owner's changes after the build ($2.82, 5 turns), $9.15 and 11 turns |

## Log

| Issue | Repo | Config | Tier | Findings by source | Owner turns | Cost | Notes |
|---|---|---|---|---|---|---|---|
| #45 | ThisIsMatheusCastro | D26 | Standard | `red-team` 2 (8, 7), fixed through `build 45 amend`; 1 adjacent (3), a correcting comment on the issue; `ui-check` 13 of 13 pass; the re-review 1 (stale doc lines left by fix 1), noted on Epic #44 for its close | 23 (11 on the planned path) | $14.30 | The first D26 run. The silhouette was drafted in a side session; the owner's layout changes after the build went through `build amend`. See Runs |

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

## Candidates for the next pass

| # | From | Candidate |
|---|---|---|
| R14-1 | #45 finding 1 | Drafting gets its own skill, which every issue starts with: `/draft <n>`. Taken by the owner, in ProdHarnessConfig#9 |
| R14-2 | #45 finding 4 | When a plan amendment (`build <n> amend`) takes `plan.md` over its budget, condense the done sub-phases to their commits and the issue comment, without a question. The budget is for G1's plan |
| R14-3 | #45 finding 5 | After a commit in the main session at the owner's request, the session waits for CI on that head and updates the handoff, as `build` does, rather than ending its turn with CI pending |
| R14-4 | #45, the Runs note | `runs.js`: place a forked skill's subagent, which records no `toolUseId`, by the main-session phase at its first call, so the G2 fixes' builder counts in review |
