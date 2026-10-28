# 02. Skills and agents

The workflow is four skills and three subagents, all in `harness/.claude/`. A skill is the block's instructions; an agent is a model with its own context and tools that a skill briefs.

## Skills

| Skill | How it starts | Runs in |
|---|---|---|
| [`scope`](../harness/.claude/skills/scope/SKILL.md) | The owner types `/scope <n> [small]` (the model can't start it on its own) | The main session, in plan mode |
| [`build`](../harness/.claude/skills/build/SKILL.md) | The approved plan's step 0, or "continue <n>" after `/clear` | A fork, on the `builder` agent (`context: fork`) |
| [`review`](../harness/.claude/skills/review/SKILL.md) | `/review <n>` in a fresh Opus session; on Small, the main session when the build returns | The main session, never the fork |
| [`close`](../harness/.claude/skills/close/SKILL.md) | The owner types `/close <n> [epic]` after merging | The main session |

### `scope`: Block A

1. Reads the issue and its comments (`gh issue view <n> --comments`).
2. Checks the tier against Small's criteria and recommends one.
3. Surveys: briefs the `surveyor`, or reads a few named files itself when the issue names only a few. It doesn't read code broadly, because everything read stays in the context until the clear.
4. Puts each open decision to the owner as 2–3 options with one recommended, all at once. Rechecks the tier when the answers grew the work.
5. Writes `.harness/work/<n>/plan.md` in the fixed shape, and runs `handoff-check.cjs <plan> --plan` until it passes.
6. Presents the full plan for G1.

Rules it applies while planning:
- **Every sub-phase has a check:** a named check from `harness.json`, an automated observable, or "manual" with the reason it can't be automated.
- **The smallest complete change (T1):** for each sub-phase, take the first of: not needed; already in the codebase; the standard library or platform; an installed dependency; new code. Validation, error handling, security and accessibility are never cut.
- **A UI check (T6):** a sub-phase that changes the UI is checked by driving the app (the browser pane for a web app, Windows UI Automation for a desktop app) and taking screenshots, on throwaway data. The builder runs it.
- **`frontend-design` (T7):** if the project has that skill, a UI sub-phase says `frontend-design: used for <what>` or `frontend-design: not needed, because <why>`, and `handoff-check.cjs` enforces it.

### `build`: Block B

1. Stops if `BLOCKED` exists. Posts the plan to the issue once. Creates the branch `<type>/<n>-<short-name>`.
2. For each sub-phase: implements it, runs its check through `check.cjs`, runs `stale-docs.cjs --staged --record <n>` and updates or acknowledges each flagged doc, and commits once (`<type>: <summary> (#<n>)`).
3. Runs the `full` check, pushes, opens a **draft** PR, and waits for CI on the pushed head (`gh pr checks --watch`).
4. Writes the handoff, validates it with `handoff-check.cjs --verify-head`, and posts it to the issue.
5. Ends with the tier's line from the plan: on Standard, "start `/review` in a fresh Opus session"; on Small, `MAIN SESSION: run the review skill`.

The fork can't ask the owner, so it ends with `QUESTION:` when the plan doesn't cover something (see [01](01-workflow.md#when-it-stops)). The finish guard sends it back if it tries to return without a handoff, `BLOCKED` or a question.

### `review`: Block C

1. Turns off PR monitoring (Auto-fix) if it's on, then refuses a handoff that `handoff-check.cjs --verify-head` rejects: invalid, `BLOCKED`, or a PR head that moved since the handoff.
2. Briefs the `red-team` in the background with the goal, the PR and the SHA, and the constraints. It adds the error-handling lens (T4) when the change touches error handling, and runs the built-in `security-review` (T5) when it touches auth, sessions, secrets, permissions or user data.
3. Collects the PR's comments meanwhile, then triages every finding and comment: reachable today? does it affect users? is the fix worth it? Each gets a recommendation and a source.
4. Sends the G2 report, with every open decision numbered.
5. After the owner decides: applies the fixes, pushes, waits for CI, runs **one** narrow re-review, replies to each PR comment, marks the PR ready, and, when `harness.json` has `reviewOnReady`, waits for that CI reviewer and triages what it posts. Then the owner merges.

### `close`: Block D

1. Runs `close.cjs <n>`, which deletes the branch and working files only when it can prove that's safe (see [03](03-hooks-and-scripts.md#close-s2)).
2. Condenses the memory notes that mention the issue: keeps the outcome, follow-ups and lessons, drops the step-by-step.
3. On `epic`: briefs the `red-team` for a knowledge audit of the docs and ADRs the epic touched.

## Agents

| Agent | Model | Tools | Briefed by | Returns |
|---|---|---|---|---|
| [`builder`](../harness/.claude/agents/builder.md) | Sonnet, effort high | All (it implements) | Only the `build` skill, as its fork | A handoff, `BLOCKED`, or a `QUESTION:` |
| [`red-team`](../harness/.claude/agents/red-team.md) | Opus, effort high | Read-only: Read, Grep, Glob, Bash for inspection (no Edit or Write) | `review` (and once more for the re-review); `close` on an epic | A verdict and scored findings, at most 60 lines |
| [`surveyor`](../harness/.claude/agents/surveyor.md) | Sonnet, effort high | Read-only, the same as the red-team | `scope` only | Facts with `file:line`, and gaps, never file contents |

- **The red-team reviews one commit.** If the PR head isn't the SHA it was given, that is its only finding. It scores each finding (Priority = Severity + Confidence + Impact − Fix cost, each 1–5), drops anything at 3 or below, and marks security, data-integrity and correctness findings blocking whatever their score.
- **A project can preload skills into the red-team,** such as its own review guidelines, with `redTeamSkills` in `install.json` (see [05](05-installer.md#installjson)).
- **The main session's model** comes from `settings.json`: `opusplan` (Opus in plan mode, Sonnet otherwise) at effort high, and `CLAUDE_CODE_SUBAGENT_MODEL=sonnet` for any subagent that doesn't name one.

## Trials

D24 turned on five trials at once; the meta-analysis judged them, and D25 kept or reworded them. They're still being measured, so treat them as current practice, not settled results.

| Trial | What | Where it fires |
|---|---|---|
| T1 | The smallest complete change | `scope`, each sub-phase |
| T4 | The red-team's error-handling lens | `review`, when the change touches error handling |
| T5 | The built-in `security-review` | `review`, when the change touches auth, secrets, permissions or user data |
| T6 | A UI check by driving the app | `scope` plans it; the builder runs it |
| T7 | A vendored `frontend-design` skill | `scope` and `build`, on a UI sub-phase; only in projects that ship it |

## Design record

- [OPTIMIZATION_PLAN.md](../Evidence/OPTIMIZATION_PLAN.md) §4 (the blocks) and §7 (models and subagents).
- [research/06](../Evidence/research/06-forked-build-plan.md) (the forked build), [research/10](../Evidence/research/10-trials.md) (the trial register) and [research/11](../Evidence/research/11-meta-analysis.md) §5–6 (subagents and trials, measured).
