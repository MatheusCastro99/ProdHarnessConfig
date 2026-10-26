# V3 pilot: InvoiceMe

Status: **#72 done (2026-10-26).** These are [OPTIMIZATION_PLAN.md](../OPTIMIZATION_PLAN.md) §8.3 metrics, per issue. The first issue to run on InvoiceMe after its adoption (#114, V0 in [07](07-v0-invoiceme.md)), and the first real run of the forked Block B ([06](06-forked-build-plan.md)). Costs come from `research/scripts/cost.js` on the session transcripts at list price; the transcripts stay out of git.

## #72 Jest + Supertest harness with in-memory MongoDB (Standard), PR #123

Part of epic #68, after #71. Two sub-phases: the test setup in `NODEAPI/`, then CI running `npm test` with the MongoDB binary cached. Three desktop-app transcripts, in order: Block A, Block B, then Block C with `/close`.

| Block | Transcript | Model | Calls (main) | Context: first → peak | Time | Cost |
|---|---|---|---|---|---|---|
| A `/scope` | f62de5a3 | Opus 5.5 | 16, plus 5 surveyor (Sonnet, 11k → 29k) | 76k → 114k | 18 min (13.5 of them waiting on the owner) | $1.36 |
| B `build`: the main session | 40bbe773 | Opus 5.5 | 12 | 73k → 89k | 13 min | $0.56 |
| B `build`: the forked builder | 40bbe773/subagents | **Sonnet 5.5** | 52 | 57k → 126k | 12 min | $1.05 |
| C `/review` + fixes + `/close` | d413c7c5 | Opus 5.5 | 25, plus 19 + 4 red-team (Opus) in 2 runs | 75k → 114k | 25 min (13 of them waiting on the owner) | $2.19 |
| **Total** | | | | | ≈ 1 h | **$5.16** |

**Against §8.4:**

| Target | #72 | |
|---|---|---|
| Cost ≤ $7.49 (Standard median) | **$5.16** | Met: the first pilot issue under target (#96 $20.86, #97 $14.20). Block B cost $1.61, against $9.38 and $8.04 for the Opus builds |
| Peak context ≤ 200k per block | A 114k, B 89k main / 126k fork, C 114k | Met in every block (#96: 303k; #97: 278k) |
| ≤ 85k before the first prompt | 76k, 73k, 75k | Met |
| ≤ 6 owner turns | ≈ 8: `/scope`, the G1 answers (4 questions in one prompt), the G1 accept, `/clear` + "continue #72", `/clear` + `/review`, one G2 reply, `/close` (plus the merge) | Missed, by less than #96 (≈ 10) and #97 (≈ 9) |
| Quality | Red-team: approve with changes, 0 blocking. 3 doc findings (one split from another) fixed at G2 in one commit, with 1 narrow re-review | Escapes: tracked for 4 weeks |

**Hooks and checks (`.harness/work/hooks.log`):**
- **Stop gate:** 2 passes (the fork's `SubagentStop` and Block C), with no `BLOCKED`.
- **Finish guard:** 1 `done`.
- **Docs gate:** 5 allows and 0 denials. #72 touched no route or controller, so F-IM-1's noise didn't come up.
- **Handoff check:** 4 valid, 0 invalid.
- **Checks:** `fast` ran 12 times, `full` 15 and `api-test` 2.
- **Comments:** the plan and the handoff were posted to #72.
- **`close`:** on a normal merge into `master` it fast-forwarded and deleted the branch with `-d`. That is V0 item 6, a pass.

**D8 (no tests):** every sub-phase check was automated, as D8 asks:
- `npm test` and the runner's `api-test` and `full` checks.
- A mutation probe: with the `afterEach` clear removed, the isolation test failed.
- `git status` after a coverage run.
- A throwaway failing-test commit made both API jobs fail at "Run tests". It was then reverted.
- The revert run's logs show a cache hit and no MongoDB download.

The owner's manual check was optional. #72 is also the issue that **ends** D8's premise: InvoiceMe now has a test suite, wired into `full` and named `api-test`. So #73 onwards runs with tests, and #72 is V3's only D8 evidence.

## Findings

1. **The `MAIN SESSION:` line went unread (check 8, half verified).** The fork ended its reply with "MAIN SESSION: turn off Auto-fix for … if it is on". Block B's main session read the PR status (`auto_fix: true`) and still left it on, telling the owner "Auto-fix is still on, waiting for your decision".
   - The next event was a CI-monitor event about the deliberate failure probe. The session correctly pushed nothing, since the probe had already been reverted.
   - Block C's first step turned Auto-fix off, as the review skill says. So that half of the check-8 fix works.
   - **Cause:** only the fork reads the build skill. The main session that receives the reply has no instruction to act on the line.
   - **Proposed fix:** one line in the template's `## Workflow`: when a forked build's reply contains a `MAIN SESSION:` line, do it before replying. CLAUDE.md is in the main session's context, so the line reaches it.
2. **`harness.json` drifted from ProdHarnessConfig.** The approved plan added the `api-test` check to InvoiceMe's `.claude/harness.json`, appended it to `full`, and rewrote the notes. That change was legitimate and covered by the plan. But `projects/InvoiceMe/harness.json` here is now stale, and the next install would see a local edit and refuse it without `--force`. The change has to be ported back here. A plan that touches `harness.json` should probably say so, so the port isn't missed.
3. **The forked build paid off.** The builder started at 57k: the system prompt, CLAUDE.md, the skill, and no Block A history. It peaked at 126k, and Block B's two parts together cost $1.61. The main session's wrapper cost $0.56 of that, mostly its 73k start and reading the plan. That's the context rebuild ProdHarnessConfig#1 asks about: about a third of Block B.
4. **Security handling worked in a real run (amended D3).** The builder found a dependency advisory that was already on `master`. It kept the advisory out of the issue comment and the PR, put it only in the local handoff, and Block C raised it with the owner directly.
5. **G1 batched its questions.** Block A asked all four G1 decisions in one prompt, so the owner answered them in one turn. That accounts for most of the drop from #97's ≈ 9 owner turns.
