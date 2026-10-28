# V0: BabyBuddyHelper setup check

Status: **done except one re-test (2026-10-22).** Every item passes except item 2: the desktop app offers no clear-context option, so the `/clear` fallback is now the Standard path; it is re-tested on V1's first issue.

Run records with personal data (session transcripts) stay out of git; only this table is committed.

## Where each item runs

- **Local:** in throwaway worktrees of BabyBuddyHelper, or headless `claude -p` sessions in them. Nothing leaves the machine.
- **GitHub:** in BabyBuddyHelper, on throwaway branches, one throwaway issue and draft PRs that are closed afterwards. **No throwaway PR targets `main`'s content:** merge tests go into a throwaway base branch, `v0/base`. Each outward step is approved by the owner first.
- **Owner:** steps only the owner can take: the desktop app's plan-accept dialog, merges, and pushes the harness forbids.

## Already shown by the adoption (#121)

| Item | Result |
|---|---|
| `/context` before the first prompt ≤ 85k | **47.4k**, measured headless as the first request's input (CC 2.1.304). The desktop app's own `/context` is re-read in item 2. |
| Synced plugins off (D6) | marketing, figma, design, productivity and pdf-viewer don't load |
| H2: a pass, 3 failures → `BLOCKED` | pass in a real session; the failure path by direct hook runs |
| H3: a typed check command is routed through S5 | real session |
| H4: a flagged doc denies the commit, including `git add -A && git commit` | real session, after the fix in 118904b |
| H5 at `startup`: reports, doesn't instruct | real session, after the fix |

## Checklist

| # | Item (§8.5) | P0 | Where | How | Result |
|---|---|---|---|---|---|
| 1 | Runtime: Claude Code version, surface, provider, permission mode, resolved model and effort per role (plan, build, review, red-team, surveyor, built-in subagents) | | Local | The headless sessions' `init` and per-message `model` fields; agent frontmatter | Partial: CC 2.1.304, subscription (`apiKeySource: none`). Desktop app: 60k before the first prompt (≤ 85k). Plan mode → Opus 5.5; default and `acceptEdits` → Sonnet 5.5; effort high; subagent env sonnet. Red-team resolved to Opus 5.5 (blind run and the review's subagent). The surveyor was not invoked in V0. Desktop app sessions run CC 2.1.308. Desktop surface: item 2 |
| 2 | Clear-on-accept in the desktop app | **P0** | Owner | A seeded exploration, then plan mode; accept with "clear context"; `/context` must show the exploration gone. If not, adopt and re-test the `/clear` fallback | **Fail, fallback adopted (F4).** Desktop app: 60k at session start, 101.3k after reading two files, 118k after the plan; no "clear context" option appeared at plan accept. The `scope` skill now makes `/clear` + "continue #<n>" the Standard path (0ff8334). Re-test of the fallback: pending |
| 3a | `close` on a normal merge | **P0** | Local | #121: its local branch is at the merged PR's head (5a2e40c). First the abort cases, then the real close | **Pass**: deleted `chore/121-adopt-harness` (`-d`, merged), fast-forwarded `main`, pruned |
| 3b | `close` aborts on an extra local commit, and on a dirty tree, keeping the branch | **P0** | Local | On #121's branch, before 3a | **Pass**: an extra local commit → ABORTED (exit 3), branch kept; a modified tracked file → ABORTED (exit 3) |
| 3c | `close` on a squash merge and a rebase merge | **P0** | GitHub + Owner | Two one-line PRs into `v0/base`; the owner merges one by squash, one by rebase | **Pass**: #124 (squash) and #125 (rebase) merged into `v0/base` by the owner; `close` deleted each branch with `-D`, proving the tip equal to the PR head |
| 4 | SHA binding: a commit pushed after the handoff makes `review` refuse | **P0** | GitHub | On the seeded-defect PR (item 7), after its handoff | **Pass**: `handoff-check --verify-head` valid at afedbeb; after one more commit was pushed it REFUSED (exit 3), naming both SHAs. The PR-monitoring half is n/a in headless runs (no monitor to turn off) |
| 5 | Hooks: H1 on a lint error; H5 on `clear` and `BLOCKED`; malformed input fails closed in every hook | | Local | H1 is **n/a for BabyBuddyHelper** (no per-file C# tools) and moves to InvoiceMe's V0 | H5 `clear` → "accepted → Block B", `BLOCKED` → owner decision: **pass**. Malformed input: H1 exits 2 and H4 denies, both tagged (**pass**); H2 ignores its input by design and still gates; H3 passes the command through untouched; H5 reads no input. H1 on a lint error: n/a here |
| 6 | S5 cases; the `.lastpass` fingerprint invalidated by staged, untracked, deleted and renamed changes and a `harness.json` edit | | Local | Direct runs in a worktree | **Pass**. S5: pass; fail (exit 1, failure lines shown); zero-output failure (exit 4, "printed nothing"); timeout (exit 124 at 3s); a path with spaces; a benign "ERROR" in passing output (exit 0); an unknown ID (exit 2). Stop gate: re-ran after staged, untracked, deleted, renamed and `harness.json` changes; skipped on an unchanged tree |
| 7 | Seeded defects: 2–3 known defects and one doc drift that names no path; the red-team's recall | | Local → GitHub | A throwaway change built through the real `build` skill from a written plan, reviewed by the real `review` skill on Opus | **Pass, 4 of 4.** After the `.harness/work/` fix (#127), Block B (Sonnet) applied the patch unchanged (afedbeb), passed `fast` and `full`, opened draft PR #128, waited for CI (8/8) and handed off. **Blind red-team** (Opus, a clean checkout with no handoff and no GitHub): found D1 (copied Id), D2 (cache before database), D3 (lookup by reference) and the path-less doc drift (Cub nods on task delete; UI_GUIDELINES, `rules/ui.md`, README, the code comment), with file:line evidence; $0.49. **`review` skill** (Opus): same 4 findings, verified against the source, plus 2 errors in the handoff's docs section; $1.49. The builder also noticed D1–D3 and the drift and listed them in the handoff, so only the blind run measures recall |
| 8 | Issue comments: the plan and handoff post; a security-tagged item is withheld | | GitHub | The throwaway issue, through item 7's `build` run; its plan carries one item tagged security-sensitive | **Pass**: the plan (issuecomment-6350116264) and the handoff (issuecomment-6350942064) posted to #123. The posted handoff says "withheld"; the marker stayed only in the local `.harness/work/123/handoff.md`, and the review confirmed it absent from the issue, PR and git history |
| 9a | Branch protection: a failing required check blocks the merge; a missing (pending) one blocks it | | GitHub + Owner | A draft PR into `main` with a deliberately failing test; the owner checks that GitHub refuses the merge. It's closed unmerged | **Pass** (owner): #126's `test (Debug)` and `test (Release)` failed and GitHub refused the merge (`BLOCKED`); closed unmerged |
| 9b | A push to `main` and a force push are refused | | Owner | Two commands the owner runs (the harness forbids them to Claude). The ruleset requires a PR, so both should be rejected | **Pass** (owner): a direct push to `main` and a force push were both rejected; `main` stayed at c3372ed |

## Findings

- **F-V0-1, fixed:** Claude Code treats every file under `.claude/` as sensitive, so the working state moved to `.harness/work/` (ProdHarnessConfig 0ff8334, BabyBuddyHelper #127).
- **F4, fallback adopted:** no "clear context" option at plan accept in the desktop app (item 2).
- **Headless only:** a `claude -p` session that starts a background agent emits its result after the first turn, keeps working until the agent returns, then doesn't exit (CC 2.1.304). It doesn't affect the app; scripted runs need a watchdog.
- **The builder is a reviewer too:** told not to touch the patch, Block B still listed all three defects and the drift in the handoff. Good for G2, but it means a non-blind review can't measure recall.
- **Desktop app start: 60k**, against 47.4k headless; both under 85k.

## Actual cost

About $3.8 of headless runs: the two Block B runs ($0.33 stopped by F-V0-1, $0.34 complete), the review ($1.49), the blind red-team ($0.49), the plan-mode probe ($0.39), and the hook, context and write-permission probes (≈ $0.7). V0 spend, not pilot spend.

## Estimated cost

The headless runs, Block B on Sonnet and Block C on Opus with the red-team: about $3–6, recorded as V0 spend, not pilot spend.

## Clean-up

Close the throwaway issue and PRs, delete `v0/base` and the throwaway branches, and run `close` where it applies. Nothing reaches `main`.
