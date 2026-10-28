# 05. The installer

[`scripts/install.cjs`](../scripts/install.cjs) installs the harness into a project, and upgrades it later. It changes nothing unless you ask it to, and it never overwrites a file it can't account for.

```
node scripts/install.cjs <target-repo> <project> [--apply] [--replace <path>]... [--force]
```

- `<target-repo>`: the path to the project's git checkout.
- `<project>`: a folder name under `projects/` (`BabyBuddyHelper`, `InvoiceMe`, or your own).

## What it installs

| From this repo | To the project |
|---|---|
| `harness/.claude/{lib,hooks,scripts,agents,skills}/` | `.claude/…`, the same paths |
| `harness/.claude/settings.json` | `.claude/settings.json` |
| `projects/<project>/harness.json` | `.claude/harness.json` |
| `projects/<project>/vendor/skills/<name>/` | `.claude/skills/<name>/` |

It **never writes `CLAUDE.md` or `.claude/rules/`**. Those are written per project, starting from the template at [`harness/.claude/CLAUDE.md`](../harness/.claude/CLAUDE.md) (see [Get Started](../Onboard/GET_STARTED.md#5-write-the-projects-claudemd)).

## Dry run, then apply

1. **Without `--apply`,** it prints one line per file (`add`, `update`, `replace`, `remove`, or a blocking `conflict` or `local-edit`), a summary, and a gitignore report. Nothing is written.
2. **With `--apply`,** it writes, but only when:
   - nothing blocks it;
   - the target's working tree is clean, so the install is one reviewable diff.

   It also writes `.claude/harness-manifest.json`: this repo's commit, whether `harness/` or `projects/` had uncommitted changes, and a hash of every installed file. Commit that file with the rest.
3. **When nothing would change,** it says "already up to date" and writes nothing.

## Upgrades, local edits and conflicts

The manifest is what makes upgrades safe. On the next install, each file falls into one of these cases:

| Case | What happens |
|---|---|
| Identical to the new version | Nothing |
| Unchanged since the last install | `update` |
| Edited in the project since the last install | `local-edit`: blocks, unless `--force` |
| Exists, but the harness didn't install it | `conflict`: blocks, unless named with `--replace <path>` (or `--force`) |
| Installed before, no longer shipped, untouched | `remove` |
| Installed before, no longer shipped, edited | `keep-edited`: left in place |

Hashes are taken with line endings normalized to LF, so a checkout with `core.autocrlf=true` doesn't read as edited.

When a project edits its installed `harness.json` (say, to add a check), copy the change back to `projects/<project>/harness.json` here. `test/config.test.cjs` fails while a local clone's copy differs from the source.

## gitignore

The installer reports, but doesn't edit, `.gitignore`:
- **Lines to add:** `.harness/work/` and `.claude/settings.local.json`.
- **Rules that would hide an installed file,** and how to override them. The harness has to be tracked so it can be reviewed and shared.

## `install.json`

An optional `projects/<project>/install.json` holds what the installer adds per project:

```json
{
  "redTeamSkills": ["guardrails-review"],
  "vendoredSkills": {
    "frontend-design": {
      "source": "https://github.com/…/skills/frontend-design",
      "commit": "<40-hex commit>",
      "license": "Apache-2.0"
    }
  }
}
```

- **`redTeamSkills`:** skill names written into the installed `red-team.md` frontmatter, so the red-team preloads the project's own review rules. It warns if a named skill doesn't exist in the target.
- **`vendoredSkills`:** a third-party skill copied into the project. It must:
  - sit under `projects/<project>/vendor/skills/<name>/` with a LICENSE file;
  - be pinned here by source, a full commit hash and its license;
  - not have the name of one of the harness's own skills.

## Exit codes

- **0:** done, or a clean dry run.
- **3:** blocked: conflicts, local edits or a dirty tree. Nothing was written.
- **2:** an error, such as a usage error, an invalid `harness.json` or `install.json`, or a target that isn't a git repo.

## Design record

- [ADOPTION_PLAN.md](../Evidence/ADOPTION_PLAN.md) §3 (how it gets installed) and §4 (the steps per repo).
- [research/10](../Evidence/research/10-trials.md) (D24's vendored skills).
