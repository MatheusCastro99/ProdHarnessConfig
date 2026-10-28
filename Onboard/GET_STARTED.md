# Get Started

This guide installs the harness into one of your own repositories and takes it through a first issue. Expect an hour for the setup, most of it on your project's checks and its `CLAUDE.md`.

The harness is opinionated. It assumes:
- GitHub issues and pull requests;
- CI that runs on every PR;
- one owner who approves every plan, decides every review finding and merges by hand.

If that isn't how you work, read [Platform_Neutral](../Platform_Neutral/README.md) for the parts that carry over.

## 1. Prerequisites

- **Claude Code.** The desktop app is what it was measured on. It adds the browser pane for UI checks and PR monitoring, which the harness turns off at the handoff. The CLI works for everything else.
- **Access to Opus and Sonnet.** Plan and review run on Opus; the build, the surveyor and any unnamed subagent run on Sonnet.
- **Node 22 or later,** for the hooks and scripts. They have no dependencies.
- **`git`, and `gh` signed in** (`gh auth status`) with access to the repository.
- **A GitHub repository with CI** that runs on pull requests. The harness waits for it and reads its result.

## 2. Get this repository

Fork or clone ProdHarnessConfig next to your project, then run its tests:

```bash
npm test
```

Your project's configuration lives here, in `projects/<YourProject>/`, so the harness and every project's config are versioned together. A fork keeps yours apart from upstream.

## 3. Protect the default branch

This is the guarantee behind "the owner merges". Claude Code's permission rules are best-effort, while a GitHub ruleset is enforced by the server. In your repository's settings, add a ruleset on the default branch that:
- [ ] requires a pull request before merging;
- [ ] requires the CI checks to pass, by their exact check names (you'll copy them into `requiredCiChecks`);
- [ ] blocks force pushes and deletion;
- [ ] has no bypass actors, if the rule should hold for admins too;
- [ ] optionally, requires the branch to be up to date with the base.

## 4. Describe your project

Create `projects/<YourProject>/harness.json`. Every field is in [Docs/04](../Docs/04-harness-json.md); start from the closest example in `projects/`.

1. **`defaultBranch`.**
2. **`checks.fast`:** what should pass every time Claude stops, such as lint, a compile and quick tests. Keep it under a couple of minutes.
3. **`checks.full`:** what CI's required jobs run, as far as your machine can run them.
4. **`requiredCiChecks`:** the check names from the ruleset.
5. **`docs`:** globs for your documentation, so the docs gate can flag docs a change makes wrong.
6. **`fileTools`:** a linter or formatter per file glob, if you have one per-file.

Try the checks before installing anything. From your project's root, point the runner at the file:

```bash
HARNESS_CONFIG=../ProdHarnessConfig/projects/YourProject/harness.json node ../ProdHarnessConfig/harness/.claude/scripts/check.cjs fast
```

Fix the config until `fast` and `full` pass on a clean checkout.

Optionally, add `projects/<YourProject>/install.json`. It can preload your own review rules into the red-team (`redTeamSkills`), or vendor a third-party skill (see [Docs/05](../Docs/05-installer.md#installjson)).

## 5. Write the project's `CLAUDE.md`

The installer never writes `CLAUDE.md`, because it's yours.
1. **Copy the template** [`harness/.claude/CLAUDE.md`](../harness/.claude/CLAUDE.md) to `.claude/CLAUDE.md` in your project.
2. **Fill in every `<placeholder>`:**
   - what the project is;
   - the stack;
   - five to ten "where things are" lines;
   - the commands the checks don't cover;
   - the safety line, which differs for a public and a private repo.
3. **Delete the template comment.**

Keep the Workflow, Working agreements and Branches sections as they are; the skills rely on them. Keep the file under about 3k tokens. Rules that only apply to one area of the code go in `.claude/rules/<area>.md`, with a `paths:` frontmatter, so they load only when that area is touched.

## 6. Install

On a fresh branch in your project, with a clean working tree:

```bash
node ../ProdHarnessConfig/scripts/install.cjs . YourProject
```

1. **Read the dry run.** It lists every file it would add and any conflicts: files that exist but weren't installed by the harness, such as an old `.claude/agents/red-team.md`. Each conflict needs a decision: `--replace <path>` to replace it, or move your file aside.
2. **Add the gitignore lines it prints:** `.harness/work/` and `.claude/settings.local.json`. Remove any rule it says would hide an installed file.
3. **Apply:**

   ```bash
   node ../ProdHarnessConfig/scripts/install.cjs . YourProject --apply
   ```

4. **Commit** everything, including `.claude/harness-manifest.json`, together with your `CLAUDE.md`. Open a PR and merge it the usual way.

What the installer does in each case is in [Docs/05](../Docs/05-installer.md).

## 7. Check that it works

Before the first real issue:
- [ ] `node .claude/scripts/check.cjs full` passes.
- [ ] In a fresh Claude Code session, `/context` shows the starting context. The harness was tuned to start under about 85k tokens; a long `CLAUDE.md` or many enabled plugins push it up. `settings.json` turns off a few plugins that weren't needed; adjust `enabledPlugins` for yours.
- [ ] The hooks fire. Make a throwaway edit to a file with a `fileTools` linter and see it run, then revert the edit.

## 8. Your first issue

Pick a real but modest issue: a few files, with no schema or auth change.

1. **Plan.** In Claude Code, run `/scope <n>`.
   - It reads the issue, surveys the code and asks its open questions together, each with a recommendation.
   - Answer them. It then writes the plan and shows it to you. This is **G1**: read the plan in full, edit it if you like, and approve it.
2. **Build.** Run `/clear`, then send `continue <n>`.
   - The build runs forked on Sonnet. It posts the plan to the issue, commits one sub-phase at a time, opens a draft PR, waits for CI and writes the handoff.
   - It may stop with a `QUESTION:` line; answer it and it resumes.
   - If its reply has a `MAIN SESSION:` line, the main session acts on it, for example turning off PR monitoring.
3. **Review.** Start a fresh session (`claude --model opus`) and run `/review <n>`.
   - The red-team reviews the PR at the handed-off commit. You get one report, with every decision numbered. This is **G2**.
   - Reply with your decisions ("1 fix, 2 decline"). It applies the fixes, re-reviews once and marks the PR ready.
4. **Merge** it yourself.
5. **Close.** Run `/close <n>`. It deletes the merged branch and the issue's working files, and condenses the memory notes.

For a one-sub-phase issue, `/scope <n> small` runs all of this in one session, with the same two gates. The criteria are in [Docs/01](../Docs/01-workflow.md#tiers).

To measure a run, its cost and turns, see the scripts in [`Evidence/research/scripts/`](../Evidence/research/scripts/). They price a session from its Claude Code transcript at list prices.

## 9. Upgrading

Pull the newer ProdHarnessConfig, then run the same two commands: a dry run, then `--apply`.
- Files you haven't touched are updated.
- Files you edited block the upgrade (`local-edit`), so a fix isn't lost silently. Port the edit back to this repo, or use `--force` to overwrite it.
- If you changed `.claude/harness.json` in the project, copy the change back to `projects/<YourProject>/harness.json` first.

## 10. When something goes wrong

| You see | What it means | What to do |
|---|---|---|
| `[harness check-gate] fast checks failed (attempt n/3)` | Claude tried to stop with a failing fast check | Nothing; it's sent back to fix it |
| `#<n> is BLOCKED` | Fast checks failed 3 times in a row; `.harness/work/<n>/BLOCKED` says which | Decide: amend the plan, resume in a fresh Opus session, or stop. A passing fast check clears it |
| `[harness docs-gate] this commit may leave … doc(s) stale` | A changed file is named in a doc | Update the doc in the same commit, or add `ack: <doc> — <why it's still true>` to `.harness/work/<n>/stale-docs.md` |
| `/review` refuses with exit 3 | The handoff is BLOCKED, or the PR head moved after the handoff | Don't push after the handoff; if a push happened, the build has to hand off again |
| The installer says `BLOCKED` (exit 3) | Conflicts, local edits or a dirty tree | Read the listed files; use `--replace`, `--force` or commit first, as it says |
| `close.cjs` aborts (exit 3) | The PR isn't merged, the tree is dirty, or the branch tip isn't the merged head | Nothing was deleted; sort out the named cause by hand |
