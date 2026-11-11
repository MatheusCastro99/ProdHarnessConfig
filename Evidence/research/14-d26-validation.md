# R14: Validating D26

Started 2026-11-11. This is the log of the runs after D26, judged against [research/13](13-d25-meta-analysis.md) §9–10. Every run is priced by [scripts/runs.js](scripts/runs.js) from [scripts/runs.json](scripts/runs.json), at list price. The transcripts stay out of git. The owner's observations from these runs, and the harness changes they lead to, are collected in ProdHarnessConfig#9.

## Criteria tracker

The targets stay as research/13 §10 set them: Standard median ≤ $7.49 and ≤ 7 owner turns, Small ≤ 6 turns, peak ≤ 200k. They're judged again once E1 and E4 have run on enough issues.

| Change | What counts | Runs so far |
|---|---|---|
| E1 | G2 fixes, and new scope after the build, go through `build <n> amend` on the forked builder; typos and one-line doc fixes stay in the session | **#45: met, twice.** The owner's layout changes after the build went in as sub-phase 5 ($0.76 builder), and the G2 fixes as sub-phase 6 ($0.47 builder), each followed by the narrow re-review. The review session still cost $1.91, against D25 Standard's median of $1.85 (finding 3). **#46: met for G2, missed for the owner's tweak.** The owner's G2 finding went in as sub-phase 6 ($0.35 builder); the doc line and the re-review's one-character bug stayed in the session. The owner's tweak after the build went in the main session, which left the handoff behind the head (#46 finding 1) |
| E2 | Auto-fix off after each push and before the ready-to-merge note | **#45: met.** It was already off at each check; `set_monitor` wasn't needed. **#46: met.** The main session turned it off after the build; one Vercel bot event still arrived just after, and needed no change |
| E4 | Content, art or design drafted before `/scope`, ending in an approved file | **#45: met, in a side session that `/scope` proposed.** `/scope` peaked at 162k, against #34's 230k. Drafting was 25 calls and $2.32, and 7 owner turns (finding 1). **#46: doesn't apply.** Calvo's sprite was approved in #34, and `/scope` went straight to G1 |
| E5 | The handoff checks the required CI jobs by name | **#45: met.** Lighthouse failed on one head and isn't required; the handoff passed on the four required jobs, and G2 said Lighthouse failed. **#46: met.** Lighthouse failed on the first two heads; G2 reported it, and the owner declined it (#46 finding 5) |
| E6 | The plan covers what G1 adds | **#45: doesn't apply.** No item deferred at G1, no new rule, and ADR-010 only changed status. **#46: met.** The story rule G1 reworded was checked against all 9 stories, and the four doc items landed as worded |
| E7 | The UI check runs on `ui-check` in `review`, not in the builder | **#45: met.** 42 calls, $0.83, 13 of 13 checks passed, at a 112k peak. The builder ran no UI check and peaked at 158k. **#46: met, with a look in the builder.** `ui-check` ran twice (77 calls, $1.75, a 168k peak) and caught the builder's bug with the red-team. The builder still looked at the page in the browser pane (6 calls, $0.08) (#46 finding 4) |
| E8 | Fewer questions | **#45: met for the tier recheck,** which went in the plan ("confirmed Standard"). G1 still took three dialogs, the third after the draft (finding 2). **#46: met.** No tier question; G1 took two dialogs (7 decisions) |
| E9 | `check-gate` reports a known failure, blocks on anything else | **#45: doesn't apply.** **#46: doesn't apply** |
| E11 | `scope` warns when the checkout is stale | **#45: met.** `git fetch` and `git status -sb` ran first; the checkout was current. **#46: met,** the same |
| C6 | The surveyor is off when the issue names its files | **#45: ran** ($0.24). The issue named its content files but not the code; the section's components were new. **#46: ran** ($0.34), for the same reason |
| Targets | See above | **#45** missed cost ($14.30) and turns (23), and met peak (162k; the builder 158k). On the planned path, without the drafting session ($2.32, 7 turns) and the owner's changes after the build ($2.82, 5 turns), $9.15 and 11 turns. **#46** missed cost ($10.61) and turns (11), and met peak (157k; `ui-check` 168k). On the planned path, without the owner's tweak and the stale handoff it left ($1.91, 2 turns), $8.70 and 9 turns |

## Log

| Issue | Repo | Config | Tier | Findings by source | Owner turns | Cost | Notes |
|---|---|---|---|---|---|---|---|
| #45 | ThisIsMatheusCastro | D26 | Standard | `red-team` 2 (8, 7), fixed through `build 45 amend`; 1 adjacent (3), a correcting comment on the issue; `ui-check` 13 of 13 pass; the re-review 1 (stale doc lines left by fix 1), noted on Epic #44 for its close | 23 (11 on the planned path) | $14.30 | The first D26 run. The silhouette was drafted in a side session; the owner's layout changes after the build went through `build amend`. See Runs |
| #46 | ThisIsMatheusCastro | D26 | Standard | `red-team` 2 (8, 8): blocking time, declined by the owner; a stale doc line, fixed in the session. `ui-check` 1 (2), declined. The owner's own 1, through `build 46 amend`. The re-review 2 (12, 4), both fixed in the session | 11 (9 on the planned path) | $10.61 | Nothing to draft. The owner's tweak after the build went in the main session and left the handoff stale. See Runs |

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

## Candidates for the next pass

| # | From | Candidate |
|---|---|---|
| R14-1 | #45 finding 1 | Drafting gets its own skill, which every issue starts with: `/draft <n>`. Taken by the owner, in ProdHarnessConfig#9 |
| R14-2 | #45 finding 4 | When a plan amendment (`build <n> amend`) takes `plan.md` over its budget, condense the done sub-phases to their commits and the issue comment, without a question. The budget is for G1's plan. Taken by the owner, in ProdHarnessConfig#9 |
| R14-3 | #45 finding 5 | After a commit in the main session at the owner's request, the session waits for CI on that head and updates the handoff, as `build` does, rather than ending its turn with CI pending. Taken by the owner, in ProdHarnessConfig#9 |
| R14-4 | #45, the Runs note | `runs.js`: place a forked skill's subagent, which records no `toolUseId`, by the main-session phase at its first call, so the G2 fixes' builder counts in review. Taken by the owner, in ProdHarnessConfig#9 |
| R14-5 | #46 finding 8 | `docs-gate`'s message says to write the `stale-docs.md` acknowledgement in its own call before the commit, because the hook checks the command before it runs |
