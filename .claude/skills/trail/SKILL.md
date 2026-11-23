---
name: trail
description: Records a finished harness run in ProdHarnessConfig's research. Collects the issue, PR and transcripts, prices the blocks, writes runs.json and the validation log, evaluates the run against the current decision and targets, proposes candidates, tests and commits. Invoke as /trail <repo> <issue> [<issue> ...] after the owner reports a run closed.
argument-hint: <TIMC|IM|BBH> <issue> [<issue> ...]
disable-model-invocation: true
---

# Trail: record a finished run (D27, #9 §9)

Arguments: `$ARGUMENTS`. A project (`TIMC`, `IM`, `BBH`) and one or more issue numbers, all closed. The owner's notes on the run, if any, come with the request: weigh them, and quote none of their personal details.

The current config and its validation log: the newest `Evidence/research/*-validation.md`, and the last config in `runs.json`'s `configs`.

## 1. Collect

- **The issue and its PR:** `gh issue view <n>` and `gh pr list --state all` in the project's repo, giving the files, additions, deletions and commits.
- **The sessions:** `node Evidence/research/scripts/trail.cjs sessions <repo> --since <the day before>`. Match them by their first message (`/route <n>`, `/scope <n>`, "continue <n>", `/review <n>`, `/close <n>`), plus any session started from one of them. A session that isn't part of the workflow stays out, or goes under `extra`.
- **Each session's timeline:** `trail.cjs timeline <repo> <id>`, to read the owner's turns, the dialogs, the stops and anything odd.
- **The blocks:** `trail.cjs windows <repo> <id> <cut ISO> ...`. Cut at the block boundaries (G1, the build's return, G2, the close) and around anything off the planned path.

## 2. Annotate

- **`runs.json`:** add the run with the current config, `tier`, `kind`, `ui` (its plan had a UI sub-phase checked by `ui-check`), its `sessions` with their `start`, any `trial` label, `pr`, `diff`, and a short `note`. Run `node Evidence/research/scripts/runs.js`; its total becomes `recorded.cost`.
- **Owner turns:** count the owner's own messages, one per dialog answer and one per plan accept. Notifications, hook output and `/clear` don't count. Say which turns were off the planned path.
- **The validation log:**
  - add the run to each criteria-tracker row it bears on;
  - add a log row;
  - add a Runs section with the block table (whose rows sum to `runs.js`'s total), the targets with the tier's medians, quality (findings by source), and numbered findings.

## 3. Evaluate

- Judge the run against each change of the current decision, and against its tier's targets.
- Say whether an open candidate, or a section of the next version's issue, would have changed the outcome.
- Number any new candidate `R<nn>-<k>` in the log's candidates table, with the evidence.

## 4. Finish

- `npm test`, then commit, without pushing.
- Report to the owner:
  - the block table;
  - the targets;
  - the findings;
  - the new candidates.
- Ask whether to add each new candidate to the next version's issue. Only the owner takes one.

## Rules

- Transcripts and personal data stay out of git. Write nothing about what the owner looked up beyond what the run needs.
- An unfixed security finding goes to the owner, never into the log.
- Insert text with a replacer function (`s.replace(a, () => b)`) or a split and join, never a replacement string: `$` patterns in run text would expand.
- Write nothing to the project's repo, issues or memory.
