# V1 pilot: BabyBuddyHelper

Status: **#96 done (2026-10-22); #97 next, with the D16 Block B replay.** [OPTIMIZATION_PLAN.md](../OPTIMIZATION_PLAN.md) §8.3 metrics, per issue. Costs come from `research/scripts/cost.js` on the session transcripts (list price), which stay out of git.

## #96 Companion AI agent (Standard), PR #129

One desktop-app session ("Scope 96"), cleared twice, so three transcripts: Block A, Block B, and Block C plus `/close`.

| Block | Transcript | Model | Calls (main) | Context: first → peak | Cost |
|---|---|---|---|---|---|
| A `/scope` | b8ccb350 | Opus 5.5 | 22, plus 14 surveyor (Sonnet) | 80k → 151k | $2.40 |
| B `build` | 7c82a920 | **Opus 5.5** (D12 expected Sonnet) | 124 | 79k → **303k** | $9.38 |
| C `/review` + fixes + `/close` | d4d44451 | Opus 5.5 | 116, plus 46 red-team (Opus) in 5 runs | 75k → **240k** | $9.08 |
| **Total** | | | | | **$20.86** |

**Against §8.4:**

| Target | #96 | |
|---|---|---|
| Cost ≤ $7.49 (Standard median) | $20.86 | Missed. #96 is the large issue V1 flagged; its cost is reported next to the target, not folded into it |
| Peak context ≤ 200k per block | B 303k, C 240k | Missed |
| ≤ 85k before the first prompt | 80k, 79k, 75k | Met |
| ≤ 6 owner turns | ≈ 10: `/scope`, G1 accept, `/clear`, "continue", the Block C hand-over, `/clear` + `/review`, 3 G2 replies, `/close` (plus the merge) | Missed; 2 of the 3 G2 replies were new UI adjustments from the owner's manual pass |
| Quality | Red-team: 2 findings, both fixed at G2; 4 narrow re-reviews (the plan allows 1 unless the owner asks) | Escapes: tracked for 4 weeks |

**Hooks and checks (`.harness/work/hooks.log`):** Stop gate: 6 passes, no `BLOCKED`. Docs gate: 4 denials, each cleared by an update or an ack. Handoff check: 2 invalid, then valid. `check fast` 17 runs, `full` 4. The plan and the handoff were posted to #96; `close` ran cleanly.

## Findings

1. **D12 never applied in the desktop app.** The app's session model (`claude-opus-5-5`) overrides the project's `model: opusplan`, so Block B ran on Opus. At Sonnet prices Block B would have cost roughly half. Fix: a skill's `model:` frontmatter switches the model for the rest of the current turn (Claude Code docs, skills reference), and Block B runs as one turn after "continue #n", so `model: sonnet` on the `build` skill enforces D12 whatever the app picker says. An owner message mid-build reverts that turn to the session model.
2. **Block B's peak context (303k) came from one long turn.** About 79k is the fixed overhead, about 60k is shell output (code read with `cat` in the main session; the surveyor was not used), and most of the turn's 110k output tokens stay in context. §8.5's trigger applies: move broad reads to the surveyor. Effort `medium` for B is the other lever, but changing it during the D16 replay would confound the model comparison.
3. **Block C grew into a mini-build.** After G2 the owner added two rounds of UI adjustments from a manual pass, and each got its own narrow re-review. That is the owner's call; bundling the manual-pass adjustments into the first G2 reply, or moving them to a follow-up issue, keeps Block C to one fix round.
4. **The review ran in the same app session after `/clear`.** That works as a fresh context (each `/clear` starts a new transcript), and the session was already on Opus.
