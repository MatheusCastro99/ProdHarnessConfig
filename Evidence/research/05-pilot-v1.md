# V1 pilot: BabyBuddyHelper

Status: **#96 done (2026-10-22); #97 done with the D16 Block B replay (2026-10-23).** [OPTIMIZATION_PLAN.md](../OPTIMIZATION_PLAN.md) §8.3 metrics, per issue. Costs come from `research/scripts/cost.js` on the session transcripts (list price), which stay out of git.

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

1. **D12 never applied in the desktop app.** The app's session model (`claude-opus-5-5`) overrides the project's `model: opusplan`, so Block B ran on Opus. At Sonnet prices Block B would have cost roughly half. Fix: a skill's `model:` frontmatter switches the model for the rest of the current turn (Claude Code docs, skills reference), and Block B runs as one turn after "continue #n", so `model: sonnet` on the `build` skill enforces D12 whatever the app picker says. An owner message mid-build reverts that turn to the session model. **That fix didn't work: see finding 5.**
2. **Block B's peak context (303k) came from one long turn.** About 79k is the fixed overhead, about 60k is shell output (code read with `cat` in the main session; the surveyor was not used), and most of the turn's 110k output tokens stay in context. §8.5's trigger applies: move broad reads to the surveyor. Effort `medium` for B is the other lever, but changing it during the D16 replay would confound the model comparison.
3. **Block C grew into a mini-build.** After G2 the owner added two rounds of UI adjustments from a manual pass, and each got its own narrow re-review. That is the owner's call; bundling the manual-pass adjustments into the first G2 reply, or moving them to a follow-up issue, keeps Block C to one fix round.
4. **The review ran in the same app session after `/clear`.** That works as a fresh context (each `/clear` starts a new transcript), and the session was already on Opus.
5. **A skill's `model:` doesn't switch the main session** (probed in CC 2.1.304, default and auto mode), so #131's `model: sonnet` on `build` had no effect, and #97's Block B ran on Opus. A skill with `context: fork` does run on its own model; [06-forked-build-plan.md](06-forked-build-plan.md) checks that design before it is adopted.

## #97 Companion personality (Standard), PR #132

The scope grew before kickoff: style and reply length, plus a sanity layer (code checks, then a Haiku grader, one retry) between Claude's reply and the parent. Four sub-phases.

| Block | Transcript | Model | Calls (main) | Context: first → peak | Cost |
|---|---|---|---|---|---|
| A `/scope` | 6dff0c08 | Opus 5.5 | 19, plus 9 surveyor (Sonnet) | 76k → 125k | $1.88 |
| B `build` | 4476b68d | **Opus 5.5** (the skill's `model: sonnet` didn't apply; finding 5) | 117 | 74k → **278k** | $8.04 |
| C `/review` + fixes + `/close` | 5aeb909a | Opus 5.5 | 57, plus 24 red-team (Opus) in 2 runs | 75k → 161k | $4.28 |
| **Total (production)** | | | | | **$14.20** |

**Against §8.4:** cost $14.20 against $7.49 (missed, but well below #96's $20.86). Peak context: B missed (278k), A and C within 200k. Before the first prompt: 76k, 74k, 75k (met). Owner turns: about 9 (`/scope`, G1 accept, `/clear`, "continue 97", `/clear` + `/review`, one G2 reply, the merge, `/close` and one answer during it), against ≤ 6. Block C was one fix round with one narrow re-review, as designed. The Block B to Block C gap (16:03 → 17:57) was the wait for the replay comparison.

**Hooks:** Stop gate 1 pass, no `BLOCKED`. Docs gate 1 denial, cleared. Handoff check valid twice. The plan and the handoff were posted to #97.

### D16: the Block B replay (V2)

All three builds started from the same commit (00a5f1f) and the same approved plan (sha256 c495abba…, the one posted at G1). The two replays were local only: no push, no PR, no CI wait, no comments, and no UI Automation check, so they did less than the production build.

| Run | Model | Calls | Context: first → peak | Time | Cost | Blind red-team (Opus) |
|---|---|---|---|---|---|---|
| Production (#132) | Opus | 117 | 74k → 278k | 26 min, with CI | $8.04 | approve with changes: **1 blocking** (the default Supportive style line conflicts with the emergency rule, and the grader checks against both), 2 minor |
| Opus replay | Opus | 79 | 42k → 234k | 17 min | $6.07 | approve with changes: 0 blocking. The same emergency issue, rated an owner decision, because this run had added, beyond the plan, a rule that the shared rules come first whatever the style; 2 minor |
| Sonnet replay | Sonnet | 76 | 45k → 217k | 13 min | $2.73 | approve with changes: **1 blocking** (the same conflict), 2 minor |

**Result:** the blocking finding comes from the plan's own wording (G1 moved "Be warm and encouraging" into the style line and dropped its "except in an emergency"), not from the build model. Sonnet produced no major finding that both Opus runs avoided, and one of the two Opus runs had the same blocking finding as Sonnet. By D16's rule (Opus wins only by avoiding a fix loop or a major finding Sonnet produced), **Sonnet holds for Block B (D12), at about 45% of an Opus build's cost.** One issue is thin evidence; the run-to-run spread between the two Opus builds (one blocking, one not, by going beyond the plan) is as large as the model difference.

**Experimental spend (not #97's cost):** the two replays $8.80, plus the blind red-teams $3.65 (one of the four runs hit the usage limit and was rerun): **about $12.45.**
