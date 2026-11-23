# 03. Hooks and scripts

The skills ask; the hooks and scripts enforce. Everything here is plain Node (CommonJS `.cjs`, no dependencies), reads the project's `.claude/harness.json`, and prints messages tagged `[harness <name>]`. Every hook and script logs one line per event to `.harness/work/hooks.log`, except while `HARNESS_CONFIG` is set (trying the checks before an install).

The hooks are wired in [`settings.json`](../harness/.claude/settings.json).
- **Always on:** the lint-on-edit, the docs report and the Bash guard run in every session.
- **Only while an issue is active:** the check gate, the finish guard and the session-state line. An issue is active when `.harness/work/<n>/plan.md` exists; the most recently changed plan wins.

## Hooks

| Hook | Event | What it does | When it blocks |
|---|---|---|---|
| **H1** [`file-check`](../harness/.claude/hooks/file-check.cjs) | `PostToolUse` on `Edit\|Write` | Formats, then lints, the one file just edited, with the first `fileTools` entry whose glob matches | A lint error exits 2, so Claude sees it and fixes the file |
| **H2** [`check-gate`](../harness/.claude/hooks/check-gate.cjs) | `Stop`, and `SubagentStop` for the `builder` | Runs the `fast` check. Skips it when nothing changed since the last pass (a fingerprint of every non-ignored file, the config and the check scripts) | Blocks the stop while `fast` fails. After 3 failures in a row, writes `BLOCKED` and lets the session stop so the owner decides. A failure that recurs is fixed at its source or made non-blocking in CI; D27 removed D26's known-failure exception |
| **H4** [`docs-gate`](../harness/.claude/hooks/docs-gate.cjs) | `PreToolUse` on `Bash`, for `git commit` | Works out what the commit will contain, including `-a` and a `git add` earlier in the same command, asks `stale-docs` which docs it may make wrong, and reports them | Never (D27): on D26 its 47 denials led to 427 "still accurate" acknowledgements. The handoff lists the flagged docs left unchanged, and the red-team checks them |
| **H5** [`session-state`](../harness/.claude/hooks/session-state.cjs) | `SessionStart` on `startup\|clear` | Adds one line per active issue (up to 3): plan in progress, handoff ready, or `BLOCKED`. After `/clear` with an approved plan, it says the next step is the build | Never |
| **H6** [`finish-guard`](../harness/.claude/hooks/finish-guard.cjs) | `SubagentStop` for the `builder` | Lets the forked build return only when a handoff exists, `BLOCKED` exists, or its last message has a `QUESTION:` line | Sends it back to work. After 3 tries it lets it return, with a message for the owner |
| **H7** [`bash-guard`](../harness/.claude/hooks/bash-guard.cjs) | `PreToolUse` on `Bash` | Looks for a `cat > <file>` with no heredoc, no input redirect and no pipe: with nothing to read, it waits on stdin forever (InvoiceMe #171 hung 24 minutes) | Denies that command, and says to use Write or a heredoc. Everything else passes |

Two rules every hook follows:
- **A broken hook is visible.** The check gate reports its own failure instead of passing silently; the docs report says when it couldn't check.
- **Never edit a hook to make a check pass.** The project's CLAUDE.md says so, and the check gate's fingerprint includes its own source.

## Scripts

Run them with `node .claude/scripts/<name>.cjs`. `settings.json` pre-approves each of them.

### `check` (S5)

```
node .claude/scripts/check.cjs <fast|full|id> [--index <n>]
```

Runs a named check's commands from `harness.json` in order and stops at the first failure. Its exit code is the failing command's own (124 on a timeout), and it trims the output, so trimming never turns a failure into a pass. Every block runs checks through it.

### `stale-docs` (S1)

```
node .claude/scripts/stale-docs.cjs (--staged | --range <base>..<head>) [--record <issue>] [--fail]
```

Maps each changed code file to the docs that may now be wrong. A doc is any file matching `harness.json`'s `docs` globs. It is flagged when:
- `docmap` maps the file to it;
- it mentions the file's path;
- it mentions the file's name, unless the name is generic or under 4 characters;
- it mentions the file's directory.

Renames and deletions are flagged too. `--record <n>` appends the candidates to `.harness/work/<n>/stale-docs.md`; an `ack: <doc> — <why>` line there still clears one for `--fail`. It is a list to review, not proof: drift that names no path is invisible to it. Exit 0, or 2 on an error. With `--fail` it exits 1 while a flagged doc is neither in the change nor acknowledged, so it can serve as a plain git pre-commit hook.

### `handoff-check` (S3)

```
node .claude/scripts/handoff-check.cjs <file> [--plan] [--verify-head]
```

- **With `--plan`:** validates a plan. It needs:
  - the first line with the issue and the tier;
  - every required section;
  - a check on every sub-phase;
  - exactly one sub-phase on Small, not counting a `G2 fixes` sub-phase;
  - at most 20,000 characters. Over 12,000 it passes with a warning.
- **Without it:** validates a handoff. It needs every section and a status. A READY handoff also needs CI to pass on the handed-off head; "none" is accepted only when the project has no `requiredCiChecks`.
- **`--verify-head`:** also checks that the PR's head is still the handed-off SHA, and that every `requiredCiChecks` job ran and passed on it, by name (`gh pr checks`). A required job that didn't run is not a pass.
- **It fails closed:** anything it can't confirm is a problem.
- **Exit codes:** 0 valid, 1 invalid (problems listed), 3 refused (`BLOCKED`, or the head moved), 2 error.

### `close` (S2)

```
node .claude/scripts/close.cjs <issue> [--branch <name>] [--dry-run]
```

It deletes nothing it can't prove is safe. The PR must be `MERGED`, the working tree clean, and the local branch tip equal to the merged PR's head. Then it:
1. switches to the default branch and fast-forwards it;
2. deletes the local branch, with `-D` only when the tip is proven to be the PR head (squash and rebase merges);
3. prunes remote-tracking refs;
4. removes `.harness/work/<n>/`;
5. lists the Claude Code memory files that mention the issue, for the `close` skill to condense.

It prints a JSON report. Exit 0 done, 3 aborted for safety, 2 error, 4 nothing to clean up (no branch and no handoff for the issue, as on an Epic's issue before its docs pass).

## Permissions

`settings.json` allows, without a prompt:
- the four scripts;
- `git push origin …`;
- `gh pr create --draft`, `gh pr view`, `gh pr checks`;
- `gh issue view`, `gh issue comment`.

It denies:
- pushing to `main` or `master`;
- every force push;
- `gh pr merge`.

A deny rule beats an allow rule. Argument-matching rules are best-effort, though, so the real guarantee is server-side: a GitHub ruleset on the default branch that requires a PR and the `requiredCiChecks`, and blocks force pushes and deletion. Set it up once per repository (see [Get Started](../Onboard/GET_STARTED.md#3-protect-the-default-branch)).

## Design record

- [OPTIMIZATION_PLAN.md](../Evidence/OPTIMIZATION_PLAN.md) §6 (hooks, scripts, the push guard and the file layout) and §6.6 (the Claude Code features they depend on).
- [research/06](../Evidence/research/06-forked-build-plan.md) (H6 and the forked build).
