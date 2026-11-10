# 01. The workflow

Every issue goes through four blocks and two owner gates. A block ends where its skill says, and the next one starts from a file, not from the conversation. That is what keeps each session short.

```mermaid
flowchart LR
  A["Block A: /scope n<br/>plan mode, Opus"] -->|G1: owner approves the plan| B["Block B: build<br/>forked Sonnet builder"]
  B -->|handoff + draft PR| C["Block C: /review n<br/>fresh Opus session + red-team"]
  C -->|G2: owner decides every finding| M["owner merges"]
  M --> D["Block D: /close n"]
```

## The blocks

| Block | Started by | Runs on | Ends with |
|---|---|---|---|
| **A: Scope** | `/scope <n>` (or `/scope <n> small`) | The main session, in plan mode, on Opus (`opusplan`) | One plan in `.harness/work/<n>/plan.md`, approved by the owner: **gate G1** |
| **B: Build** | The `build` skill, which the plan's step 0 invokes | A forked `builder` subagent on Sonnet | A draft PR, CI passing on its head, and `.harness/work/<n>/handoff.md` |
| **C: Review** | `/review <n>` | A fresh Opus session; the `red-team` reads the diff | One report to the owner with numbered decisions: **gate G2**. Then the fixes, one narrow re-review, and "ready to merge" |
| **D: Close** | `/close <n>` (or `/close <n> epic`), after the owner merges | The main session | The branch and working files removed, memory notes condensed, and on an epic, a knowledge audit |

What each skill does step by step is in [02. Skills and agents](02-skills-and-agents.md).

## The gates

- **G1 (plan).** The owner reads the full plan and may edit it. Nothing is implemented before it. The plan has a fixed shape that `handoff-check.cjs --plan` validates: scope, facts checked, acceptance criteria, sub-phases with a check each, rejected approaches, invariants, docs likely to go stale, and what's out of scope.
- **G2 (review).** The owner gets one message: a table of findings and PR comments, each with a recommendation, the acceptance criteria, the docs, and a numbered list of decisions, so one reply ("1, 2 fix; 3 decline") answers them all. A blocking finding (security, data integrity, correctness) can't be deferred to a follow-up issue unless the owner accepts it explicitly.
- **The owner merges.** The harness never merges, never pushes to the default branch and never force-pushes (see [03. Hooks and scripts](03-hooks-and-scripts.md#permissions)).

## Tiers

| | Standard (the default) | Small (`/scope <n> small`) |
|---|---|---|
| **Fits** | Anything | One sub-phase; no schema, data-migration, auth or security change; no dependency added, removed or upgraded (moving one between groups is fine); no change to a public interface |
| **Sessions** | A, then `/clear` and "continue <n>" for B; C in a fresh `claude --model opus` session | One session: A, the forked build, then `review` in the same session |
| **Gates** | G1 and G2 | The same G1 and G2 |

- The owner picks the tier. `/scope` recommends Standard when an issue doesn't fit Small, and checks again after G1's answers when they add a sub-phase, a fix or a UI check, or when there were more than 3 decisions. Raising the tier is a question; confirming or lowering it goes in the plan for the G1 accept.
- The plan's first line records the tier (`# Plan: #<n> <title> · Tier: Standard | Small`). When the build returns, that line decides what happens next, not the fork's reply.
- `handoff-check.cjs --plan` refuses a Small plan with more than one sub-phase. A `G2 fixes` sub-phase that `review` appends doesn't count.
- **Content, art or design drafted with the owner** is drafted before `/scope`, in its own session, and ends in an approved file that `/scope` plans from.

## G2 fixes

After G2, `review` makes a typo or a one-line doc fix itself. Anything bigger goes back to the forked builder: `review` appends a `G2 fixes` sub-phase to the plan and runs `build <n> amend`, which builds it on Sonnet, pushes, waits for CI and writes the handoff for the new head. Then `review` runs its one narrow re-review. On D25 those fixes cost the most when the Opus review session made them itself, at 120–200k context.

## An Epic's close

An Epic's own issue closes in three steps: `/close <n> epic` runs the knowledge audit (with no branch yet, `close.cjs` exits 4 and nothing is deleted); `/scope <n> small` plans a docs pass with the audit's findings the owner wants fixed; after that PR merges, `/close <n> epic` cleans up without auditing again.

## Working state

Everything about an issue in progress lives in `.harness/work/<n>/`, which is gitignored:

| File | Written by | Read by |
|---|---|---|
| `plan.md` | `/scope` | `build`, the session-state hook, `review` |
| `plan-comment.txt` | `build` (the URL of the plan posted to the issue) | `build`, so it posts only once |
| `stale-docs.md` | `stale-docs.cjs --record`, plus `ack:` lines | the docs gate |
| `handoff.md` | `build` (`review` renames it to `handoff-<k>.md` before a G2 fixes round) | `review` (also posted to the issue) |
| `gate.json` | the check gate (its failure count) | the check gate |
| `BLOCKED` | the check gate | every block, the session-state hook and `handoff-check.cjs` |
| `ui/` | the `ui-check` agent | the owner, at G2 |
| `known-failures.md` | `review`, when the owner sends a failing check to an open issue | the check gate, which reports that failure instead of blocking |
| `audit.md` | `close`, on an Epic | `close`, so the audit runs once |

`.harness/work/hooks.log` keeps one JSON line per hook or script event, and `.harness/work/.lastpass` the fingerprint of the last passing fast check.

The approved plan and the handoff are also posted as comments on the issue. Those comments are the lasting record; `/close` removes the folder.

## When it stops

- **`BLOCKED`.** After 3 failed fast checks in a row, the check gate writes `.harness/work/<n>/BLOCKED`. Every block stops when it sees it, and the session-state hook names it in a fresh session. The owner decides: amend the plan, resume in a fresh Opus session, or stop. A passing fast check later removes it.
- **`QUESTION:`.** The forked builder can't ask the owner. When the plan doesn't cover something (a behaviour change, a new dependency, a scope change), it commits nothing past the gap and ends its reply with `QUESTION: <the question>`. The main session relays it, and `build` resumes from the next uncommitted sub-phase.
- **`MAIN SESSION:`.** The builder ends its reply with a `MAIN SESSION:` line for anything only the main session can do: turning off the app's PR monitoring (Auto-fix), which the fork can't reach, on Small, running `review`; and after a G2 fixes round, the narrow re-review. The UI check isn't the builder's: `review` runs it on the `ui-check` agent.

## Design record

- [OPTIMIZATION_PLAN.md](../Evidence/OPTIMIZATION_PLAN.md) §4 (blocks, gates and tiers), §5.4 and §5.5 (the plan and handoff templates).
- [research/09](../Evidence/research/09-small-tier.md) (the Small tier), [research/11](../Evidence/research/11-meta-analysis.md) §12 (D25: the plan's tier decides) and [research/13](../Evidence/research/13-d25-meta-analysis.md) §9–10 (D26: G2 fixes forked, the UI check on its own agent, the Epic close).
