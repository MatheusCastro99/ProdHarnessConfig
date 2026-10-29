# R12: Validating D25

Started 2026-10-29. This is the log of the runs after D25, judged against [research/11 §12](11-meta-analysis.md#12-validating-d25). Every run is priced by [scripts/runs.js](scripts/runs.js) from [scripts/runs.json](scripts/runs.json), at list price. The transcripts stay out of git. This log also carries on the trial log of [research/10](10-trials.md).

## Criteria tracker

| Change | What counts | Runs so far |
|---|---|---|
| C1 | A UI check in the builder, on throwaway data or read-only | none yet; #155 had no UI sub-phase |
| C2 | On Small, the fork ends with the plan's tier, and `review` starts without an owner turn | none yet (0 of 3) |
| C3 | After "continue <n>", `build` is the first or second call, with no owner turn | none yet (0 of 3). #155 doesn't count, because its build session ran on D24's files |
| C4 | Every InvoiceMe UI sub-phase names `frontend-design` | none yet |
| C5 | `scope` raises the tier when the G1 answers add work | none yet. #155's planning ran on D24's files |
| C8 | Numbered decisions, answered in one reply | **#155: met** (1 of 3). Both the G2 report and its addendum were answered in one reply |
| All | Standard: median ≤ $7.49 and ≤ 7 owner turns. Small: ≤ 6 turns. Peak ≤ 200k | #155 missed all three ($9.88, ≈ 13 turns, 254k), because of the rework after G2. On the planned path it met them: $5.12 with `/close`, 7 turns, 136k |

## Log

| Issue | Repo | Config | Tier | Trials fired | Findings by source | Owner turns | Cost | Notes |
|---|---|---|---|---|---|---|---|---|
| #155 | BabyBuddyHelper | D24/D25 | Standard | T1; **T4 fired** on both full reviews; T5, T6 and T7 don't apply | `red-team` 3 (6, 5, 5), all fixed; the owner's live check 1 root cause, fixed as sub-phase 4, and 1 rule mismatch, now #157; `reviewOnReady` 0 | ≈ 13 (7 on the planned path) | $9.88 | Plan and build on D24's files. The PR missed the bug; the owner's live check found it. See Runs |

## Runs

### BabyBuddyHelper #155 AI requests often fail in regular requests (Standard), PR #156

Cub, the app's AI helper, declined good replies. Each reply is checked by a second Haiku call (the grader) before the parent sees it, and the grader kept failing them.

**The plan,** from reading the code, was three sub-phases:
1. write the grader's verdict to the Debug output;
2. narrow the grader to clear breaks of rules that apply;
3. accept a PASS by its first word, in any case.

**What the owner's live checklist then showed:** the grader returned no text at all. Claude Haiku 5.5 thinks by default, and thinking tokens count against `max_tokens`, so the grade's 50-token cap went to thinking. A **fourth sub-phase**, built in the review session, sets thinking per call (off for the reply, low for the grade) and raises the grade cap to 1024.

The diff is 15 files, +185 / −49, in 6 commits.

| Block | Transcript | Model | Calls | Context: first → peak | Time | Cost |
|---|---|---|---|---|---|---|
| A `/scope` | 598e297c | Opus 5.5 | 19, no surveyor | 77k → 136k | 14 min, 7 of them the owner reading the plan | $1.58 |
| B: "continue 155", the main session | fea0e5dc | Opus 5.5 | 7 | 74k → 84k | 12 min | $0.40 |
| B `build`: the forked builder | fea0e5dc/subagents | Sonnet 5.5 | 29 | → 95k | (same) | $0.83 |
| C `/review` to ready-to-merge | c984af7b | Opus 5.5 | 25, plus 12 red-team (Opus, $0.62) | 76k → 112k | 17 min | $1.85 |
| C: the owner's checklist, sub-phase 4, a G2 addendum, its fixes, the follow-up #157 | c984af7b | Opus 5.5 | 56, plus 7 red-team ($0.45) | → 254k | 55 min, with two owner checklist runs | $4.75 |
| C `/close` | c984af7b | Opus 5.5 | 7 | → 254k | 1 min | $0.46 |
| **Total** | | | | | | **$9.88** |

**Against the targets:**
- **Cost:** $9.88, over $7.49. The planned path, through the first ready-to-merge note plus `/close`, cost $5.12. The rework was $4.75: $4.30 in the Opus main session, at 112k–254k of context, and $0.45 for the red-team.
- **Context:** the main session passed 200k on 47 calls, all after the first checklist report: the rework and `/close`. Before it, the peak was 136k.
- **Owner turns:** ≈ 13. The 7 on the planned path were:
  - `/scope`, the G1 answers (3 decisions) and the G1 accept;
  - "continue 155";
  - `/review`, "1 fix, 2 keep" and `/close`.

  The rework added 6:
  - the first checklist report;
  - "1: C 2 - 4: Recommended";
  - the answer on how a call says whether to think;
  - "1, 2 fix; 3 keep";
  - the second checklist report;
  - "Follow-up issue".
- **Quality:**
  - **The red-team** approved each commit. Its 3 findings (6, 5, 5) were all fixed, and the one re-review found nothing new.
  - **The PR missed the bug at first.** At the first ready-to-merge note, the PR didn't fix it. The owner's checklist, run with a real key, found the cause. The second run found one more decline, which is a mismatch between Cub's emergency rule and the checklist, not a bug in this PR. It is now #157.
  - **Escapes** are tracked to 2026-11-26.

**Findings:**
1. **Plan and build ran on D24's files.** The owner's checkout was still on `chore/92-epic-close`, which branched before D25's sync PR (#154) merged.
   - The `/scope` and "continue 155" sessions loaded the old `CLAUDE.md`: "the fork can't reach the app's tools", with no "continue <n>" rule.
   - The builder then branched from the updated `main` (`51072a4`), so the review session and the code ran on D25.
   - So #155 tells us nothing about C3 or C5. As in D24, "continue 155" read the plan first (call 2) and then invoked `build` (call 3), with no owner turn.
   - Nothing in the harness notices a stale checkout. The session-state hook could compare the branch with the default branch and say so before `/scope` (candidate R12-1).
2. **The plan fixed a hypothesis.** The issue's first step was to capture the grader's answer. The plan built that trace together with two fixes based on reading the code, and nobody ran the trace against the live API before G2.
   - The builder couldn't run it: that needs the owner's API key.
   - The red-team and CI checked the code against the plan, and the plan was wrong about the cause. So both approved a PR that didn't fix the bug.
   - The trace then made the real cause visible in one owner run, which shows sub-phase 1 was worth having.
   - **The cost:** $4.75, 6 owner turns, and the run's only context over 200k.
   - **Candidate R12-2:** when a bug can only be reproduced by the owner, G1 plans a "reproduce first" step. Either the owner runs the diagnosis before Block B, or the plan splits into a diagnosis issue and a fix issue.
3. **Sub-phase 4 was built in the Opus review session, not by the forked builder.**
   - It changed `ICubChatClient`, which the plan said wouldn't change. The session asked the owner first, as working agreement 4 requires, and the owner approved it.
   - But `review`'s step 5 covers "the approved fixes", and has no path for new scope. So the session wrote the new sub-phase itself, on Opus, at 112k–254k context.
   - For comparison, a whole forked Sonnet build cost $1.27–1.99 on the D24 Standard runs (research/11 §3), and this one $1.23 for three sub-phases.
   - **Candidate R12-3:** when G2 or an owner check adds a sub-phase, `review` amends the plan, runs `build` forked for it, and then reviews the new commits.
4. **C8 worked twice.** The G2 report ended with 2 numbered decisions, and the addendum with 3. Each got one reply: "1 fix, 2 keep" and "1, 2 fix; 3 keep". No question was asked twice.
5. **The CI reviewer didn't see sub-phase 4.**
   - `claude-code-review.yml` finished without reviewing it. It seems to skip a PR it has already commented on.
   - That makes 4 BabyBuddyHelper runs with 0 comments from it (#134, #133, #150, #155).
   - This goes to C11's look after the UI epic.
6. **T4 fired on both full reviews.** Neither found a silent failure. The grader already failed closed, and finding 1 of the addendum added a test that pins it for a cut-off, empty grade.

## Candidates for the next pass

Recorded here; not decided. They go to the mid-Epic-2 meta-analysis with the rest of the D25 runs.

| # | From | Candidate |
|---|---|---|
| R12-1 | #155 finding 1 | The session-state hook (or `scope` step 1) says so when the checkout isn't on an up-to-date default branch |
| R12-2 | #155 finding 2 | For a bug that only the owner can reproduce, plan a "reproduce first" step before Block B |
| R12-3 | #155 finding 3 | New scope found at G2 goes through a plan amendment and a forked `build`, not the review session |
