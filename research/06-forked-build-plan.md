# Forked Block B on Sonnet: check plan

Status: **adopted 2026-10-23** (ProdHarnessConfig `feat/forked-build`; all checks passed, check 8 after its fix). Written 2026-10-23, owner's option B after V1's #96 and #97 (D12): a skill's `model:` doesn't switch the main session (probed in CC 2.1.304, default and auto mode), but a skill with `context: fork` runs as a subagent on its own model (probed: the forked agent ran on Sonnet while the main session stayed on Opus).

## What a fork changes

From the Claude Code docs (skills and hooks references, read 2026-10-23), and the two probes:

| Area | Today (in the main session) | Forked |
|---|---|---|
| Model | the session's (Opus in the app) | the fork's agent: Sonnet |
| What it starts with | the cleared session plus the H5 line | only the skill content and its arguments, plus CLAUDE.md (for a `general-purpose` or custom agent); no conversation |
| Tools | the full set | the agent's tools. A backgrounded fork gets the narrower background set, so it needs `background: false` |
| H1, H3, H4 (PreToolUse and PostToolUse) | fire | documented to fire too, with `agent_type` in the input |
| **H2 (Stop gate)** | fires on each stop | **doesn't fire**: a subagent fires `SubagentStop`. H2 must also be registered there, matched to the builder agent |
| Asking the owner (Working Agreements rule 4) | inline | not documented; the fork has to return with the question, and the main session relays it |
| Turning off PR monitoring at handoff (`ccd_pr` tools) | the build does it | unknown whether app MCP tools reach a fork |
| The surveyor (Agent tool) and `ux-design` (Skill tool) | used by the build | unknown whether a subagent can start a subagent or invoke a skill |
| Context and cost | Block B's context piles up in the main session (#96: 303k) | it lives in the fork; the main session stays small. Subagent cache writes are 5-minute, at 1.25× instead of 2× |
| Metrics | one transcript per block | the fork's transcript is under `subagents/`, which `cost.js` already reads |

## The design under test

- A new agent, `.claude/agents/builder.md`: `model: sonnet`, `effort: high`, the tools Block B needs. Its frontmatter registers H2 as a `Stop` hook, which Claude Code converts to `SubagentStop` for that agent; or `settings.json` gets a `SubagentStop` entry matched to `builder`. Check 3 picks one.
- `build/SKILL.md`: `context: fork`, `agent: builder`, `background: false`; the `model:` line goes.
- **Resume:** a fork that hits rule 4 returns `QUESTION: …` and stops. The owner answers in the main session, which invokes `build <n> <answer>` again. The new fork resumes from the branch's commits (one per sub-phase, `(#n)`) and the plan.
- **What the main session does:** relays the fork's result, and runs anything the fork can't (for example turning off PR monitoring).

## Checks, before anything is adopted

All run on a local fixture repo with the harness installed from a working copy (`HARNESS_PROJECTS_DIR` points at a test project whose `fileTools` runs `node --check` on `.js`, so H1 has something to check). Nothing touches BabyBuddyHelper until they pass, and nothing goes to GitHub except check 8's draft PR.

| # | Check | Pass when | Where |
|---|---|---|---|
| 1 | **Model and effort** | the fork's calls are Sonnet 5.5, at high effort, while the main session stays Opus | headless, then the app (check 10) |
| 2 | **Tool hooks in the fork** | H1 reports a lint error on a fork's edit; H3 rewrites a typed check command; H4 denies a commit that leaves a doc stale | headless, fixture |
| 3 | **The Stop gate on `SubagentStop`** | with a failing test the fork can't stop: it's told to fix and continues. After 3 failures `BLOCKED` is written and the fork returns. With passing checks it returns. Both registration ways tried; keep the one that works, and confirm H2 stays silent for the surveyor and the red-team | headless, fixture |
| 4 | **Tools in a fork** | Edit, Write, Bash, Read work. Record whether the Agent tool (surveyor) and the Skill tool (`ux-design`) work; if not, the skill falls back to its own reads and `ux-design` moves to Block A | headless, fixture |
| 5 | **Permissions** | the settings' allow and deny rules apply to the fork's calls: `git push origin <branch>` and `gh pr create --draft` run; a push to `main` is denied | headless and the app |
| 6 | **The question path** | a plan with an unresolvable gap makes the fork return `QUESTION: …` without committing past it; `build <n> <answer>` resumes at the right sub-phase and doesn't redo committed ones | headless, fixture |
| 7 | **The handoff path** | the fork pushes, opens the draft PR, waits for CI, writes and validates the handoff, and posts it; the main session ends with the PR head equal to the handoff SHA | GitHub, a throwaway fixture repo or V0-style draft PR |
| 8 | **PR monitoring** | either the fork turns off Auto-fix, or the main session does it right after the fork returns; nothing pushes after the handoff | the app |
| 9 | **Long run** | a fork with 4 sub-phases runs past 20 minutes without being cut off | headless, fixture |
| 10 | **In the desktop app** (auto mode) | checks 1, 5 and 8 hold in a real app session, after `/clear` and "continue #n" | the app, the owner |

Expected cost: about $3–5 of headless runs, plus one short app session.

## Then

If every check passes: the harness change (the agent, the skill, H2's registration, the resume text) with tests in ProdHarnessConfig, a BabyBuddyHelper PR, and the next issue's Block B is the first real forked run. If check 3 or 6 fails, option A (`/model sonnet`) stays the fallback.

## Results: checks 1–6 and 9 (2026-10-23, local fixtures)

Six fixture repos (A–F), each with the harness from 860a327 plus the candidate: a `builder` agent (`model: sonnet`, `effort: high`); `build` with `context: fork`, `agent: builder`, `background: false` and the question/resume paragraph; H2 on `SubagentStop`. Headless main sessions on Opus invoked `build`. Fixtures A–C used a check command that Node 26 doesn't run (`node --test test/`); D–F use `node --test`.

| # | Result |
|---|---|
| 1 | **Pass.** Every fork ran on Sonnet 5.5 (A 102 calls, F 84, …) while the main session stayed on Opus. Effort isn't visible in the transcripts. |
| 2 | **Pass.** H1 reported `src/broken.js` (A, D, F). H4 denied a commit inside the fork, which then updated the doc (C, F). H3 rerouted a bare `node --test` through the runner (F). H3 misses a command the fork prefixes with `cd "<repo>" &&`, which it sometimes does (A, C); H3 is a fallback, and the skill runs checks through the runner. |
| 3 | **Pass with `settings.json`: `SubagentStop`, `matcher: "builder"`.** Inside the fork: attempt 1/3, 2/3, then `BLOCKED` and a BLOCKED handoff (A, E). Silent for the surveyor. **Fail in the agent's frontmatter** (B): no gate messages inside the fork; B's blocks came from the main session's own Stop hook after the fork returned. The main session's Stop gate also runs after a fork returns, so a failing tree is gated twice. |
| 4 | **Pass.** The fork started the surveyor (depth 2) and invoked a skill (A, F). |
| 5 | **Deny rules hold** (a push to `main` refused, in a main session and in F's fork). **Allow rules didn't apply in these never-trusted fixture folders,** even in a main session, so the runs passed the same rules on the command line. The fork's `cd … &&` prefix also turns a command into a compound one, which needs approval for each part. Both go to check 10. |
| 6 | **Pass.** C's fork returned `QUESTION:` with three options and left sub-phase 2 untouched. Invoked again with the answer, it kept sub-phase 1, built sub-phase 2, and its handoff passed. |
| 9 | **Fail, then pass with two additions.** D's fork backgrounded a 5-minute check and ended its turn, which returned it to the main session unfinished; H2 let it through, since the fast checks passed. With a **finish guard** (a second `SubagentStop` hook: the fork may return only with a handoff, `BLOCKED`, or a `QUESTION:` line; 3 blocks, then it lets go with a visible message) and a **foreground rule** in the skill, F ran 23 minutes, 4 slow checks, and finished with a valid handoff. The guard's block, give-up and question paths were also run directly. |

**Context:** the forks peaked at 44–80k, against 278k and 303k for Block B in the main session (#97, #96). The main session stays near its starting size.

**What changes in the design:** H2 registers on `SubagentStop` in `settings.json` (not frontmatter); the finish guard is added; the skill gets the foreground rule.

**Still open: checks 7, 8 and 10**, which need GitHub and the desktop app.

## Results: checks 7, 8 and 10 (2026-10-23, BabyBuddyHelper #135, in the desktop app)

A throwaway issue (#135) with a one-sub-phase plan (one test), on a local branch with the candidate from 56455f6 installed. The owner opened a desktop-app session (auto mode, Opus) and sent "continue #135"; Block C ran after `/clear` in the same session. PR #136 was closed unmerged, and #135, its branch and its work folder were deleted.

| # | Result |
|---|---|
| 10 | **Pass.** In the app, the main session stayed on Opus (13 calls) and the `builder` fork ran on Sonnet (23 calls). The fork pushed and opened the draft PR in one command; nothing was refused. The red-team still ran on Opus in Block C. |
| 7 | **Pass.** The fork applied the plan (9648d47), passed `check full`, pushed, opened draft PR #136, waited for CI (8/8 on the head), wrote the handoff, validated it with `--verify-head`, and posted it to #135 (the plan was posted first). The main session relayed the result. `/review` then found the handoff valid and the head unchanged. |
| 8 | **Partial.** Nothing was pushed after the handoff: the PR head stayed 9648d47 through the review and the close. But Auto-fix was switched on for PR #136 during Block B, and it stayed on until Block C turned it off. The fork can't reach the app's `ccd_pr` tools, and the main session noticed but left it on. |

**Cost:** Block B $0.67 (the Sonnet fork $0.30); the main session's context stayed at 75k → 82k. Block C $1.35. Compare #97's Block B: $8.04 at 74k → 278k in the main session.

**Fix for check 8 (proposed):**
- The fork ends its reply with a line for the main session when PR monitoring is on: `MAIN SESSION: turn off Auto-fix for <PR url>`.
- The `review` skill starts by turning Auto-fix off if it's on, so Block C never inherits it.

**`/close` on a throwaway:** it refused, correctly, because PR #136 was closed unmerged (exit 3, nothing deleted). Throwaway checks are cleaned up by hand.
