---
name: close
description: Block D of the harness workflow. After the owner merges, cleans up the issue's branch and working files safely and condenses its notes. Invoke as /close <issue> [epic].
argument-hint: <issue-number> [epic]
disable-model-invocation: true
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
- **On `epic`:** run one knowledge audit. Brief the `red-team` to check the ADRs and docs the epic touched against the code's current behaviour. Save its findings to `.harness/work/<n>/audit.md`; they come to the owner like any others.
- **The Epic close is one sequence (D26):** the audit, then a docs pass with its findings, then the cleanup.
  - **Exit 4 on an Epic's own issue** (its title starts "Epic", or it has an epic label): run the audit now, and name the next step: `/scope <n> small`, a docs pass that takes the audit's findings the owner wants fixed. After that PR merges, `/close <n> epic` cleans up.
  - **If `audit.md` existed before the script ran,** the audit has run: don't run it again.
  - **An Epic's own issue closed without `epic`:** ask the owner whether to run the audit, rather than skipping it.

## 3. Report

One short message:

- what the script deleted and kept
- the memory files you changed, each with one line on what you condensed
- the audit result, on `epic`

The issue comments (plan and handoff) stay as the record.
