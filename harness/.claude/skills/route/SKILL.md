---
name: route
description: The entry point of the harness workflow. Reads one GitHub issue, decides what it needs and in what order, and starts the first step. Invoke as /route <issue> [small].
argument-hint: <issue-number> [small]
disable-model-invocation: true
---

# Route: where every issue starts (D27)

Arguments: `$ARGUMENTS`. The first is the issue number; `small` passes through to `/scope`.

Only the owner starts an issue, here. The steps this skill starts (`/scope`, `/close`, `/layout-epic`) run in this same session.

## 1. Read

- `gh issue view <n> --comments`, with its labels.
- `.harness/work/<n>/`, if it exists:
  - **`route.md`:** a route already chosen; go on from its next step.
  - **`draft/`, `audit.md` or `diagnosis.md`:** an earlier step's approved file.
  - **`plan.md` or `handoff.md`:** the work has started; follow the session-state line instead.

Read the issue, not the code: routing needs no survey.

## 2. Choose one route

| Route | When | Then |
|---|---|---|
| **Scope now** | The common case: the issue says what to build, and nothing below applies | Invoke `/scope <n> [small]` now |
| **Draft first** | It asks for UI, art or content drafted with the owner, and there's no approved file yet | Draft (§3) |
| **Audit first** | Its scope is to find problems, then fix them ("audit", "check every …", "review all …") | Audit (§3) |
| **Diagnose first** | A bug no one has reproduced | Diagnose (§3) |
| **Light lane** | One docs, config or decline change, with no change in behaviour | Invoke `/scope <n> light` |
| **Epic close** | An Epic issue (its title starts "Epic", or it has an epic label) whose phases are all closed | Invoke `/close <n> epic` |
| **Lay out the Epic** | An Epic issue with no phase issues yet | Invoke `/layout-epic <n>` |

- **State the tier you expect, with its reason** (`scope`'s step 2 rules). Ask only to raise it; `/scope` confirms it.
- **When the issue fits no route cleanly,** name the two likeliest, recommend one, and ask. That is the only question here.
- **When the route has more than one step,** write them once to `.harness/work/<n>/route.md`: the steps in order, the session each runs in, and the tier. Comment the route on the issue (`gh issue comment <n>`). Each later step reads `route.md` instead of rediscovering the order.

## 3. Steps that run here

Draft, audit and diagnose run in this session, outside plan mode. They change no project source and no owner data. Each ends in an approved file, then tells the owner: run `/clear`, then `/scope <n> [small]`. `/scope` plans from that file.

- **Draft:**
  - Render mockups for the owner (the browser pane; the project's `frontend-design` skill where it has one) and iterate until they approve.
  - Save the approved version in `.harness/work/<n>/draft/` (gitignored), and comment "draft approved: <file>" on the issue.
- **Audit:**
  - Brief `ui-check` (the UI) or the `red-team` (code, docs) to audit the issue's scope read-only, and save the findings to `.harness/work/<n>/audit.md`.
  - Put them to the owner in one dialog: which to fix now.
  - Draft the rest as issues, and create them on the owner's yes.
- **Diagnose:**
  - Reproduce the bug with the owner's steps, a test, or read-only runs.
  - Save `.harness/work/<n>/diagnosis.md`: what's known, the leading causes, and what to capture next.
  - If it can't be reproduced, offer to park it: comment the diagnosis on the issue and stop. There is no plan to make.

## Never

- Never edit project source, and never write to the owner's data, in this skill.
- Never pick a route the owner turned down; recommend and wait.
