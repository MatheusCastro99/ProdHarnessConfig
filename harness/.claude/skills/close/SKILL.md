---
name: close
description: Block D of the harness workflow. After the owner merges, cleans up the issue's branch and working files safely and condenses its notes; on an Epic, runs the whole close. Invoke as /close <issue> [epic], in a fresh session; /route starts it on an Epic.
argument-hint: <issue-number> [epic]
---

# Close: Block D

Arguments: `$ARGUMENTS`. The first is the issue number; `epic` means this closes an epic.

## 1. Script part

On `epic`, first note whether `.harness/work/<n>/audit.md` exists: the script deletes that folder.


Run `node .claude/scripts/close.cjs <n>`. It deletes nothing it can't prove is safe:

- the PR must be `MERGED`
- the working tree must be clean
- the local branch tip must equal the merged PR's head

Exit codes:

- **4 (nothing to clean up):** no branch and no handoff for the issue. On an Epic's own issue, go to the Epic close below. Otherwise report it and stop.
- **3 (aborted):** report its message and **both SHAs** to the owner, and stop. Don't delete anything by hand.
- **2 (error):** report it and stop.
- **0:** go on. Its report lists what it deleted and the memory files that mention the issue.

## 2. Model part

- **Condense each memory file the report lists:** keep the outcome, the deferred follow-ups and the lasting lessons; drop the step-by-step. Don't delete a memory that other work still needs. Make the edits; don't ask first (D4).
- **The Epic close is one command (D27):** `/close <n> epic`, run twice: once to audit and fix, once after the merge to clean up.
  - **Exit 4 on an Epic's own issue** (its title starts "Epic", or it has an epic label), the first run: run one knowledge audit now. Brief the `red-team` to check the ADRs and docs the epic touched against the code's current behaviour, and save its findings to `.harness/work/<n>/audit.md`.
  - **Then, in one dialog,** put the findings to the owner: which to fix now. A finding that needs code becomes an issue (draft it; create it on the owner's yes).
  - **Fix the picked doc and rule findings in place:** write `.harness/work/<n>/plan.md` as a Small docs pass (one sub-phase), validate it with `handoff-check.cjs … --plan`, and invoke the `build` skill for <n>. When it returns, run `review` here, as on any Small.
  - **After that PR merges,** `/close <n> epic` again: the script cleans up (exit 0) and deletes the work folder with `audit.md`, without asking. Don't run the audit again.
  - **An Epic's own issue closed without `epic`:** ask the owner whether to run the audit, rather than skipping it.

## 3. Report

One short message:

- what the script deleted and kept
- the memory files you changed, each with one line on what you condensed
- the audit result, on `epic`

The issue comments (plan and handoff) stay as the record.
