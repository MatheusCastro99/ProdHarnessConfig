# Platform_Neutral

The harness in this repo is built for Claude Code. Most of what makes it work isn't, though. This folder separates the ideas, which you can rebuild with any coding agent that reads files, runs commands and keeps a conversation, from the Claude Code features this repo happens to use to implement them.

- **This page:** each idea, why it matters (with the measured effect where there is one), and what you'd need to rebuild it.
- **[SETUP.md](SETUP.md):** a phase-by-phase guide, with a prompt you can give any agent to set it up with you.

The numbers come from [Evidence/research/11](../Evidence/research/11-meta-analysis.md): 30 priced runs on three repositories by one owner, with the harness running on two of them. That's enough to show which way things move, not to measure effects precisely, and none of it was measured on another platform.

## What carries over

| Idea | Why it matters | Rebuild it with |
|---|---|---|
| **Gates where the owner decides** | A plan approved before any code (G1), and every review finding decided in one reply (G2). The owner decides; the agent recommends | Two stopping points in your prompts, and a fixed format for each. Nothing technical |
| **End sessions at the gates** | Cost tracks calls × context. Standard runs peaked at 121–129k tokens, against 291k for one long session, and cost a median of $6.03 against $9.99 | A new session (or a cleared context) per block, which starts from a file, not from the conversation |
| **A plan contract and a handoff contract** | They let the next block start fresh. The plan carries the rejected approaches and invariants that the clear would otherwise lose | Two markdown templates and a validator that fails closed. [`handoff-check.cjs`](../harness/.claude/scripts/handoff-check.cjs) is plain Node with no Claude Code dependency |
| **A cheaper model builds, a stronger one plans and reviews** | Block B fell from $8.04–9.38 (strong model, main session) to $1.25–1.99 (cheaper model, own context). The D16 replay found no quality cost | Any agent that lets you choose a model per task, or a separate session with another model |
| **An independent reviewer with a fresh context** | It reviews one pinned commit against the plan, scores findings and drops noise. It's also where most doc fixes come from: 8 of the 13 G2 fixes were doc lines a change had made untrue | A second session or agent that sees the diff and the plan, never the builder's reasoning, and can't edit |
| **Bind the review to one commit** | A push after the handoff makes the review stale. The review refuses a moved head | Record the SHA in the handoff; compare it with the PR head before reviewing |
| **A check runner that keeps the real exit code** | Trimmed output never turns a failure into a pass, and the checks are named, so plans can cite them | [`check.cjs`](../harness/.claude/scripts/check.cjs) and a `harness.json`; both are portable |
| **A stop gate on failing checks** | The agent can't hand off with failing fast checks. After 3 failures it stops for the owner instead of looping | Your agent's "before finishing" hook, or a wrapper script that runs the checks and refuses the handoff |
| **A docs gate** | A commit that touches code named in a doc must update or acknowledge that doc | A git pre-commit hook, with no agent involved. [`stale-docs.cjs`](../harness/.claude/scripts/stale-docs.cjs) only lists candidates (it always exits 0); to block, wrap its exported `unresolved()`, which also honours the `ack:` lines, and exit non-zero when it returns any |
| **Server-side branch protection** | "The owner merges" holds even if the agent's own rules are bypassed | A ruleset on the default branch: a required PR and checks, no force pushes |
| **Price every run** | Without it, the 40% saving was a guess. Raw token totals misread cost by about 2× until priced | Your platform's session logs and its price table. The scripts in [`Evidence/research/scripts/`](../Evidence/research/scripts/) read Claude Code's format; the method carries over |

## What is specific to Claude Code

| Feature | What the harness uses it for | Without it |
|---|---|---|
| Skills (`/scope`, `/review`, …) | One file of instructions per block, loaded only when invoked | A prompt file per block that you paste or reference |
| Forked subagents (`context: fork`) | The build runs in its own context, on Sonnet, and only its reply comes back | A separate session started from the plan file |
| Hooks (`Stop`, `SubagentStop`, `PreToolUse`, `PostToolUse`, `SessionStart`) | The check gate, finish guard, docs gate, lint-on-edit and session state | Git hooks for the docs gate and lint; a wrapper script for the stop gate |
| Plan mode and `opusplan` | Block A can't edit files, and it runs on Opus | An instruction not to edit, and choosing the model by hand |
| Permission allow and deny rules | Pre-approved scripts; no merge, no force push | Your agent's own permission system, plus the server-side ruleset |
| Prompt caching | Keeps each block's repeated context cheap | Platform-dependent. The idea of ending sessions at gates still holds |
| The desktop app's browser pane and PR monitoring | The UI check, and Auto-fix (turned off at the handoff) | A browser-automation tool; no Auto-fix to turn off |

The full list, with how each was verified, is in [OPTIMIZATION_PLAN.md](../Evidence/OPTIMIZATION_PLAN.md) §6.6.

## What didn't pay off, or isn't settled

- **A survey subagent** before planning showed no saving on issues that name their files (research/11 §5). It may still help in unfamiliar code.
- **A small tier** saves money only when nothing heavy follows the plan. One small run that grew after G1 became the dearest of the batch (research/11 §4).
- **The trials** (the smallest change, an error-handling lens, a security pass, a UI check, a design skill) are still being measured. Copy them as ideas, not as results.
