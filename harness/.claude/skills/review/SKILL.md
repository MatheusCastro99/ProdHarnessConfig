---
name: review
description: Block C of the harness workflow. Reviews a finished change at its handed-off commit with the red-team, triages findings and comments, and brings one report to the owner (gate G2). Invoke as /review <issue> in a fresh Opus session; on the Small tier the main session runs it when the forked build returns.
argument-hint: <issue-number>
---

# Review: Block C (gate G2)

Issue: `$ARGUMENTS`. This session runs on Opus: on Standard a fresh one (`claude --model opus`); on Small the main session that ran plan mode, never the forked build (D22).

## 1. Check the input (refuse on failure)

- **First, if PR monitoring (Auto-fix) is on for the PR, turn it off** with `set_monitor` (Auto-fix off), before anything else. A push after the handoff would move the head this review checks. Turn it off again after each push of yours and before the ready-to-merge note (D26).
- **Both tiers:**
  - Read `.harness/work/<n>/handoff.md`. On another machine, read the handoff comment on the issue instead, and save it to that path.
  - Run `node .claude/scripts/handoff-check.cjs .harness/work/<n>/handoff.md --verify-head`.
  - Exit 1 (invalid), 3 (BLOCKED, or the PR head moved) or 2 (error): stop and report why. Don't review a moving target.

If the handoff passes but is too thin to triage against, read the PR's commit log with `git log --stat` yourself, not the diff: the red-team reads the diff. Note in the G2 report what the handoff lacked.

## 2. Red-team

Brief the `red-team` in the background with:

- **Goal:** the issue, the plan's acceptance criteria, and its invariants. Name any rule the plan wrote or reworded, so each item it governs is checked against it.
- **Target:** the PR **and the SHA** from the handoff.
- **Constraints:** the plan's "Out of scope" and the docs it expected to change.
- **Error-handling lens,** when the change touches error handling, validation or fallbacks: hunt silent failures too. Empty or broad catches, errors logged and then ignored, a default or success returned on failure, and errors that reach the user without saying what went wrong.

**UI check (D26),** when the plan has a UI sub-phase: brief the `ui-check` agent in the background too, with each UI sub-phase's check and the criteria it serves, the SHA, and the throwaway data the plan names. A failed check is a finding in the G2 table.

Don't read the full diff yourself; it goes to the red-team.

Meanwhile, collect review comments on the PR: `gh pr view <pr> --comments`, and inline comments via `gh api repos/{owner}/{repo}/pulls/<pr>/comments`.

## 3. Triage

For each finding and each comment, answer three questions:

- Can it be reached in this project today?
- Does it genuinely affect the people who use it?
- Is the cost of the fix justified?

Recommend **fix** or **decline**, with the reason, and name what would make a declined finding real. Verify a claim before relying on it.

**Source** names what found each one: `red-team`, `red-team (error lens)`, `ui-check`, `PR comment` or `reviewOnReady`. The run records (`Evidence/research/12–13` in ProdHarnessConfig) count by it.

## 4. G2 report (one message; the owner decides everything in one reply)

```
## G2: #<n> · PR <url> · reviewed SHA <sha> · CI on <sha>: <status>
### Findings and comments
| # | Source | Finding | Priority | Blocking | Recommendation |
### Acceptance criteria
- [x]/[ ] … · Not verifiable here: …
### Docs
<docs diff summary; acks>
### Optional owner steps
<e.g. a local MAUI run; CI's build is the required check; the UI screenshots in .harness/work/<n>/ui/>
### Decisions for you
1. <one per open decision: each finding to fix or decline, each follow-up issue, each item only the owner can change>
```

**Number every open decision under "Decisions for you" (D25)**, so one reply can answer them all ("1, 2 fix; 3 decline; 4 open the issue"). Ask nothing anywhere else in the report.

**A blocking finding** (security, data integrity, correctness) **can't go to a follow-up issue** unless the owner explicitly accepts it. Record that acceptance in the report.

## 5. After the owner decides

1. **Apply the approved fixes (D26):**
   - **A typo or a one-line doc fix:** make it here. One commit: `fix: <summary> (#<n>)`. Push, and wait for CI on the new head.
   - **Anything else, including new scope the owner approved:** don't build it in this session. Append `### <k>. G2 fixes` to `.harness/work/<n>/plan.md`, with `- Files:`, `- Change:` and `- Check:` for the approved fixes, and validate it with `handoff-check.cjs … --plan`. Rename `handoff.md` to `handoff-<k>.md`, so the finish guard waits for a new one. Then invoke the `build` skill with `<n> amend`. It builds on the forked Sonnet builder, pushes, waits for CI and writes the handoff for the new head. Check that handoff with `--verify-head`, as in step 1.
   - The hooks and gates apply as in Block B.
2. **A failing check the owner sent to an open issue:** add a line to `.harness/work/<n>/known-failures.md`: `<a line of the failure's output that names it> — #<issue>`. The Stop gate then reports that failure instead of blocking on it. Any other failure still blocks.
3. **Narrow re-review:** brief the `red-team` with the previous findings, the new SHA and the changed lines only. **Only one re-review.** What remains after it goes to a follow-up issue, unless the owner asks for another round. A blocking finding still needs the owner's explicit acceptance.
4. **Reply to each review comment** with its fix or the reason it was declined, as the owner decided at G2.
5. **Ready to merge.**
   - Mark the PR ready: `gh pr ready <pr>`.
   - **If `.claude/harness.json` has `reviewOnReady`**, a CI reviewer runs now, after G2:
     - Find its run: `gh run list --workflow <workflow> --branch <branch> -L 1`.
     - Wait for it, up to `timeoutMin` (default 15): `gh run watch <id>`.
     - Read the comments it left on the PR since the run started, and triage them as in step 3.
     - A blocking or fix-worthy comment goes back to the owner as a short **G2 addendum**, and nothing is marked ready to merge until the owner decides. The rest are noted in the ready-to-merge note.
     - If the run times out or fails, say so in the note. It isn't a required check.
   - Post the note: "ready to merge at `<sha>`. Reviewed SHA = PR head = the SHA CI passed on."
   - **Anything found after G2's decisions that needs no change** (from the re-review, CI or a comment) goes in the note and your report as a note with a recommendation, not as a question (D26). The owner raises it if they want it.
   - If the branch is behind the base, say so. Updating it creates a new head, which needs CI and a re-review again.
   - **The owner merges.** Then the owner runs `/close <n>`.

## Never

- Never review a SHA other than the handed-off head.
- Never merge, approve your own PR, or disable a check.
- Never post an unfixed security finding publicly. Report it to the owner directly.
