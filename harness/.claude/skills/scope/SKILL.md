---
name: scope
description: Block A of the harness workflow. Turns one GitHub issue into a single approved plan (gate G1). Invoke as /scope <issue> [small].
argument-hint: <issue-number> [small]
disable-model-invocation: true
---

# Scope: Block A (gate G1)

Arguments: `$ARGUMENTS`. The first is the issue number; `small` asks for the Small tier (D18). Without it, the tier is **Standard**.

Work in **plan mode** (enter it if you're not in it). This block ends with one plan and one owner approval. Don't edit project files here; the only file you write is the plan.

## Steps

1. **Read the issue.** Run `gh issue view <n> --comments`. The owner records decided scope in the comments.
2. **Check the tier.** Small needs all of these:
   - one sub-phase
   - no schema, data-migration, auth, security or dependency change
   - no change to a public interface

   If the issue doesn't fit, say so and recommend Standard. The owner decides.
3. **Survey.** Brief the `surveyor` with a **Survey**: the issue, the areas it names, and what you need to plan (files and callers, the patterns there, tests, the docs that describe it, facts the code contradicts).
   - On Small, you may instead read the few files yourself.
   - Don't read code broadly in this session. Every file you read stays in context until the clear.
4. **Settle open decisions.** For each decision the issue leaves open, give 2–3 options, mark one recommended, and give its trade-offs and why it fits this project. Ask them together, before writing the final plan. The owner decides.
5. **Write the plan** to `.harness/work/<n>/plan.md`, in exactly this shape:

   ```markdown
   # Plan: #<n> <title>   ·   Tier: Standard | Small
   0. Invoke the `build` skill before anything else.
   ## Scope (decided at G1)
   ## Facts checked / corrected
   ## Acceptance criteria
   - [ ] …
   ## Sub-phases
   ### 1. <name>
   - Files: …
   - Change: …
   - Check: check <id> | <automated observable> | manual — <why it can't be automated>
   ## Rejected approaches
   ## Invariants to preserve
   ## Docs likely to go stale
   ## Out of scope
   ```

   - Every section is filled in, or says "none".
   - `check <id>` must name a check in `.claude/harness.json`.
   - Prefer an automated check. A manual one needs its reason.
   - **"Rejected approaches" and "Invariants to preserve" carry what the clear will discard.** Write down anything Block B must know from your reasoning here.
6. **Validate:** `node .claude/scripts/handoff-check.cjs .harness/work/<n>/plan.md --plan`. Fix every problem it lists, then run it again until it passes.
7. **Present the plan for approval (G1)** with the plan's full text. The owner may edit it.
   - **Standard:** the owner approves, runs `/clear`, and sends "continue #<n>". The session-state hook points the cleared session at the plan, and the build skill posts it to the issue and starts from it. (The desktop app offered no "clear context" option at plan accept in V0, 2026-10-22; where it is offered, approving with it does the same.)
   - **Small:** the owner approves *without* clearing; the same session builds.

## Never

- Never start implementing in this block.
- Never decide scope, architecture or wording for the owner; recommend and wait.
- Never write anything security-sensitive into the plan. It is posted to the issue, and the repository may be public.
