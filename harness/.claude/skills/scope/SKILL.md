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
   - Then `git fetch` and `git status -sb`. If the checkout isn't on the default branch, or is behind it, say so before planning (D26).
2. **Check the tier.** Small needs all of these:
   - one sub-phase
   - no schema, data-migration, auth or security change
   - no dependency added, removed or upgraded (moving one between dependency groups is fine, D26)
   - no change to a public interface

   If the issue doesn't fit, say so and recommend Standard. The owner decides.
3. **Survey.** When the issue names its files, read them yourself, narrowly, on either tier (D23, D26).
   - For code you don't know, or when the survey is the work (finding candidates across repos), brief the `surveyor` with a **Survey**: the issue, the areas, and what you need to plan (files and callers, the patterns there, tests, the docs that describe it, facts the code contradicts).
   - Don't read code broadly in this session. Every file you read stays in context until the clear.
   - **Content, art or design drafted with the owner (D26):** if the issue asks for it and there's no approved file yet, recommend drafting it first in a session of its own, ending in an approved file in the repo or `.harness/work/<n>/`. Plan from that file.
4. **Settle open decisions.** For each decision the issue leaves open, give 2–3 options, mark one recommended, and give its trade-offs and why it fits this project. Ask them together, before writing the final plan. The owner decides.
   - A value the owner has to type (a URL, an address) is a question of its own, answered in "Other" (D26).
   - A bug only the owner can reproduce gets "reproduce first": the owner runs the diagnosis before Block B, or the issue splits into a diagnosis and a fix (D26).
   - **Then check the tier again (D25),** when the answers added a sub-phase or another fix, brought in a UI check, or there were more than 3 decisions. Say what changed and recommend a tier. Raising it is a question; confirming or lowering it goes in the plan with its reason, for the G1 accept (D26).
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
   - **The smallest complete change:** for each sub-phase, take the first option that fully works: it isn't needed; this codebase already has it; the standard library or platform covers it; an installed dependency does; only then new code. Never cut validation at trust boundaries, error handling, security or accessibility. Name what you skipped under "Rejected approaches".
   - **A sub-phase that changes the UI:** its check is the app driven through the platform's built-in UI automation plus screenshots: the browser pane for a web app; for a Windows desktop app, PowerShell `UIAutomationClient`. Say what to look at.
     - The `ui-check` agent runs it in Block C, at the handed-off SHA, on either tier (D26); not the builder, and never the main session.
     - Plan it on throwaway data the project can make (a test or in-memory database). Where it can't, the check only reads. Never plan a write to the owner's data, even one undone afterwards.
     - If the project has a `frontend-design` skill, plan the design with it; the issue and the project's UI guidelines are its brief. Either way the sub-phase says `frontend-design: used for <what>` or `frontend-design: not needed, because <why>`.
   - **What G1 adds is planned too (D26):**
     - An item deferred as a follow-up is a step (a Roadmap line or an issue) with its own acceptance criterion.
     - A rule G1 writes or rewords gets an acceptance criterion: every item it governs is checked against it.
     - A new or changed ADR gets a sub-phase that drafts the matching check in the project's red-team skill, for the owner to approve at G2.
   - **"Rejected approaches" and "Invariants to preserve" carry what the clear will discard.** Write down anything Block B must know from your reasoning here.
6. **Validate:** `node .claude/scripts/handoff-check.cjs .harness/work/<n>/plan.md --plan`. Fix every problem it lists, then run it again until it passes.
7. **Present the plan for approval (G1)** with the plan's full text. The owner may edit it.
   - **Standard:** the owner approves, runs `/clear`, and sends "continue #<n>". The session-state hook points the cleared session at the plan, and the build skill posts it to the issue and starts from it. (The desktop app offered no "clear context" option at plan accept in V0, 2026-10-22; where it is offered, approving with it does the same.)
   - **Small:** the owner approves *without* clearing. This session starts the forked build, then runs `review` when it returns (D22). The approved plan's tier decides, not the fork's reply (D25).

## Never

- Never start implementing in this block.
- Never decide scope, architecture or wording for the owner; recommend and wait.
- Never write anything security-sensitive into the plan. It is posted to the issue, and the repository may be public.
