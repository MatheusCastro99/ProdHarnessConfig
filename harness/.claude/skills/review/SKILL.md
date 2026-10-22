---
name: review
description: Block C of the harness workflow. Reviews a finished change at its handed-off commit with the red-team, triages findings and comments, and brings one report to the owner (gate G2). Invoke as /review <issue> in a fresh Opus session; on the Small tier the build skill continues into it.
argument-hint: <issue-number>
---

# Review: Block C (gate G2)

Issue: `$ARGUMENTS`. On Standard, this session should run on Opus (`claude --model opus`).

## 1. Check the input (refuse on failure)

- **Standard:**
  - Read `.harness/work/<n>/handoff.md`. On another machine, read the handoff comment on the issue instead, and save it to that path.
  - Run `node .claude/scripts/handoff-check.cjs .harness/work/<n>/handoff.md --verify-head`.
  - Exit 1 (invalid), 3 (BLOCKED, or the PR head moved) or 2 (error): stop and report why. Don't review a moving target.
- **Small:** confirm that the PR head equals the commit you pushed and that CI passed on it. Use `gh pr view <pr> --json headRefOid` and `gh pr checks <pr>`.

If the handoff passes but is too thin to triage against, brief the `surveyor` with one **Change summary** of the PR's commits. Note in the G2 report that you did.

## 2. Red-team

Brief the `red-team` in the background with:

- **Goal:** the issue, the plan's acceptance criteria, and its invariants.
- **Target:** the PR **and the SHA** from the handoff.
- **Constraints:** the plan's "Out of scope" and the docs it expected to change.

Don't read the full diff yourself; it goes to the red-team.

Meanwhile, collect review comments on the PR: `gh pr view <pr> --comments`, and inline comments via `gh api repos/{owner}/{repo}/pulls/<pr>/comments`.

## 3. Triage

For each finding and each comment, answer three questions:

- Can it be reached in this project today?
- Does it genuinely affect the people who use it?
- Is the cost of the fix justified?

Recommend **fix** or **decline**, with the reason, and name what would make a declined finding real. Verify a claim before relying on it.

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
<e.g. a local MAUI run; CI's build is the required check>
```

**A blocking finding** (security, data integrity, correctness) **can't go to a follow-up issue** unless the owner explicitly accepts it. Record that acceptance in the report.

## 5. After the owner decides

1. **Apply the approved fixes.** One commit per fix group: `fix: <summary> (#<n>)`. The hooks and gates apply as in Block B.
2. **Push.** Wait for CI on the new head. Record the new SHA.
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
   - If the branch is behind the base, say so. Updating it creates a new head, which needs CI and a re-review again.
   - **The owner merges.** Then the owner runs `/close <n>`.

## Never

- Never review a SHA other than the handed-off head.
- Never merge, approve your own PR, or disable a check.
- Never post an unfixed security finding publicly. Report it to the owner directly.
