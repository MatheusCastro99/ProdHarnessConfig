# Small tier (D18): first runs

Status: **#134, #68 and #120 done (2026-10-26).** #68 was the first Small issue after D22, and the first epic close with a knowledge audit. BabyBuddyHelper #134 was the first issue on the Small tier, run after the pilot ([§8.6](../OPTIMIZATION_PLAN.md)) on the harness from ProdHarnessConfig `6be4510`. Costs come from `research/scripts/cost.js` on the session transcript at list price; the transcript stays out of git.

## #134 Cub: handle a Claude refusal with a fitting line (Small), PR #140

A follow-up from #97's G2. At G1 the owner chose **rows first**. This pass adds two rows to `CUB_GUIDELINES_CHECKLIST.md`: a parent who mentions harming themselves, and one afraid of harming the baby. The owner runs them by hand with a real key (ADR-019). The refusal mapping waits on that run, so the PR said "Refs #134" and the issue stays open. Docs only: 2 lines.

One desktop-app session (31a0c1c2), 26 minutes:

| Part | Model | Calls | Context: first → peak | Cost |
|---|---|---|---|---|
| Plan mode to G1 accept | Opus 5.5 | 16 | 76k → 110k | $0.97 |
| Build: the main session around the fork | Opus 5.5 | 6 | 113k → 118k | $0.24 |
| Build: the forked `builder` | Sonnet 5.5 | 17 | peak 79k | $0.55 |
| Review: red-team, nested in the fork | Opus 5.5 | 3 | peak 24k | $0.17 |
| `/close` | Opus 5.5 | 7 | 119k → 125k | $0.30 |
| **Total** | | 49 | | **$2.23** |

**Against the targets:**
- **Cost:** below the baseline's small issues ($3.08 and $3.82): **met.** It also falls inside D18's estimate of $2.2–2.5.
- **Peak context ≤ 200k:** 125k, met.
- **≤ 85k before the first prompt:** 76k, met.
- **Owner turns:** **≈ 4**, met against Small's ≤ 6 (D20). They were `/scope #134 Small`, the G1 answers (2 decisions in one prompt), the G1 accept and `/close`, plus marking the PR ready and merging on GitHub. There was no G2 reply: nothing was found.
- **Quality:** red-team APPROVE with no findings. BabyBuddyHelper's `claude-review` workflow ran on ready-for-review and passed with no comments. Escapes: tracked to 2026-11-23.

**Hooks and checks:**
- **Checks:** `fast` 3 runs and `full` 2, all passing.
- **Docs gate:** 1 allow.
- **Stop gate:** 1 pass on `SubagentStop`.
- **Handoff check:** the plan was valid twice; the handoff was valid once, after finding 1.
- **Finish guard:** **1 block**, then done (finding 1).
- **`close`:** fast-forwarded and deleted the branch with `-d`.

## Findings

1. **The finish guard and the Small tier contradict each other.** The `build` skill says Small writes no handoff file and continues into `review`. H6 blocks a forked build from returning without a handoff, `BLOCKED` or a `QUESTION:` line. The fork finished its G2 report and was blocked once (attempt 1/3). It then wrote a handoff to get out, which passed `handoff-check`. That cost about 15 seconds this time, but the two rules were written before the fork and never reconciled.
2. **The Small tier's G2 ran inside the Sonnet fork.** "Continue in this session with the `review` skill" now means the fork's session, not the main one. So the builder invoked `review`, and the Opus red-team ran nested under it (spawn depth 2). The **G2 triage was written by Sonnet**, where D18 intends Opus. Two other things followed:
   - The review skill's first step, turning Auto-fix off, can't run in the fork. The main session did it after the fork returned, through the `MAIN SESSION:` line.
   - The fork left the PR as a draft, so the `reviewOnReady` workflow only ran when the owner marked the PR ready, 1 minute before merging. Nobody triaged it. It left no comments, so nothing was missed.
   - The independent review still happened: the red-team is pinned to Opus wherever it is spawned.
3. **The Small floor is about $2.** Two lines of docs cost $2.23. The fixed parts were most of it: plan mode to G1 ($0.97), the fork's start and checks ($0.55), the main session around it ($0.24) and `/close` ($0.30). D18's estimate held, but a Small issue with real code would cost more. One issue doesn't price that.

**Fix, adopted as D22 (2026-10-26)** for findings 1 and 2. On the Small tier, the fork ends the way Standard does: it writes and validates the handoff, then returns with "MAIN SESSION: run the `review` skill for #<n> (Small)". The main session already acts on that line (CLAUDE.md) and runs on Opus, so it does the review and the G2 triage in the same session, as D18 describes. It also handles Auto-fix and `reviewOnReady`. This means D18's "no handoff file" goes, and the review skill's Small branch uses the handoff's SHA like Standard. The cost should be a few Opus calls at the main session's ≈ 120k, ≈ $0.2–0.3.

## #68 [Epic] Phase 0: Automated API tests, close-out (Small), PR #130

InvoiceMe's Phase 0 epic, run on the Small tier after its three sub-issues (#71, #72, #73) closed. At G1 the owner decided the close-out:
- ADR-010 ("Every API endpoint has tests") moves to **Accepted, current**, with a new Reason.
- `CLAUDE.md` and `guardrails-review` stop calling it pending.

That was one sub-phase of docs: 3 files. After `/close 68`, the owner asked for the **epic knowledge audit** in the same session. It is `close`'s `epic` step, here asked for by hand. The audit's results went to #120 as a comment. One desktop-app session (89f086d9), 22 minutes, on the harness from `c405254` (D22).

| Part | Model | Calls | Context: first → peak | Cost |
|---|---|---|---|---|
| Plan mode to G1 accept | Opus 5.5 | 16 | 77k → 102k | $0.94 |
| Build: the main session around the fork | Opus 5.5 | 2 | 105k | $0.08 |
| Build: the forked `builder` | Sonnet 5.5 | 11 | peak 73k | $0.30 |
| Review to the G2 report: main session (D22) | Opus 5.5 | 11 | 107k → | $0.45 |
| Review: red-team | Opus 5.5 | 8 | peak 32k | $0.29 |
| G2 fix round: one fix, a narrow re-review (3 red-team calls, $0.10), mark ready | Opus 5.5 | 13 + 3 | → 128k | $0.58 |
| `/close` | Opus 5.5 | 6 | 129k → 134k | $0.27 |
| **The issue** | | 70 | | **$2.91** |
| Epic knowledge audit: main session, plus the comment on #120 | Opus 5.5 | 9 | 134k → 144k | $0.44 |
| Epic knowledge audit: red-team | Opus 5.5 | 16 | peak 56k | $0.60 |
| **Session total** | | 95 | | **$3.96** |

**Against the targets** (the issue alone; the audit is the epic's cost, not the Small tier's):
- **Cost:** **$2.91** below the baseline's small issues ($3.08), met by a small margin. It includes a fix round that #134 didn't need ($0.58). Without the fix round it would be about $2.33, close to #134's $2.23.
- **Peak context ≤ 200k:** 134k for the issue, and 144k with the audit. Met.
- **≤ 85k before the first prompt:** 77k, met.
- **Owner turns:** 5 for the issue, met against Small's ≤ 6. They were `/scope #68 Small`, the G1 answers, the G1 accept, the G2 reply and `/close`, plus the merge. The audit added 2: the request and the decision to send its findings to #120. `/close 68 epic` would have started it with the close, which saves one.
- **Quality:** red-team APPROVE, with 2 points:
  - one below its reporting threshold, declined at G2
  - one stale `CLAUDE.md` line, fixed and narrowly re-reviewed with no findings
- **Audit:** Phase 0's main claims match the code. It found 3 stale doc lines plus 4 older items, all added to #120, with no fix now.

**Hooks and checks:**
- **Checks:** `fast` 12 runs, `full` 5, `api-test` 4, `api-load` 1, all passing.
- **Docs gate:** 2 allows.
- **Stop gate:** 2 passes.
- **Finish guard:** **1 `done`, no block.**
- **Handoff check:** the plan was invalid once and fixed within 5 s; the handoff was valid twice, on `--verify-head` at review.
- **`close`:** done.

### D22 in a real run: verified

- **No finish-guard block:** the Small fork wrote, validated and posted its handoff, and returned (finding 1 fixed).
- **G2 on Opus in the main session:** the fork's reply carried both `MAIN SESSION:` lines. The main session turned Auto-fix off (the app had just switched it on), then ran `review` itself. The red-team ran at spawn depth 1, briefed by the main session, not nested under the builder. The G2 report and the fix round were written on Opus (finding 2 fixed). InvoiceMe has no `reviewOnReady`, so that part wasn't exercised.
- **Cost of the move:** the main-session review up to the G2 report cost $0.45. That's above D22's estimate of $0.2–0.3: 11 Opus calls at about 110k context.

## #120 Onboarding follow-up: the docs items (Small), PR #131

#120 is a tracking list. At G1 the owner limited this pass to its documentation items and kept the issue open for the rest: the questions, and the code and branding notes. The pass covered:
- the issue's stale-docs list
- the epic audit's findings (#68)
- the same stale facts found elsewhere
- two new pending ADRs in the owner's wording: ADR-012, money in integer cents, and ADR-013, dates of service

That's one sub-phase: 7 doc files, plus a one-line fix at G2. The owner chose the tier at G1 (`/scope 120`, then "Small" in the answers), and used the surveyor. One desktop-app session (bfe6b989), 20 minutes, under D22. The owner's Roadmap session afterwards (PR #132, on Haiku, outside the harness) isn't counted here.

| Part | Model | Calls | Context: first → peak | Cost |
|---|---|---|---|---|
| Plan mode to G1 accept (two rounds of G1 questions) | Opus 5.5 | 15 | 76k → 119k | $1.31 |
| Survey | Sonnet 5.5 | 6 | peak 43k | $0.23 |
| Build: the main session around the fork | Opus 5.5 | 2 | 125k | $0.11 |
| Build: the forked `builder` | Sonnet 5.5 | 21 | peak 89k | $0.49 |
| Review to the G2 report: main session | Opus 5.5 | 10 | 127k → 139k | $0.47 |
| Review: red-team | Opus 5.5 | 14 | peak 48k | $0.51 |
| G2 fix round: one line, a narrow re-review (4 red-team calls, $0.11), mark ready | Opus 5.5 | 13 + 4 | → 149k | $0.63 |
| `/close` | Opus 5.5 | 4 | 149k → 152k | $0.18 |
| **Total** | | 89 | | **$3.93** |

**Against the targets:**
- **Cost:** **missed.** $3.93 is above the baseline's small issues ($3.08), and $3.30 without the fix round. This was the largest Small issue so far: 7 files, two new ADRs, a survey, and two rounds of G1 questions. Planning alone cost $1.31 + $0.23.
- **Peak context ≤ 200k:** 152k, met.
- **≤ 85k before the first prompt:** 76k, met.
- **Owner turns:** 6, met against Small's ≤ 6. They were `/scope`, two rounds of G1 answers, the G1 accept, the G2 reply and `/close`, plus the merge.
- **Quality:** red-team pass with 1 finding: the README header version disagreed with its history. It was fixed at G2 and narrowly re-reviewed with no findings.

**Hooks and checks:**
- **Checks:** `fast` 15 runs and `full` 5, all passing.
- **Stop gate:** 2 passes.
- **Finish guard:** 1 `done`, no block.
- **Handoff check:** the plan was invalid twice on the 12k cap (≈ 260 characters over), then valid; the handoff was valid twice.
- **Docs gate:** **1 deny**, then 2 allows (finding 4).
- **`close`:** done. The issue stays open as the tracking list.

**D22, second real run:** the same as #68. The fork handed off and returned. The main session turned Auto-fix off, ran `review`, briefed the red-team at depth 1, and wrote G2 on Opus. The main-session review cost $0.47 up to the G2 report, again above D22's ≈ $0.2–0.3.

### Findings

4. **The docs gate can't see an ack written in the same command as the commit.** The builder appended two acks to `stale-docs.md` and ran `git commit` in one shell command. The gate runs before the command (PreToolUse), so it saw no acks and denied it. The builder re-ran the commit and it passed, about 16 s lost. The build skill could say to write acks in their own command. Separately, the two flags came from editing `NODEAPI/VersionLog.md`. It isn't in InvoiceMe's `docs` list, so it counts as code, and docs that name it (`CLAUDE.md`, `rules/ui.md`) get flagged. Listing `VersionLog.md` and the `.env.example` files as docs would close the gap research/07 noted.
5. **Two Small issues missed or nearly missed the cost target, both through planning and G2 rounds, not the build.** The fork cost $0.30–0.55 in every Small run. Plan mode to G1 cost $0.94–1.31, and the main-session review $0.45–0.47. Small's ≈ $2.2–2.5 holds only for a tiny issue with no fix round. Across the three: $2.23, $2.91 and $3.93, a median of **$2.91**, under $3.08.
