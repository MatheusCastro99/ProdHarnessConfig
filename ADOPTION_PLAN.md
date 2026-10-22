# Adoption Plan: BabyBuddyHelper and InvoiceMe

Status: **decided (A1–A7, 2026-10-22); not started.** Written 2026-10-22. It follows [OPTIMIZATION_PLAN.md](OPTIMIZATION_PLAN.md) §10, "Next". This plan covers getting the harness built in this repo (`harness/`, `projects/`) into both projects, and retiring the study-era harness each one still carries.

## 1. What each repo carries today (inventory, 2026-10-22)

Both repos are clean on their default branches (BabyBuddyHelper `main`, InvoiceMe `master`).

| | BabyBuddyHelper | InvoiceMe |
|---|---|---|
| `.claude/CLAUDE.md` (tracked) | 6.1k characters. Points at 8 "always load before edits" docs. | 6.6k characters. 12-stage workflow; 5 "always load" doc groups |
| **"Always load" docs, read every session** | **84k characters ≈ 21k tokens** | **40k characters ≈ 10k tokens** |
| `.claude/agents/` (gitignored) | `historian.md`, `red-team.md` | `historian.md`, `red-team.md` |
| `.claude/skills/` (gitignored) | `review-guardrails`, `product-owner`, `ux-design` | `guardrails-review`, `ux-design` |
| Other `.claude/` files (gitignored) | — | `onboarding-follow-up.md` (**9 open questions, 18 notes**), `stale-docs.md` (an empty template) |
| Study-era context docs (tracked) | `docs/ai/`: `AI_CONTEXT.md` (15k), `context/` (ARCHITECTURE_DESIGN, CURRENT_STATE, DECISIONS 14.7k, ROADMAP 18.4k, UI_GUIDELINES 14.1k), `agents/` and `skills/` docs | `Harness_Config/`: `AI_CONTEXT.md`, `Context/` (Architecture_Design, Current_Focus, DataFlow, Decisions_Consistency, Development_Workflow 13.7k, UI_Guidelines, Working_Agreements) |
| Files that link to those paths | `.claude/CLAUDE.md` only | `.claude/CLAUDE.md`, `Docs/PRD.md`, `Docs/Project_Roadmap.md`, `Docs/README.md` |
| Claude workflows in CI | `claude-code-review.yml`: an automatic Claude review on every PR `opened`/`synchronize`/`ready_for_review`/`reopened`, using the owner's OAuth token. `claude.yml`: `@claude` on demand. | none |
| Measured check times (through S5) | fast ≈ 12s | fast ≈ 40s (lint 23s, app-load 18s); full adds a 12s build |

Under the new harness, the "always load" rule goes (D5). For BabyBuddyHelper alone, that removes ≈ 21k tokens from the start of every session, before the global overhead (§5.1 of the optimization plan).

## 2. Where each file goes

The rules from OPTIMIZATION_PLAN.md §5.3, applied file by file:

- **Context** that every session needs goes into `CLAUDE.md` (≤ 3k tokens).
- **Area conventions** become `.claude/rules/<area>.md` with `paths:`, kept short, with a pointer to the full doc.
- **Project knowledge** stays an ordinary doc, read on demand.
- **Workflow and session state** is retired. The skills and the issue carry it.

### BabyBuddyHelper

| Today | Becomes | Why |
|---|---|---|
| `.claude/CLAUDE.md` | Rewritten from the template, keeping the project facts and the coding constraints as **standing rules**: MAUI idioms; C# 14 / .NET 10; ADR-001 sources of truth; ADR-007 id-based CRUD; no CQRS, MediatR or Repository; tests with Core changes (ADR-018); layer and test placement; the no-auto-generated-branch-names rule | Every session needs them (D7) |
| `docs/ai/AI_CONTEXT.md` | **Retired** | D5: no always-read index |
| `docs/ai/context/CURRENT_STATE.md` | **Retired**; any still-useful content becomes an issue or a roadmap line | State lives in issues (§5.3) |
| `docs/ai/context/ARCHITECTURE_DESIGN.md`, `DECISIONS.md`, `ROADMAP.md` | **Kept** as docs read on demand, **moved to `Harness_Config/Context/`**, names unchanged (A2) | Project knowledge |
| `docs/ai/context/UI_GUIDELINES.md` (14k) | Kept and moved the same way, plus **`.claude/rules/ui.md`** (`paths: UI/**, **/*.xaml`) holding only the essentials (≤ 1k tokens), with a pointer to the full doc | The full 3.5k tokens would load on every UI edit |
| `docs/ai/agents/*`, `docs/ai/skills/*` (docs of the old tooling) | **Retired.** `docs/ai/` is then empty and removed | They describe tooling that is being replaced |
| `.claude/agents/historian.md` | **Retired** | D2 |
| `.claude/agents/red-team.md` | **Replaced** by the harness's, with `skills: [review-guardrails]` added (A3) | §7 |
| `.claude/skills/review-guardrails` (project regression traps) | **Kept, tracked**, preloaded by the red-team (A3) | Project knowledge the new red-team has no other source for |
| `.claude/skills/ux-design` | **Kept, tracked** (A4) | |
| `.claude/skills/product-owner` | **Retired** (A4) | Each kept skill adds a description to every session |
| `.gitignore` lines 367–368 (`.claude/agents`, `.claude/skills`) | **Removed**, so the harness is tracked (A1); `.claude/work/` and `.claude/settings.local.json` added | |
| `claude-code-review.yml` | **Triggers changed to `ready_for_review` only** (A6). Block C waits for it after marking the PR ready and triages its comments (§3) | |

### InvoiceMe

| Today | Becomes | Why |
|---|---|---|
| `.claude/CLAUDE.md` | Rewritten from the template, keeping the facts and the install and run commands (the checks move to `harness.json`), and the standing rules from `Decisions_Consistency.md` that apply everywhere | D7 |
| `Harness_Config/AI_CONTEXT.md` | **Retired** | D5 |
| `Harness_Config/Context/Development_Workflow.md`, `Working_Agreements.md` | **Retired.** The skills and the compressed agreements in `CLAUDE.md` replace them | D7, §5.3 |
| `Harness_Config/Context/Current_Focus.md` | **Retired** | §5.3 |
| `Harness_Config/Context/Architecture_Design.md`, `DataFlow.md`, `Decisions_Consistency.md` (the ADR log) | **Kept** as docs read on demand, **where they are** (A2) | Project knowledge |
| `Harness_Config/Context/UI_Guidelines.md` (2k) | Kept where it is, plus **`.claude/rules/ui.md`** (`paths: FRONTEND/src/**`) holding its essentials, with a pointer to the doc | §5.3 |
| `Docs/PRD.md`, `Project_Roadmap.md`, `README.md` links to `Harness_Config/` | Each link checked; links to retired files (`AI_CONTEXT.md`, `Development_Workflow.md`, `Working_Agreements.md`, `Current_Focus.md`) updated or removed | S1 flags them |
| `.claude/agents/*`, `.claude/skills/*` | Historian retired; red-team replaced, with `skills: [guardrails-review]` added (A3); `guardrails-review` and `ux-design` kept and tracked (A1, A3, A4) | |
| `.gitignore` lines 142–147 | `.claude/agents/`, `.claude/skills/`, `.claude/stale-docs.md`, `.claude/onboarding-follow-up.md` removed (A1, A5); `.claude/work/` added; `.claude/settings.local.json` kept | |
| `.claude/onboarding-follow-up.md` | Its 9 questions and 18 notes become **one GitHub issue with a checklist**, confirmed before posting, with security-sensitive items reported to the owner directly instead. Then the file is deleted (A5) | They are owner work, not session state |
| `.claude/stale-docs.md` | **Deleted**; it is an empty template, replaced by `.claude/work/<n>/stale-docs.md` | |

## 3. How it gets installed

**A new script in this repo: `scripts/install.cjs <target-repo> <project>`.** It is dry-run by default and writes only with `--apply`.

- **Copies** `harness/.claude/{lib,hooks,scripts,agents,skills,settings.json}`, and `projects/<project>/harness.json` → `.claude/harness.json`.
- **Never writes `CLAUDE.md` or `.claude/rules/`.** Those are authored per project, in the migration commit.
- **Writes `.claude/harness-manifest.json`** with this repo's commit and a hash of every file it installed. A later install (an upgrade) can then tell an untouched harness file from one edited locally, and refuses to overwrite a local edit without `--force`.
- **Lists conflicts before writing anything:** files that exist and weren't installed by the harness, such as today's `red-team.md`. They are replaced only when named with `--replace`.
- **Checks `.gitignore`** for the harness's needs and prints the lines to add: `.claude/work/` and `.claude/settings.local.json`, plus, under A1, the lines to remove. It doesn't edit `.gitignore` itself.
- **Per-project agent additions (A3).** `projects/<project>/install.json` lists the skills the red-team preloads, such as `{ "redTeamSkills": ["review-guardrails"] }`. The installer writes them into the installed `red-team.md` frontmatter, and the manifest records the result.
- Tests in `test/install.test.cjs` cover the dry run, apply, an upgrade, a refused local edit, conflicts, and the red-team skills.

**Harness changes needed first** (built and tested in this repo before either adoption PR):

1. **`install.cjs` and its tests**, as above.
2. **A6, the ready-for-review reviewer.** An optional `harness.json` field `reviewOnReady` names a CI workflow that reviews when a PR is marked ready (BabyBuddyHelper: `claude-code-review.yml`). After `gh pr ready`, the `review` skill waits for that run and triages its comments:
   - a blocking or fix-worthy one goes back to the owner, as a short G2 addendum
   - the rest are noted in the ready-to-merge note

   Its CI check isn't a required one, so it never blocks the merge by itself.
3. **The `docs` globs in both `projects/*/harness.json`** gain `Harness_Config/**/*.md`, so S1 flags the kept docs. Done 2026-10-22.

## 4. Steps per repo

Each repo gets **one adoption issue and one PR**, done in this session with the owner's approval at each outward step. It is not a pilot issue: the adoption is docs-heavy and unlike the work the §8 pilot measures.

1. **Open the issue** in the repo: "Adopt the production harness". It holds this plan's mapping for that repo. This is an outward action, confirmed first.
2. **Branch** `chore/<n>-adopt-harness` from the updated default branch.
3. **Commit 1, install:** `install.cjs --apply`, the `.gitignore` changes, and the replaced agents.
4. **Commit 2, context:**
   - `CLAUDE.md` rewritten from the template
   - `.claude/rules/ui.md`
   - the project skills kept under A3 and A4
5. **Commit 3, retire and move:**
   - `git rm` the retired docs
   - move the kept docs (A2)
   - update every link (S1 and a link check)
   - A5's follow-up items handled
6. **Verify locally:**
   - all tests pass
   - `node .claude/scripts/check.cjs full`
   - `/context` in a fresh session (D6 trigger: ≤ 85k)
   - the hooks fire on a throwaway edit
7. **Push, draft PR, CI green**, then the owner reviews and merges. The ruleset requires the CI checks and an up-to-date branch.
8. **Then V0 (§8.5) on the merged default branch.** This is the first time the full harness runs for real.

**Order (A7):**

1. BabyBuddyHelper first. The pilot starts there (D15).
2. InvoiceMe after BabyBuddyHelper's adoption PR merges and its V0 passes, with any harness fixes found there.
3. InvoiceMe's follow-up issue (A5) is opened during its adoption.

## 5. Risks

- **Existing knowledge lost in the move.**
  - `DECISIONS.md` and `UI_GUIDELINES.md` hold years of decisions, so they're *kept*, never condensed away. Only the rule files are short.
  - The retired files stay in git history.
- **Broken links.** S1, plus a check for links to `docs/ai/` and `Harness_Config/`, gates commit 3.
- **The harness's own first run is the adoption PR.** Its hooks are new to these repos. If a hook misbehaves, `settings.local.json` can turn it off for that session, and the fix goes into this repo.
- **The old automatic Claude review** (BabyBuddyHelper) keeps running on every push unless A6 changes it.

## 6. Decisions

| ID | Decision | Status |
|---|---|---|
| A1 | **Track the whole harness in each repo:** `.claude/agents`, `skills`, `hooks`, `scripts`, `lib`, `settings.json`, `harness.json`. This replaces today's gitignored "personal tooling". The shared `settings.json` calls these scripts, so a clone without them would break; tracked, they're versioned and reviewed in PRs. | Decided 2026-10-22 |
| A2 | **Kept context docs live in `Harness_Config/Context/` in both repos,** with file names unchanged. InvoiceMe's don't move. BabyBuddyHelper's `docs/ai/context/*` move there, and `docs/ai/` is removed. *(Recommended instead: the repos' docs folders.)* | Decided 2026-10-22 |
| A3 | **`review-guardrails` (BabyBuddyHelper) and `guardrails-review` (InvoiceMe) stay as tracked project skills,** preloaded by the red-team through its `skills:` frontmatter, written by the installer per project. | Decided 2026-10-22 |
| A4 | **`ux-design` stays in both repos as a tracked project skill; `product-owner` is retired.** | Decided 2026-10-22 |
| A5 | **InvoiceMe's 9 open questions and 18 notes become one GitHub issue with a checklist** (confirmed before posting; security-sensitive items go to the owner directly). Then `onboarding-follow-up.md` is deleted. | Decided 2026-10-22 |
| A6 | **BabyBuddyHelper's automatic Claude review runs once, on `ready_for_review`**, not on every push. `@claude` stays on demand. Because it runs after G2, Block C waits for it and triages its comments (§3, harness change 2). *(Recommended instead: disable it.)* | Decided 2026-10-22 |
| A7 | **BabyBuddyHelper first**, then InvoiceMe once BabyBuddyHelper's adoption has merged and its V0 has passed. | Decided 2026-10-22 |
