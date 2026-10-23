<!-- Template from ProdHarnessConfig. Fill every <placeholder>, then delete this comment. Budget: ≤ 3k tokens (OPTIMIZATION_PLAN.md §5.2). Area-specific rules go in .claude/rules/<area>.md with paths: frontmatter, not here. -->
# <Project>

<One or two sentences: what the project is and who it is for.>

## Repository facts

- Stack: <stack and versions>
- GitHub: <owner>/<repo> (<public|private>). Default branch: `<main|master>`
- Project config for the harness: `.claude/harness.json` (checks, docs, CI checks)

## Where things are

<Five to ten lines, one path each, with what lives there. Docs are read on demand, never all up front.>
- `<path>` — <what>

## Commands

Run project checks through the runner, never by hand: `node .claude/scripts/check.cjs <fast|full|id>`. It keeps the real exit code and trims the output. Check IDs are in `.claude/harness.json`.

<Run or dev commands the checks don't cover, one line each.>

## Workflow

Every issue goes through the harness skills, in order. Each block ends where its skill says.

- **Standard:**
  1. `/scope <n>` — plan mode, one plan, gate G1
  2. `build` — autonomous, forked on a Sonnet `builder`; draft PR and handoff
  3. a fresh Opus session: `/review <n>` — red-team, gate G2
  4. the owner merges, then `/close <n>`
- **Small:** `/scope <n> small` — the same gates, in one session.

Working state lives in `.harness/work/<n>/` (gitignored). The approved plan and the handoff are also posted to the issue. If `.harness/work/<n>/BLOCKED` exists, stop and tell the owner.

## Working agreements

1. The owner makes every project decision: scope, architecture, product, priorities, wording. Recommend; never assume or decide.
2. A decision that affects direction or scope comes as 2–3 options, one marked recommended, each with trade-offs and why it fits this project.
3. Say so when a path looks sub-optimal, and recommend an alternative from evidence. Still don't choose.
4. Anything the plan doesn't cover stops the work: a behaviour change, a new dependency, a scope change. Ask first. A scope change goes into the issue before it goes into the code.
5. Fix what was asked and name what else you found. The owner decides whether the scope grows.
6. For each finding, before proposing a fix: can it be reached today? Does it affect the people who use the project? Is the fix worth its cost? The owner decides on every finding.
7. Verify a claim before relying on it (a small test, the source file); don't trust memory.
8. For small implementation choices (naming, formatting), take a reasonable default and proceed.
9. Standing rules belong to the owner. Propose or draft one; don't add, reword or change one yourself.

## Branches and commits

- One issue, one branch, one PR: `<type>/<n>-<short-name>`, with `feat`, `fix`, `docs` or `chore`.
- One commit per sub-phase: `<type>: <summary> (#<n>)`. Docs that a change makes untrue are updated in the same commit.
- Pushing a feature branch, opening a **draft** PR and commenting on the issue are pre-authorized. Never push to the default branch, force-push, or merge: the owner merges.

## Safety

- <Public repository: no secrets, no personal notes, no unfixed security findings in commits, comments or PRs. Report security findings to the owner directly.>
- Never edit the hooks, `.claude/scripts/` or `harness.json` to make a check pass.

## Compact instructions

When compacting, keep: the issue number and tier, the plan's sub-phase list with each one's status, the last check results, the open owner decisions, and any BLOCKED state. Drop file contents and tool output.
