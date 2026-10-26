# Small tier (D18): first run

Status: **#134 done (2026-10-26).** BabyBuddyHelper #134 was the first issue on the Small tier, run after the pilot ([§8.6](../OPTIMIZATION_PLAN.md)) on the harness from ProdHarnessConfig `6be4510`. Costs come from `research/scripts/cost.js` on the session transcript at list price; the transcript stays out of git.

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
