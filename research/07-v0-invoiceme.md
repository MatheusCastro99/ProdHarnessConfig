# V0: InvoiceMe setup check

Status: **done (2026-10-26).** Every item that was run passes. Item 8 was skipped by the owner, and item 6 moves to V3. InvoiceMe's adoption is #114, merged as PR #121 (`cec9769`). Installed from ProdHarnessConfig `aa1474f`, CC 2.1.304 headless.

BabyBuddyHelper's V0 ([04](04-v0-babybuddyhelper.md)) already proved the harness-generic items: `close` on squash and rebase merges and its abort cases, SHA binding, S5's edge cases and the fingerprint, malformed input in every hook, red-team recall on seeded defects, and the issue comments. The forked build and H6 were proven in [06](06-forked-build-plan.md). This V0 covers what differs in InvoiceMe: its checks (no tests, D8), the per-file tools (H1, which BabyBuddyHelper couldn't run), npm and npx through Windows' cmd shims, `FRONTEND/` as a check's cwd, its docmap, and the ruleset on `master`.

## Already shown by the adoption (#121)

| Item | Result |
|---|---|
| Context before the first prompt ≤ 85k | **41.2k**, measured headless as the first request's input (Sonnet, default mode). **Desktop app: 58.1k** in a fresh session (owner), against BabyBuddyHelper's 60k |
| `check.cjs full` | **Pass**, 4 commands: the frontend lint and build (cwd `FRONTEND`, npm through the cmd shim), `node --check server.js`, the `app.js` load check |
| H1 in a real session | **Pass**: a headless `acceptEdits` session appended an unused variable to `FRONTEND/src/pdfStyle.jsx`; `file-check` returned `no-unused-vars` from `npx eslint` as a blocking PostToolUse error |
| CI on the adoption PR | Green; merged by the owner |

## Checklist

| # | Item | Where | Result |
|---|---|---|---|
| 1 | S5: `fast` and `api-load` pass on a clean tree; `fast` fails on a lint error with the failing lines shown | Local | **Pass**: fast 3/3 (lint ≈ 2.2s), api-load 1/1; with a parse error in `pdfStyle.jsx`, exit 1 at `fast[0] npm run lint (in FRONTEND)` with eslint's output |
| 2 | H1 on an API file: `node --check` on a syntax error in `NODEAPI/routes/` | Local, direct hook run | **Pass**: exit 2, `SyntaxError: Function statements require a function name`, logged. Malformed input: exit 2, tagged |
| 3 | H2 with an active issue: block twice, `BLOCKED` on the third failure, silent while nothing changes, pass and unblock after the fix | Local, direct hook runs on a fake #999 | **Pass**: attempts 1/3 and 2/3 blocked with the lint output; the third wrote `BLOCKED` and the systemMessage; the fourth was silent; after the fix, `pass`, `unblocked` |
| 4 | H4 with InvoiceMe's docmap: a staged `NODEAPI/routes/` change denies the commit and names `API_DOCUMENTATION.md`; an ack clears that one | Local, direct hook runs | **Pass**, see finding F-IM-1. The ack cleared `API_DOCUMENTATION.md`; the other 3 stayed flagged. Malformed input: denied, tagged |
| 5 | H5 at `startup` with a plan in progress | Local | **Pass**: "Plan for #999 in progress …; Block B runs only when the owner asks" |
| 6 | `close` on a normal merge into `master` | Local | **Not run**: #114's local branch was deleted by hand (`git branch -d`) right after the merge, before this V0 started. It moves to V3's first `/close` |
| 7 | Branch protection on `master`: a failing required check blocks the merge | GitHub + owner | **Pass** (owner): throwaway PR #122 added an unused variable to `pdfStyle.jsx`. `Frontend build (Node 22.x)` failed, fail-fast cancelled 24.x, the API smoke tests and CodeQL passed, and GitHub refused the merge (`BLOCKED`). Closed unmerged, branch deleted |
| 8 | A push to `master` and a force push are refused | Owner | **Skipped** (owner, 2026-10-26). The harness's deny rules for `master` are covered by ProdHarnessConfig's config test, and item 7 shows the ruleset is active on `master` |

## Findings

- **F-IM-1, noisy docs gate on API changes:** a one-line change to `NODEAPI/routes/taxRoute.js` flags 4 docs. Those are `API_DOCUMENTATION.md` (docmap), and three more: `.claude/CLAUDE.md` and `Decisions_Consistency.md` because they name the `NODEAPI/routes/` directory, and `Architecture_Design.md` because it names `taxRoute.js`. Each needs an update or an ack. That's the design (S1 lists candidates), but every API change in V3 will pay up to 4 acks. Watch it in V3 before tuning: a narrower directory rule, or a stoplist for docs that name directories only as layout.
- **The old historian's scope was wider than the docs list:** `NODEAPI/VersionLog.md` and both `.env.example` files aren't in `harness.json`'s `docs`. ADR-007's `.env.example` rule is still checked by `guardrails-review`.

## Clean-up

The fake #999 working state was removed, and every probe edit was reverted. Throwaway PR #122 was closed unmerged, and `v0/ruleset-lint-fail` was deleted locally and on GitHub. InvoiceMe's tree is clean on `master` at `cec9769`.
