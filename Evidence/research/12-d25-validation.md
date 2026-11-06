# R12: Validating D25

Started 2026-10-29. This is the log of the runs after D25, judged against [research/11 §12](11-meta-analysis.md#12-validating-d25). Every run is priced by [scripts/runs.js](scripts/runs.js) from [scripts/runs.json](scripts/runs.json), at list price. The transcripts stay out of git. This log also carries on the trial log of [research/10](10-trials.md).

## Criteria tracker

| Change | What counts | Runs so far |
|---|---|---|
| C1 | A UI check in the builder, on throwaway data or read-only | **#140: met** for where it ran: in the builder, on throwaway data. But it cost $1.25, against D24's $0.51–0.77, and the builder passed 200k (259k). **#6 (ThisIsMatheusCastro): met** for a browser check that isn't UI: a read-only service check on the preview deploy, 3 calls, $0.04. **#12: met**, and on cost too: 16 calls, $0.36, on a local dev page, read-only; the builder peaked at 182k. No Small UI run yet |
| C2 | On Small, the fork ends with the plan's tier, and `review` starts without an owner turn | **#157 and #9: met** (2 of 3) |
| C3 | After "continue <n>", `build` is the first or second call, with no owner turn | **#140, #6 and #12: met** (3 of 3). #155 doesn't count, because its build session ran on D24's files; #157 was Small |
| C4 | Every InvoiceMe UI sub-phase names `frontend-design` | **#140: met**: "not needed, because the layout is unchanged…". On ThisIsMatheusCastro, which vendors it too, **#12: met**: sub-phase 1 used it for the five palettes and the type scale |
| C5 | `scope` raises the tier when the G1 answers add work | none yet. #155's planning ran on D24's files. On #157 the recheck ran the other way: the answers left one sub-phase, and `scope` recommended Small. #140, #6 and #12 were Standard from the start. On #9 the plan said Standard for one sub-phase, because Small's criteria exclude a dependency change, and the owner moved it to Small at the plan |
| C8 | Numbered decisions, answered in one reply | **#155, #157, #140, #6 and #12: met; #9: not met** (5 of 6). On #140, one of 7 decisions had no recommendation, so "As recommended" left it open. On #6, the re-review found a regression in a G2 fix, so G2 took a second numbered round (3 decisions, one reply). On #9 the owner's "Mark it ready" answered decision 1 of 2, and the session asked again about the second. On #12, one reply answered all 6, including a visual sign-off with a note |
| All | Standard: median ≤ $7.49 and ≤ 7 owner turns. Small: ≤ 6 turns. Peak ≤ 200k | **#155** missed all three ($9.88, ≈ 13 turns, 254k), because of the rework after G2. On the planned path it met them: $5.12 with `/close`, 7 turns, 136k. **#157** met cost and peak ($3.99, 154k) and missed Small's turns by one (≈ 7). **#140** missed all three ($10.02, ≈ 9 turns, the builder at 259k). It is the largest diff under the harness so far. **#6** met peak (167k; the builder 99k) and missed cost ($8.33) and turns (≈ 11). The review was 58% of its cost. **#9** met cost and peak ($2.44, 131k) and missed Small's turns by one (≈ 7). **#12**, counted to the first `/close`, met turns (7) and peak (136k; the builder 182k) and missed cost ($8.46). It is the first D25 Standard run to meet the turns target |

## Log

| Issue | Repo | Config | Tier | Trials fired | Findings by source | Owner turns | Cost | Notes |
|---|---|---|---|---|---|---|---|---|
| #155 | BabyBuddyHelper | D24/D25 | Standard | T1; **T4 fired** on both full reviews; T5, T6 and T7 don't apply | `red-team` 3 (6, 5, 5), all fixed; the owner's live check 1 root cause, fixed as sub-phase 4, and 1 rule mismatch, now #157; `reviewOnReady` 0 | ≈ 13 (7 on the planned path) | $9.88 | Plan and build on D24's files. The PR missed the bug; the owner's live check found it. See Runs |
| #157 | BabyBuddyHelper | D25 | Small (scoped as Standard; moved after G1) | T1; T4 skipped (a prompt-wording change); T5, T6 and T7 don't apply | `red-team` 1 (7), fixed; `reviewOnReady` 0 | ≈ 7 | $3.99 | The first full D25 run. The tier recheck moved it to Small, and the fork handed back with Small's line. See Runs |
| #140 | InvoiceMe | D25 | Standard | T1; **T4 fired**, 1 finding; **T6 fired** in the builder ($1.25); T7 not needed, with a reason; T5 skipped | `red-team` 1 (7), fixed; `red-team T4` 1 (7), half fixed, half declined; 3 older bugs to backlog #153 | ≈ 9 | $10.02 | 22 files, +815 / −316, and it also closed #145. Auto-fix turned itself back on twice. See Runs |
| #6 | ThisIsMatheusCastro | D25 | Standard | T1; **T4 fired**, 1 finding; **T5 fired for the first time** ($0.37), 0 findings; a browser check in the builder ($0.04); T7 doesn't apply | `red-team` 3 (9, 9, 7), fixed; `red-team T4` 1 (5), carried into Phase 5.1; the re-review 1 regression in a fix, fixed; `security-review T5` 0 | ≈ 11 | $8.33 | The first run on this project and stack (Next.js). The owner flagged the installed `Decisions.md` at G2. See Runs |
| #9 | ThisIsMatheusCastro | D25 | Small (planned as Standard; the owner moved it) | T1; T4 doesn't apply (no error handling), nor do T5, T6 and T7 | `red-team` 0; PR comment 0 (the Vercel bot) | ≈ 7 | $2.44 | #6's follow-up. The cheapest D25 run so far. See Runs |
| #12 | ThisIsMatheusCastro | D25 | Standard | T1; **T4 fired**, 1 finding; **T5 fired** ($0.39), 0 findings; **T6 fired** in the builder ($0.36); **T7 used** for the palettes | `red-team` 2 (7, 6): 1 fixed, 1 accepted as a deviation; `red-team T4` 1 (5), declined; 2 adjacent, 1 fixed and 1 carried to #13; `security-review T5` 0 | 7 (to the first `/close`) | $8.46 | Counted to the first `/close 12`, by the owner's call; the retries are left out ($0.72, 4 turns). See Runs |

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

### BabyBuddyHelper #157 Cub: emergencies get a FAIL grade, and the parent sees the generic message (Small), PR #160

#155's follow-up. Cub's emergency rule listed "a high fever in a baby under 3 months" with true emergencies, and checklist row 4 accepted "a doctor or emergency services". So the grader failed doctor-first replies. At G1 the owner chose:
- to name the threshold: 38 °C (100.4 °F) or more;
- to make the failed-grade retry note specific: lead with medical attention or emergency services;
- for row 4 to follow the rule.

The diff is 4 files, +7 / −4, in 2 commits: the change, and the G2 fix.

| Block | Transcript | Model | Calls | Context: first → peak | Time | Cost |
|---|---|---|---|---|---|---|
| A `/scope` | a37f976a | Opus 5.5 | 22, no surveyor | 73k → 120k | 8 min, with 3 rounds of questions | $1.41 |
| B `build`: the main session | a37f976a | Opus 5.5 | 4 | → 124k | 8 min | $0.14 |
| B `build`: the forked builder | a37f976a/subagents | Sonnet 5.5 | 15 | → 74k | (same) | $0.52 |
| C `review` to ready-to-merge, in the same session | a37f976a | Opus 5.5 | 25, plus 13 red-team over two runs (Opus, $0.52) | → 145k | 14 min | $1.55 |
| C `/close` | a37f976a | Opus 5.5 | 8 | → 154k | 1 min | $0.37 |
| **Total** | | | | | ≈ 32 min | **$3.99** |

**Against the targets:**
- **Cost:** $3.99. That is below D24's Small code median ($4.88) and above D22's docs median ($2.92) and the $3.08 Small target. Small code issues run nearer $4, as research/11 §2 found.
- **Context:** the peak was 154k at `/close`, and no call went over 200k.
- **Owner turns:** ≈ 7, one over Small's 6. They were:
  - `/scope 157`;
  - three rounds of G1 answers: the fix, which side changes, and the tier;
  - the G1 accept;
  - "Yes, fix 1";
  - `/close`.

  The second round came from the owner's own wording in the first answer. The third was the tier recheck.
- **Quality:**
  - The red-team approved, with 1 finding (7): the retry test compared the note with itself. It was fixed, and the re-review was clean.
  - `claude-code-review.yml` left no comments, as on every BabyBuddyHelper run. Copilot's review didn't run because the account is out of quota.
  - **Not yet checked:** the ready-to-merge note asked for a checklist run with a real key, to see whether row 4 now passes the grade. Like #155, the change is only proven live.
  - **Escapes** are tracked to 2026-12-02.

**Findings:**
1. **D25's Small path worked end to end.**
   - The fork ended with Small's line only: `MAIN SESSION: run the review skill for #157 now (Small tier, this session).`
   - The main session started `review` 1 minute later, with no owner turn.
   - On D24, all 3 Small runs slipped here (research/11 §8). C2 is met, 1 of 3.
2. **The tier recheck ran, and lowered the tier.**
   - The owner typed `/scope 157`, so the tier was Standard by default.
   - After the G1 answers, `scope` said the issue "now fits the Small tier: one sub-phase…" and asked. The owner chose Small.
   - C5 is about raising the tier, so this doesn't count toward it. It does show step 4's recheck firing.
   - **It cost one owner turn,** which is the one turn over Small's 6. The recheck can only come after the answers, but the plan's first line already states the tier, and the G1 accept approves it.
   - **Candidate R12-4:** when the recheck only confirms or lowers the tier, put it in the plan with its reason instead of a separate question. Ask separately only to raise it.
3. **G2 was one decision, answered in one reply** ("Yes, fix 1"). C8 is now 2 of 3.
4. **The live check is still the owner's.** As on #155, nothing the harness runs can call the real model. This change is to prompt wording, which only a live run proves. R12-2 covers planning that step; here it's correctly an owner step after the merge, and the ready-to-merge note says so.

### InvoiceMe #140 Money in integer cents, ADR-012 (Standard), PR #158

The second Schema issue under the harness. Every money amount in the database and the API is now integer cents (`subtotalCents`, `taxCents`, `finalPriceCents`, and the line items). `POST /invoices` and the tax endpoint compute every figure themselves, and the frontend converts through a new `money.js`.

Decided at G1, in two rounds:
- tax rates are stored as percents, with integer math;
- the fields are renamed with a `Cents` suffix;
- the server computes the figures;
- a bad line-item row is flagged and blocks the totals;
- the PR also closes #145, because strict parsing turns its `"12abc"` case into a 400.

The diff is 22 files, +815 / −316: the largest under the harness since the pilots.

| Block | Transcript | Model | Calls | Context: first → peak | Time | Cost |
|---|---|---|---|---|---|---|
| A `/scope` | 5204bd9d | Opus 5.5 | 20, plus 10 surveyor (Sonnet, $0.31) | 72k → 142k | 23 min, 2 rounds of questions | $2.38 |
| B: "continue 140", the main session, Auto-fix included | 96a3280c | Opus 5.5 | 9 | 75k → 89k | 20 min | $0.56 |
| B `build`: the forked builder | 96a3280c/subagents | Sonnet 5.5 | 69, of which 41 for the UI check ($1.25) | → **259k** | (same) | $2.41 |
| C `/review` to ready-to-merge | 756acf86 | Opus 5.5 | 28, plus 30 red-team over two runs (Opus, $1.57) | 71k → 121k | 21 min | $3.08 |
| C `/close` | 756acf86 | Opus 5.5 | 7 | → 133k | 1 min | $0.35 |
| **Total** | | | | | ≈ 66 min | **$10.02** |

**Against the targets:**
- **Cost:** $10.02, over $7.49. Each block cost more than a D24 Standard run's:
  - plan $2.38 (D24: $1.30–1.84);
  - build $2.97 (D24: $1.27–1.99);
  - review $3.08 (D24: $1.90–2.16).

  The diff is 2–4× D24's, and the PR took in #145. The red-team's first run also compared the client's input rules with the server's across 100,000 quantities and every rate from 0.000 to 100.000.
- **Context:** the main sessions stayed at 142k or below. **The builder reached 259k,** the first builder over 200k. D24's highest was 172k. The UI check came last, at 41 calls, on top of a long build.
- **Owner turns:** ≈ 9, two over 7. They were:
  - `/scope`, two rounds of G1 answers and the G1 accept;
  - "continue 140", and "Done, turned off" (finding 1);
  - `/review`, "As recommended" and `/close`.

  The second G1 round asked about the invalid-row behaviour and #145, which only came up after the first answers.
- **Quality:**
  - The red-team approved with 2 findings, both 7. Its 3 untracked fixes of #153 items were listed, and the toast now names the real cause; the retry was declined.
  - The re-review was clean.
  - InvoiceMe has no CI reviewer.
  - The toast fix was checked by `fast`, CI and the re-review, not in the browser, and the ready-to-merge note says so.
  - **Escapes** are tracked to 2026-12-02.

**Findings:**
1. **Auto-fix didn't stay off: the app turned it back on.** The sequence:
   - The PR opened in the build session, and the app turned on "Auto-fix pull requests" for that session.
   - The fork's `MAIN SESSION:` line asked to turn it off. The main session's `set_monitor` call was **denied by the auto-mode classifier** ("judged this action dangerous"). The session asked the owner, who switched it off ("Done, turned off", one owner turn), though `get_status` still read it as on a minute later.
   - In the review session, step 1 turned it off with `set_monitor`, and that call succeeded.
   - At the owner's G2 reply, the app reported Auto-fix enabled for that session again. The session noticed and **left it on**, "since it only matters if the PR changes again". `review` says it stays off from the handoff until the merge, and the G2 fix commits were pushed after that point.
   - No Auto-fix event woke the session, so nothing moved the head this time.
   - The Code tab has no setting for this default. The switch is per session, and the app sets it.
   - The same happened in the ProdHarnessConfig session that opened PR #5.
   - **Candidate R12-5:**
     - allow `mcp__ccd_pr__set_monitor` in the harness's `settings.json`, so turning it off isn't refused;
     - have `review` check Auto-fix again after each push and before the ready-to-merge note, and turn it off again if the app turned it on.
2. **C3 met:** after "continue 140", `build` was the first call after the app's task list, with no owner turn and no pre-read of the plan. This is the first D25 Standard run, and the D24 slip didn't recur.
3. **C1 met where it runs, not on cost.**
   - The UI check ran in the builder, on throwaway data, as D25 requires.
   - It cost $1.25 in 41 calls, against D24's $0.51–0.77, and it pushed the builder to 259k. A long build, then a browser session on top, is the risk C1 traded for keeping the check off Opus.
   - On a diff this size, the UI check might be better as its own short step on a fresh context. That goes to the next meta-analysis with more UI runs, not to a candidate yet.
4. **C4 met:** the UI sub-phase says "frontend-design: not needed, because the layout is unchanged…", and `handoff-check` passed it.
5. **C8 met, with a gap.**
   - G2 listed 7 numbered decisions, 6 with a recommendation. The owner's "As recommended" answered those 6.
   - The seventh (tightening the tax-line wording in `ui.md`, `CLAUDE.md` and ADR-004) had none, so it stayed open, and the session said so instead of guessing.
   - A decision with no recommendation can't be answered by "as recommended". `review` could give every decision one, or mark one that has none.
6. **T4 fired and found something:** the Generate PDF toast blamed the wrong fields when the total wasn't ready (7). The message was fixed, and the retry declined. T4's count is 6 fix-worthy findings over 7 InvoiceMe issues.

### ThisIsMatheusCastro #6 Phase 1.3: Services and secrets (Standard), PR #8

The first run on a third project and a third stack: a Next.js 16 site, with the harness installed from ProdHarnessConfig `79a9b7b` the same day. The owner did the console steps (Supabase, Upstash, Turnstile, Resend, the Anthropic key, Vercel's variables). The code added the 7 service SDKs, a zod schema for the 8 variables validated at server startup, one server-only getter per service, a Turnstile verifier, and the first migration (two tables, RLS on, no policies) with a test that guards it.

G1 took 6 decisions in 3 rounds of questions. Two rounds came from the answers: who runs `npm install` (the owner answered in their own words), and how a sending-only Resend key could be checked (a send to Resend's test address). The plan stayed Standard: "the phase changes the schema, security and dependencies, and needed 5 decisions".

The merged PR is 26 files, +1,064 / −138. That includes `dcc73d4`, the `Decisions.md` rework (8 files, +206 / −109), which was made in a ProdHarnessConfig session outside the run. Its cost isn't in this run.

| Block | Transcript | Model | Calls | Context: first → peak | Time | Cost |
|---|---|---|---|---|---|---|
| A `/scope` | caf5dbef | Opus 5.5 | 22, plus 7 surveyor (Sonnet, $0.19) | 72k → 123k | 22 min, 3 rounds of questions | $1.95 |
| B: "continue 6", the main session | 786a33d3 | Opus 5.5 | 7 | 69k → 75k | 9 min | $0.36 |
| B `build`: the forked builder | 786a33d3/subagents | Sonnet 5.5 | 36, of which 3 for the check on the preview ($0.04) | → 99k | (same) | $0.77 |
| C `/review` to ready-to-merge | b49babf7 | Opus 5.5 | 60, plus 33 red-team over two runs (Opus, $1.30) and 4 for `security-review` (T5, $0.37) | 71k → 160k | 22 min, 2 rounds of decisions | $4.87 |
| C `/close` | b49babf7 | Opus 5.5 | 8 | → 167k | 1 min | $0.39 |
| **Total** | | | | | ≈ 54 min | **$8.33** |

**Against the targets:**
- **Cost:** $8.33, over $7.49. The D25 Standard median is now $9.18 over 2 runs (#140 and #6).
  - plan $1.95 (D24: $1.30–1.84; #140: $2.38);
  - build $1.13, the cheapest Standard build under D25 (D24: $1.27–1.99);
  - review $4.87, the most so far (D24: $1.90–2.16; #140: $3.08).
- **Context:** met. The main sessions peaked at 167k, at `/close`; the builder at 99k.
- **Owner turns:** ≈ 11, four over 7. They were:
  - `/scope`, three rounds of G1 answers and the G1 accept;
  - "continue 6";
  - `/review`, the G2 reply, "1 a 2 a 3 a" and `/close`;
  - "I'll do it" (the Roadmap's Status row, finding 6).

  On the planned path (one G1 round, one G2 round, no Status row) it would have been 7.
- **Quality:**
  - The red-team found 3 issues, all fixed. The worst two (both 9) were docs that dropped `approved = true` from the guestbook insert, which would have kept the public count at 0, and an RLS guard that a later `disable row level security` slipped past.
  - The re-review found that the review's own guard fix let a `/*` inside a `--` comment hide SQL. It was fixed at the owner's answer, with no third red-team run.
  - A follow-up, #9 (`shadcn` into devDependencies), was opened.
  - **Escapes** are tracked to 2026-12-03.

**Findings:**
1. **The hooks worked on a new stack.** It was the first live run of the hooks outside BabyBuddyHelper and InvoiceMe. The format and lint hooks ran on every edit. The docs gate blocked two review commits that changed `lib/migrations.test.ts` without its doc. The session updated Architecture_Design and split the change into a docs commit and a code commit. The split is noise in the history, but the gate caught a real stale line.
2. **The review was 58% of the cost.** Three things grew it:
   - G2 had 8 decisions, and two of the owner's answers changed scope: delete `.env.example`, and the `Decisions.md` point (finding 4).
   - A fix round, then the re-review's regression and a second fix round.
   - Writing #9.

   The main review session went from 71k to 160k over 60 calls. The red-team's two runs cost $1.30.
3. **Auto-fix stayed off.** In the build session, `set_monitor` succeeded this time; on #140 the classifier denied it. The app then delivered a stale Auto-fix event for the Vercel bot's comment. The session saw that it was a deploy status, changed nothing, and noted that Auto-fix was off. It stayed off through the review. That is one run where R12-5's first half wasn't needed, but the classifier isn't consistent.
4. **The installed `Decisions.md` was the wrong kind of document.** The install moved the plan's 18 product decisions into `Decisions.md` as ADR-001 to 018 ("MSSA Work covers only…"). The red-team couldn't check code against them, and flagged owner files that still said "service-role" instead. At G2 the owner said `Decisions.md` should hold standing patterns for uniformity, as BabyBuddyHelper's and InvoiceMe's do, and called it an install fault. It was reworked into 15 patterns (secrets, env, service clients, data, routes, content, UI, tests, branches, docs), and the product decisions went back to `PortfolioPlan.md` as a record. **Candidate R12-7.**
5. **An unreviewed commit reached the merge, and `/close` said so.** The review marked the PR ready at `8dbb065`. The `Decisions.md` commit was pushed after that, at the owner's go, and the owner merged at `dcc73d4`. `/close` compared the merged head with the reviewed one and reported that neither review covered `dcc73d4`, and that it holds only docs.
6. **`/close` can't update the Roadmap's Status row here.** The plan left the row to `/close`, but `close` doesn't edit docs, and ThisIsMatheusCastro's `main` takes changes only through a pull request. The owner took it on ("I'll do it"): one owner turn. **Candidate R12-6.**
7. **T5 fired for the first time.** `security-review` ran because the issue touches secrets and access to user data. It found nothing the red-team didn't; both scanned the history for the temporary route's commit. It cost $0.37, under T5's $0.50 drop line, and counts toward the auth epic's verdict.
8. **The builder.** Its build cost $0.77 in 9 minutes. It ran the plan's temporary check route on the preview deploy in the browser pane: read-only, plus a send to Resend's test address. It saved a screenshot, then removed the route in the next commit. The handoff noted that `npm install` reported 13 audit warnings (2 low, 11 moderate), which it didn't triage.

### ThisIsMatheusCastro #9 Move shadcn to devDependencies (Small), PR #10

#6's follow-up. `shadcn` is a CLI, but it sat in `dependencies`, and `npm audit --omit=dev` traced all 6 of the production audit's warnings to it. The fix moves it to `devDependencies` at the same range. The lockfile change is only flags: 226 packages gained `"dev": true`, and no version changed. The PR is 2 files, +228 / −2.

The issue's comment also asked to move the dependency configuration into a `project_dependencies/` folder. `scope` checked npm, Next.js, Vercel, CI's cache and the harness's per-file Prettier run, and found that each expects the files at the root. At G1 the owner kept them there.

| Block | Transcript | Model | Calls | Context: first → peak | Time | Cost |
|---|---|---|---|---|---|---|
| A `/scope` | ca2414df | Opus 5.5 | 17 | 78k → 110k | 6 min, 1 question, 1 plan rejected for its tier | $1.07 |
| B `build`: the main session and the forked builder | ca2414df | Opus 5.5 and Sonnet 5.5 | 3, plus 11 builder | 113k; the builder 64k | 3 min | $0.35 |
| C `review` to ready-to-merge | ca2414df | Opus 5.5 | 13, plus 7 red-team (Opus, $0.29) | → 127k | 4 min | $0.82 |
| C `/close` | ca2414df | Opus 5.5 | 5 | → 131k | 1 min | $0.20 |
| **Total** | | | | | ≈ 16 min | **$2.44** |

**Against the targets:**
- **Cost:** met. $2.44 is the cheapest D25 run so far, and the second cheapest Small run, after D22's #134 ($2.23). The D25 Small median is $3.21 over 2 runs.
- **Context:** met, 131k.
- **Owner turns:** ≈ 7, one over Small's 6. They were:
  - `/scope`, the G1 answer, the plan's rejection ("It has only 1 subphase, run it under Tier: Small") and the accept;
  - "Mark it ready" and "Skip it";
  - `/close`.

  Without the tier correction and the second answer, it would have been 5.
- **Quality:** the red-team found nothing to report. It checked again that the production audit was clean, and traced every production dependency through its dependencies to confirm that no newly flagged package is needed at run time. **Escapes** are tracked to 2026-12-03.

**Findings:**
1. **The tier rule and the plan's size disagreed, and the owner corrected it.** The plan had one sub-phase, but `scope` said Standard because Small's criteria exclude a dependency change. The owner rejected the plan for that one line, which cost a turn. The change moved no version and added or removed no package. **Candidate R12-8.**
2. **C2 met:** the fork ended with Small's two `MAIN SESSION:` lines (turn off Auto-fix; run `review` now), and `review` started with no owner turn.
3. **C8 not met.** G2 had 2 numbered decisions: approve with no fixes, and whether to open an issue for a CI check that fails on a production audit warning (recommended). The owner's "Mark it ready" answered the first. The session marked the PR ready and asked again about the second; the owner turned it down ("Skip it"). A reply in the owner's own words doesn't always answer by number.
4. **Auto-fix stayed off,** as on #6: `set_monitor` succeeded in the main session. Then a stale event for the Vercel bot's comment arrived, and the session ignored it and said why.
5. **The `/scope` session ran everything,** as Small intends: one transcript from `/scope` to `/close`, and the main session never passed 131k.

### ThisIsMatheusCastro #12 Phase 2.1: Theme tokens and the Calvo component (Standard), PR #15

The first UI phase on ThisIsMatheusCastro. It added a `data-section` scope per section with its palette as CSS variables, a type scale, a WCAG contrast helper and a test that checks every palette's pairs at 4.5:1. Calvo got his per-section accessories as overlays, a lighter headphone band and a redrawn bottle. A `/dev/themes` page shows every theme and every variant, behind a gate that opens only in development and on Vercel previews. The PR is 18 files, +775 / −29.

G1 took 4 decisions in one round. The first question cited ADR-002 ("forbids reading process.env directly, so any gate goes through getEnv()"): the reworked `Decisions.md` at work in planning.

**Counted to the first `/close 12`, by the owner's call.** That `/close` stopped because the owner's own uncommitted Roadmap edit left the tree dirty. The retries after it are priced as extra and left out: 18 calls, $0.72 and 4 owner turns (finding 1).

| Block | Transcript | Model | Calls | Context: first → peak | Time | Cost |
|---|---|---|---|---|---|---|
| A `/scope` | e1175aea | Opus 5.5 | 20, plus 10 surveyor (Sonnet, $0.29) | 72k → 124k | 15 min, 1 round of questions | $2.24 |
| B: "continue 12", the main session | 42e4cb49 | Opus 5.5 | 7 | 75k → 89k | 16 min | $0.52 |
| B `build`: the forked builder | 42e4cb49/subagents | Sonnet 5.5 | 64, of which 16 for the UI check ($0.36) | → 182k | (same) | $1.99 |
| C `/review` to ready-to-merge | da8c427d | Opus 5.5 | 34, plus 30 red-team over two runs (Opus, $1.33) and 4 for `security-review` (T5, $0.39) | 70k → 134k | 16 min, 1 round of decisions | $3.57 |
| C the first `/close` | da8c427d | Opus 5.5 | 4 | → 136k | 1 min | $0.15 |
| **Total** | | | | | ≈ 48 min | **$8.46** |
| Left out: the `/close` retries | da8c427d | Opus 5.5 | 18 | → 148k | 19 min | ($0.72) |

**Against the targets:**
- **Cost:** $8.46, over $7.49. The D25 Standard median is $8.46 over 3 runs (#140, #6 and #12).
  - plan $2.24 (D24: $1.30–1.84);
  - build $2.50, the UI check included (D24: $1.27–1.99, without a UI check);
  - review $3.57 (D24: $1.90–2.16).
- **Context:** met. The main sessions peaked at 136k. The builder reached 182k, with the UI check at the end of a long build, under 200k but near #140's pattern.
- **Owner turns:** 7, **met**, the first D25 Standard run to meet it. They were:
  - `/scope`, the G1 answers and the G1 accept;
  - "continue 12";
  - `/review`, the G2 reply and `/close`.
- **Quality:**
  - The red-team recommended approving with changes. The closed gate serves the 404 page with HTTP 200 (7): no content leaks, and the owner accepted it as a deviation. The sprite tweaks left the approved reference `calvo-sprite.html` stale (6): fixed, and checked pixel for pixel against `sprite.ts`.
  - T4: strict `NODE_ENV` and `VERCEL_ENV` stop the whole site on a hand-set value (5), declined; the plan asked for unknown values to be rejected.
  - Two adjacent notes: section scopes don't override `--secondary`, `--input`, `--popover` or `--destructive` (carried to #13), and a stale "Last updated" line (fixed).
  - The narrow re-review approved with no findings.
  - **Escapes** are tracked to 2026-12-04.

**Findings:**
1. **The run stopped at `/close`, on the Roadmap's Status row again.** The owner edited the Status table during the review and left it uncommitted, so `/close` aborted on a dirty tree. Then the owner committed it on the feature branch, so the branch tip no longer matched the merged head, and `/close` kept the branch rather than lose the commit. It passed on the fourth try, after the owner moved the edit to its own PR (#16) and approved resetting the branch. The script was right each time and deleted nothing. This is R12-6 a second time: the Status row has no place in the flow, so the owner updates it by hand mid-run, and it collides with `/close`. **R12-6 now has two runs.**
2. **A stale-types trap at the Stop gate.** Between the retries, the checkout went back to an old `main`. `next dev` had written route types for `/dev/themes` into `.next/dev/types/`, so the typecheck failed on a page that `main` didn't have. The session found the cause and deleted the gitignored folder. It is a trap for ThisIsMatheusCastro's `guardrails-review`, not for the harness. It falls in the left-out part.
3. **The reworked `Decisions.md` was used as intended.** `scope` cited ADR-002 in a G1 question, and the plan updated only the Status lines of ADR-008 and ADR-011. The builder changed no rule, and proposed two new ones in the handoff instead: name `data-section` in ADR-008, and an ADR for the dev-pages gate. G2 put them to the owner as decision 6, which was deferred.
4. **C1 met, and on cost.** The builder ran the UI check on the local dev server, read-only: 16 calls and $0.36, against #140's $1.25 and D24's $0.51–0.77. It saved screenshots at desktop and tall widths, and checked the console for errors.
5. **C3 met:** `build` was the first call after "continue 12". That makes 3 of 3.
6. **C4 met on a second project:** sub-phase 1 used `frontend-design` for the five palettes and the type scale, with the issue, PortfolioPlan's section table and the UI guidelines as its brief.
7. **C8 met:** one reply answered all 6 decisions. Decision 5, the visual sign-off, came back "yes" with a note: Calvo at 32 px is too small to read. G2 carried that to #13 as an open decision.
8. **Auto-fix stayed off** for the third run in a row: `set_monitor` succeeded, and a stale event for the Vercel bot's comment was ignored.
9. **T5 fired a second time** (the dev-pages gate and the env schema): 0 findings, $0.39. Two runs, no finding the red-team missed, both under the $0.50 drop line.

## Candidates for the next pass

Recorded here; not decided. They go to the mid-Epic-2 meta-analysis with the rest of the D25 runs.

| # | From | Candidate |
|---|---|---|
| R12-1 | #155 finding 1 | The session-state hook (or `scope` step 1) says so when the checkout isn't on an up-to-date default branch |
| R12-2 | #155 finding 2 | For a bug that only the owner can reproduce, plan a "reproduce first" step before Block B |
| R12-3 | #155 finding 3 | New scope found at G2 goes through a plan amendment and a forked `build`, not the review session |
| R12-4 | #157 finding 2 | A tier recheck that confirms or lowers the tier goes in the plan for the G1 accept, not in a separate question |
| R12-5 | #140 finding 1 | Allow `mcp__ccd_pr__set_monitor` in `settings.json`, and have `review` turn Auto-fix off again after each push and before the ready-to-merge note |
| R12-6 | #6 finding 6, #12 finding 1 | A doc change the plan needs after the merge, like the Roadmap's Status row, goes in the PR. `/close` commits nothing, and a protected default branch takes changes only through a pull request |
| R12-7 | #6 finding 4 | The install (Get Started and the project's docs step) says what `Decisions.md` holds: standing patterns a review can check code against, each with its reason, rules and status. Product decisions stay in the project's plan |
| R12-8 | #9 finding 1 | When Small's criteria and the plan's size disagree, such as one sub-phase that only moves a dependency, `scope` recommends a tier with both reasons and lets the G1 accept settle it, or Small allows a dependency change that adds, removes and upgrades nothing |
