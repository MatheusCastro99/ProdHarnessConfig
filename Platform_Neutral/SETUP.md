# Setup on any platform

This guide rebuilds the harness's workflow with a coding agent other than Claude Code, or with Claude Code but without this repo's files. It goes phase by phase, and each phase works on its own: stop after any of them and you still have something useful.

Read [README.md](README.md) first, for what each piece is for.

## Phases

| Phase | You build | Done when |
|---|---|---|
| **0. Protect the branch** | A ruleset on the default branch: a required PR, the CI checks required, no force pushes | A force push is refused, and a PR with failing CI can't merge |
| **1. Checks** | A file naming your checks (`fast`, `full`, and others), and a runner that keeps the failing command's exit code | `fast` passes on a clean checkout, and a broken file makes it exit non-zero |
| **2. Plan contract and G1** | A plan template (scope, facts checked, acceptance criteria, sub-phases with a check each, rejected approaches, invariants, docs likely to go stale, out of scope) and a prompt for the planning session | One real issue gets a plan the owner approves, and nothing was edited while planning |
| **3. Build from the plan** | A build prompt that starts a new session from the plan file only: one commit per sub-phase, the checks run, a draft PR, then a handoff file | The build session never saw the planning conversation, and the handoff names the PR head SHA and CI's result on it |
| **4. Stop gate** | Something that refuses the handoff while `fast` fails: an agent hook, or a wrapper script | A deliberately broken check stops the handoff; 3 failures stop the work for the owner |
| **5. Independent review and G2** | A review session with a stronger model and no edit rights. It sees the plan, the PR at the handed-off SHA and the diff. It scores its findings and drops anything speculative, then reports with numbered decisions | The owner answers the whole review in one reply, and a push after the handoff makes it refuse |
| **6. Docs gate** | A pre-commit hook that flags docs naming a changed file, cleared by updating the doc or an `ack:` line | A commit changing a documented file is refused until the doc is handled |
| **7. Measure** | A script that prices each issue's sessions from your platform's logs | You can say what a typical issue costs, and which block costs most |

Copy what helps from this repo: the plan and handoff templates in [OPTIMIZATION_PLAN.md](../Evidence/OPTIMIZATION_PLAN.md) §5.4–5.5, the red-team's scoring in [`red-team.md`](../harness/.claude/agents/red-team.md), and the scripts in [`harness/.claude/scripts/`](../harness/.claude/scripts/), which are plain Node.

## A prompt for your agent

Give the text below the line to your coding agent, in a session opened on a clone of this repository. It makes the agent a setup assistant, not a decision maker: it explains, recommends and waits, and you decide.

---

I want to set up the workflow documented in this repository (ProdHarnessConfig) for my own project, on my own platform. Act as my setup assistant under these rules:

1. Start by reading `Platform_Neutral/README.md` and `Docs/01-workflow.md`. Summarize back to me, in your own words, the two gates and why sessions end at them, so we agree on what we're building.
2. Go phase by phase, in the order of the table in `Platform_Neutral/SETUP.md`. Before each phase, read the files it points to, and tell me what you'll create and where.
3. At every decision (where a file lives, which checks go in `fast`, which model plans and which builds, what counts as a doc), give me 2–3 options with one recommended and its trade-offs, and wait for my answer. Never choose for me, even as a default.
4. Keep what makes each piece work: the plan and handoff are files a new session starts from; the build never sees the planning conversation; the reviewer can't edit and reviews one pinned commit; the check runner keeps the real exit code; nothing merges or force-pushes without me.
5. Secrets never go into this conversation or a tracked file. If something needs a token, tell me where to put it myself.
6. End each phase with its "done when" test from the table. Run it with me, and don't move on past a failure.
7. When we're done, give me a one-page map: where each piece lives, how to start an issue, and what to check when something stops.

My setup: [your coding agent and how it runs (CLI, IDE, app); the models you can use; your git host and CI; your project's stack and its test, lint and build commands]
