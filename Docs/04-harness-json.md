# 04. `harness.json`

Each project has one `harness.json`. It is the only project-specific input the hooks and scripts read: which commands are the checks, which files are docs, and which CI checks must pass.

- **Its source** lives here, in `projects/<Project>/harness.json`. The installer copies it to `.claude/harness.json` in the project.
- **Validation:** `validateConfig` in [`harness/.claude/lib/harness.cjs`](../harness/.claude/lib/harness.cjs) checks it on every install and every hook or script run. An invalid file stops them with a message saying which field is wrong.
- **Trying it before installing:** set `HARNESS_CONFIG=<path>` to point the scripts at a file outside the repo.

## Commands

Every command in the file has the same shape:

```json
{ "run": ["program", "arg", "..."], "cwd": "subdir", "timeoutSec": 120 }
```

- **`run`** is an argument list, not a shell string, so there's nothing to quote or inject. On Windows, `.cmd` shims such as `npm` and `npx` run through `cmd.exe`, and an argument that can't be quoted safely there is refused.
- **`cwd`** is relative to the repo root. It is optional.
- **`timeoutSec`** is optional. The defaults are 120 for `fast`, 600 for `full` and 300 for any other check. A timeout exits 124.

## Fields

| Field | Required | What it is | Used by |
|---|---|---|---|
| `defaultBranch` | yes | `main`, `master`, … | `close.cjs`, the branch rules in the skills |
| `checks` | yes | Named lists of commands. `fast` and `full` are required; add any others a plan can name (`check api-test`) | `check.cjs`, the check gate, `quiet`, plans |
| `requiredCiChecks` | no | The CI check names a merge needs, matching the default branch's ruleset. With it, a READY handoff must say CI passed | `handoff-check.cjs`, `build` |
| `fileTools` | no | `{ "<glob>": { "format"?: <command>, "lint"?: <command> } }`. Each command contains `{file}`, which becomes the edited file's path. The first matching glob wins | the file-check hook (H1) |
| `docs` | no | Globs for every file that counts as documentation | `stale-docs.cjs`, the docs gate |
| `docmap` | no | `{ "<code glob>": ["<doc>", …] }`: links a doc to code that it describes without naming a path | `stale-docs.cjs` |
| `reviewOnReady` | no | `{ "workflow": "<file>.yml", "timeoutMin"?: n }`: a CI reviewer that runs when the PR is marked ready. `review` waits for it (default 15 minutes) and triages its comments | `review` |
| `notes` | no | Free text for humans. Nothing reads it | — |

## Choosing the checks

- **`fast`** runs at every stop while an issue is active, so keep it to seconds or a minute or two: lint, a compile, the quick unit tests. Mirror CI's quick steps.
- **`full`** runs once before the push. Mirror CI's required jobs as closely as the machine allows. If a required job can't run locally (BabyBuddyHelper's MAUI build), leave it to CI and say so in `notes`.
- **Named checks** give plans automated observables: `api-test`, `api-load`. A plan's sub-phase names one as its check.

## Two examples

**InvoiceMe** (MERN, `projects/InvoiceMe/harness.json`), abridged:

```json
{
  "defaultBranch": "master",
  "checks": {
    "fast": [
      { "run": ["npm", "run", "lint"], "cwd": "FRONTEND", "timeoutSec": 120 },
      { "run": ["node", "--check", "server.js"], "cwd": "NODEAPI", "timeoutSec": 30 }
    ],
    "full": [
      { "run": ["npm", "run", "build"], "cwd": "FRONTEND", "timeoutSec": 300 },
      { "run": ["npm", "test"], "cwd": "NODEAPI", "timeoutSec": 300 }
    ],
    "api-test": [{ "run": ["npm", "test"], "cwd": "NODEAPI", "timeoutSec": 300 }]
  },
  "requiredCiChecks": ["Frontend build (Node 22.x)", "API smoke test (Node 22.x)"],
  "fileTools": {
    "FRONTEND/src/**/*.{js,jsx}": { "lint": { "run": ["npx", "eslint", "--max-warnings", "0", "{file}"], "cwd": "FRONTEND" } }
  },
  "docs": ["Docs/**/*.md", "NODEAPI/API_DOCUMENTATION.md", ".claude/CLAUDE.md", ".claude/rules/**/*.md"],
  "docmap": { "NODEAPI/routes/**": ["NODEAPI/API_DOCUMENTATION.md"] }
}
```

**BabyBuddyHelper** (.NET MAUI) has no per-file linter, so `fileTools` is `{}`. Its `fast` check runs the xUnit tests, which need no MAUI workload, and it uses `reviewOnReady` for a CI reviewer. See [`projects/BabyBuddyHelper/harness.json`](../projects/BabyBuddyHelper/harness.json).

## Design record

- [OPTIMIZATION_PLAN.md](../Evidence/OPTIMIZATION_PLAN.md) §6.1 (ground rules) and §6.4 (the scripts that read this file).
