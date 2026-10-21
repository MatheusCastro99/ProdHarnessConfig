# Production Harness: Optimization Plan

Status: **all decisions made (D1–D17); not yet validated.** Use this as the guidance and reference when ProdHarnessConfig is implemented. The §8 pilot turns its estimates into measurements.
Owner: Matheus Castro. Written 2026-10-21.

Every recommendation here rests on one of four things: measured data from past session records (the study repo and BabyBuddyHelper), Anthropic's documentation (linked), an established engineering standard, or an owner decision (logged in §9). Estimates are labelled as estimates.

## Executive summary

**The problem.** The study repo's 12-stage workflow works, but it has 7 approval gates (O8) and costs too much (O9). Session records show where the money goes:

- A typical issue costs **about $10 at list price**: the median of 10 BabyBuddyHelper code issues was $9.99.
- Each session starts at **68–83k tokens** and grows to **~290k** without ever shrinking.
- Every call re-reads the whole context. Cost is therefore roughly *calls × context size*. Cache reads are 46% of it, cache writes 37%, output 18%.
- About 72k of the starting context is **global setup** (tools, plugin skill listings, connectors), not project docs.

The blueprint's cache-isolation idea (§1 of the blueprint) rests on a mechanism Claude Code doesn't have: there is no per-file caching. Its workflow compression (§2) was right in direction.

**The design.** Four blocks, two gates:

| Block | What happens | Model | Gate |
|---|---|---|---|
| **A · Scope** | Plan mode; the survey is delegated to a subagent; one plan with every decision and sub-phase | Opus | **G1**: approve the plan, which also clears the context |
| **B · Build** | Autonomous implement → check → commit loop; docs updated in the same commits; push and draft PR pre-authorized; ends with a handoff file | Sonnet (`opusplan`) | none |
| **C · Review** | Fresh session from the handoff; Opus red-team; findings triaged | Opus | **G2**: one decision on findings, docs and PR; the owner merges |
| **D · Close** | `/close` after merge: script cleanup plus memory condensing | (session's) | none |

**Rules that make it hold:**

- **Gates are session boundaries.** No session carries a large context forward, and none is resumed cold.
- **Checks run as hooks, not instructions.** The edited file is linted after each edit, Claude can't stop while fast checks fail, and a commit is blocked while it leaves docs stale.
- **Pushes to the default branch are blocked by GitHub branch protection**, not only by Claude Code rules.
- **CLAUDE.md is kept to ≤ 3k tokens.** Workflow detail lives in four skills; area conventions live in rules that load only for matching paths. No "read every doc first" rule.
- **Subagents default to Sonnet**; the red-team is pinned to Opus. Effort is high everywhere.

**Expected result (estimate):** about **$7.2–7.7 per issue, ~25% less**, with ≤ 6 owner turns instead of 6–32. Most of what remains is the ~80k global overhead that each block's session loads, and usually writes to the cache again (§8.2). D6 kept that overhead on purpose and is the first lever if the pilot misses its cost target.

**Validation (§8).** First a setup check. Then a pilot of 3 BabyBuddyHelper issues, including one where Block B runs twice from the same plan, Sonnet against Opus. Then 1–2 InvoiceMe issues, a project with no tests. Targets: median cost ≥ 25% below $9.99, every block ≤ 200k context, no more major red-team findings, zero bugs escaping to after merge.

**Before implementation**, the owner sets up branch protection on each adopting repository (§6.3).

---

## 1. Why this exists

The study repo, [HarnessConfigAndWorkflow](https://github.com/MatheusCastro99/HarnessConfigAndWorkflow), ended its validation run (#28) with two major owner findings:

- **O8:** the 12-stage workflow is good but clunky. It has 7 approval gates.
- **O9:** token usage is too high. One session per issue is not sustainable.

The study repo stays as it is: context-heavy and self-explanatory, for learning. This repo is the production variant, optimized for time, automation and cost. Starting input: [harness_optimization_blueprint.md](harness_optimization_blueprint.md).

## 2. Evidence baseline

Full detail and sources: [research/01-caching-and-context.md](research/01-caching-and-context.md).

#28 at list price came to $14.68:

| Share of cost | Where it went |
|---|---|
| 46% | cache reads |
| 37% | cache writes |
| 18% | output |

Other numbers from the same run:

- The main session was 84% of cost. Its context grew from 84k to 320k tokens (mean 218k) over 142 calls.
- The ~13-minute day-2 close cost 39% of the run. A single cold resume call was 12% of main-session cost.
- Read cost per call grows with context: about $0.017 at 84k, $0.064 at 320k.

About 72k of #28's 84k starting context was global setup: tool definitions, plugin skill listings and connector instructions. None of it was project docs (§5.1).

#28 was not an outlier. Every past issue session follows the same pattern: BabyBuddyHelper code issues have a median of $9.99 and a median peak context of 291k ([research/02-baseline.md](research/02-baseline.md), §8.1).

Mechanics that shape the design:

- The cache is a prefix match with no per-file caching. Repo edits and CLAUDE.md edits don't break it.
- What does break it: model switches, compaction, MCP or tool-set changes, and a gap longer than the TTL.
- TTLs: on a subscription, the main session gets 1h; subagents get 5m.
- CLAUDE.md, `@imports` and unscoped rules load at every start. Skills, `paths:` rules and subdirectory CLAUDE.md files load on demand.

## 3. Design principles

Each principle is derived from §2.

| # | Principle | Evidence |
|---|---|---|
| P1 | **Small at start.** Load only what every session needs; the rest loads on demand. | Read cost scales with context; docs advise CLAUDE.md under 200 lines and skills for workflow detail. |
| P2 | **Stay small.** Reading, surveying and verbose output happen in subagents or get filtered by hooks; only summaries reach the main session. | 84k → 320k growth with no shrink in #28; docs: "Delegate verbose operations to subagents". |
| P3 | **A gate is a session boundary.** Where the owner may step away, the work hands off through a file and the next block starts fresh. | Day 2 cost 39%. A cold resume of a large context is the single most expensive call. |
| P4 | **Deterministic over instructed.** Checks that must happen run as hooks or scripts, not as prose the model may skip. | Docs: CLAUDE.md is "context, not enforced configuration"; hooks can block. |
| P5 | **Fewer gates, not weaker guarantees.** Each removed gate is replaced by an automated check or folded into a remaining gate. | O8; the study's guarantees (independent review, owner decides every finding, no unplanned behaviour change) are kept. |
| P6 | **Model per role, chosen at boundaries.** Switching models is free at a fresh session and costly mid-session. | Docs: each model has its own cache. |
| P7 | **Measure before claiming.** Every change is validated with `research/scripts/cost.js` on a real run. | #28's raw token totals misread the cost by about 2× until they were priced. |

Note on P5: gates mostly cost the owner's time (O8), not tokens. Each owner turn adds only a few calls. The token savings (O9) come from P1–P3. The two goals are related but addressed separately.

## 4. Workflow: 4 blocks, 2 gates

**Status: decided (D1–D4, §9).** The plan and handoff templates are in §5.4–5.5, the hooks in §6, the models in §7.

```
 A · SCOPE ──🔒 G1──► B · BUILD ─────► C · REVIEW ──🔒 G2──► (owner merges) ──► D · CLOSE
 plan mode     clear   after the clear   fresh session                           /close
 Opus          ctx     Sonnet            Opus · red-team (Opus)                  script + memory
               on      autonomous loop   reads handoff
               accept  → handoff file
```

### How the 12 stages map to blocks

| Study stage | Block | What replaces its gate |
|---|---|---|
| 1 Gather | A | (no gate) |
| 2 Decisions 🔒 · 3 Sub-phases 🔒 · 4 Impl. plans 🔒 | A | One plan, one approval: **G1** |
| 5 Implement · 6 Test & refine | B | Hooks H1, H2, H4 (§6.2): lint each edit; no stop while fast checks fail; no commit while docs are stale |
| 7 PR + monitor 🔒 | B→C | D1: push and draft PR pre-authorized; CI watched by Auto-fix |
| 8 Red-team | C | (no gate) |
| 9 Triage 🔒 · 10 Historian 🔒 | C | One report, one decision: **G2** |
| 11 Ready to merge | C | (no gate; the owner merges) |
| 12 Memory flush 🔒 | D | D4 |

### Block A: Scope (gate G1)

- **Session:** fresh, in plan mode. `opusplan` puts plan mode on Opus 5.5 (D12); effort is high (D13). The owner invokes the `scope` skill.
- **Steps:**
  - The main session reads the issue and its comments.
  - It delegates the code survey to the read-only `surveyor` subagent on Sonnet (P2, D14). The surveyor returns a summary, not file contents, and reads the project docs only when they are relevant (D5).
  - It writes one plan containing:
    - facts checked, and facts in the issue that turned out wrong
    - open decisions, each as 2–3 options with a recommendation (Working Agreements format)
    - the sub-phases in order
    - for each sub-phase: the files that change and the check that verifies it
    - acceptance criteria
    - the docs likely to go stale

    The plan follows the §5.4 template and passes S3 before it is shown.
- **G1:** the owner approves the plan once, with edits if needed (`Ctrl+G` opens it in an editor).
  - Directional decisions go into a scope comment on the issue, posted as part of the same approval.
- **Exit:** approve with **clear context** (`showClearContextOnPlanAccept`). Block B starts from the plan alone (P3).
- **Kept from the study:** owner decides scope; options with a recommendation; scope changes go into the issue first.

### Block B: Build (autonomous)

- **Session:** the same session after the clear-on-accept. The plan is its only inherited context, and its step 0 invokes the `build` skill. `opusplan` now runs Sonnet 5.5 (D12).
- **Permission mode:** auto, with the classifier reviewing actions. Auto mode is Claude Code's built-in starting mode from v2.1.283. `defaultMode: auto` can't be set from project settings, only user settings or `--permission-mode`.
- **Loop for each sub-phase:**
  1. Implement. H1 lints each edited file and feeds errors back.
  2. Run the sub-phase's check from the plan. Projects without tests use an observable check (D8).
  3. Fix what fails.
  4. Update the docs that S1 flags.
  5. Commit, one commit per sub-phase. H4 blocks the commit while a flagged doc is neither updated nor acknowledged (D10).
- **Enforcement (P4):** the **H2 Stop gate** runs `checks.fast` and blocks stopping while they fail.
  - After 3 consecutive failures it lets Claude stop and report.
  - Claude Code's own cap of 8 forced continuations is never reached.
- **Output filtering (P2):** H3 cuts test and build output down to failures only (the pattern documented in the cost docs).
- **Escalation, kept from Working Agreements rule 5:** anything the plan does not cover, such as a behaviour change, a new dependency or a scope change, stops and asks. Auto mode still asks when the prompt or skill explicitly requires it.
- **Docs (D2):** doc updates land in the same commit as the code they describe, so docs never trail code and no separate doc pass is needed.
- **Exit:**
  1. Run `checks.full` once. It mirrors CI except for the minutes-long MAUI build, which stays the owner's step (D9).
  2. Push the branch and open a draft PR (D1). CI and review comments are watched by Auto-fix.
  3. Write the **handoff file** (§5.5 template; it must pass S3), then stop.

### Block C: Review (gate G2)

- **Session:** fresh, started with `--model opus` (D12). The owner invokes the `review` skill, which runs S3 on the handoff first and refuses to start without a valid one. Its inputs are the handoff file and the PR diff (P3). A small context also makes waiting at G2 cheap: a cold resume costs little.
- **Red-team:** a background subagent with `model: opus` in its frontmatter (§7.2). It reviews the diff against the plan's acceptance criteria and the docs against the code (D2), and returns scored findings. The full diff goes to the red-team, not into the main session.
- **Triage:** the main session runs each finding and review comment through the three questions (reachable today? affects users? fix cost justified?) and recommends fix or decline.
- **G2:** one report holds:
  - PR link and CI status
  - each finding and comment with its recommendation
  - the docs diff
  - acceptance criteria met or not
  - the owner's own pre-merge steps, such as the MAUI build (D9)

  The owner decides everything in one reply.
- **Fix loop:** approved fixes are applied, then one narrow red-team re-review of the fixes only. Whatever remains after that goes to a follow-up issue, unless the owner asks for another round. The study allowed two loops; this allows one, then a follow-up.
- **Exit:** a "ready to merge" note. **The owner merges.** Auto mode also blocks merging a PR no human approved.

### Block D: Close

- **Trigger (D4):** the owner runs `/close` after merging. Claude Code has no "PR merged" hook event. The skill sets `disable-model-invocation: true`, so it runs only when the owner calls it.
- **Script part (deterministic, S2):**
  - check with GitHub that the PR is merged
  - update the local default branch
  - delete the merged branch
  - delete the issue's plan, handoff and stale-docs files
- **Model part:** condense notes about the issue into outcome, deferred follow-ups and lasting lessons. Memory edits are made and listed in the close report, with no pre-approval (D4). In the study this ran at epic close or after an isolated issue; keep that cadence.

### What the blueprint proposed that this changes

| Blueprint | Change | Why |
|---|---|---|
| §1 Cache isolation in AI_CONTEXT.md: static files "pinned" in the cache | Dropped, along with AI_CONTEXT.md (D5) | There is no per-file caching (§2); the starting context is mostly global setup (§5.1) |
| Block B: Claude runs `npm test`, `dotnet test` and so on | Per-project fast and full checks in `harness.json`, plus a named check per sub-phase (D8, D9) | InvoiceMe has no test suite; a MAUI build takes minutes |
| A shell script in `.claude/bin/` for doc tracking | Node.js scripts in `.claude/scripts/` (S1), enforced by the H4 commit gate | Cross-platform (D11); deterministic (P4) |
| Block C "PR automatically generated" | Push and draft PR become an explicit standing authorization (D1), not an implicit side effect | They are outward-facing; the authorization must be a recorded decision |
| Red-team and historian run simultaneously | Historian dropped; docs updated inline in Block B (D2) | A parallel doc pass can go stale when fixes change the code. Inline updates never trail the code. |
| Block D "triggered upon PR merge" | User-invoked `/close` (D4) | No such hook event exists in Claude Code |
| (not in blueprint) | Session boundaries at A→B and B→C | Largest measured cost driver (§2) |
| (not in blueprint) | Fix loop capped at one re-review | Fewer calls; remaining items go to follow-up issues |

## 5. Context layout

**Status: decided (D5–D7, §9).**

### 5.1 What fills the starting context (measured)

The first request of #28 was 84,097 tokens. The request record (`api-request-shape` plus the first message blobs) gives each part's size in characters. Converting at the request's average of 2.84 characters per token gives an estimate for each part:

| Part | ≈ Tokens | Controllable? |
|---|---|---|
| Tool definitions (53 tools) | 45.5k | Partly. **The Artifact tool alone is ~12.6k.** Most of the rest are built-in and desktop-app tools. |
| Claude Code system prompt | 11.1k | No |
| Skill listing (all plugins and synced skills) | 10.8k | **Yes**: the `enabledPlugins` and `syncClaudeAiSkills` settings, and description caps |
| The invoked skill's body | 6.3k | Yes: the size of the workflow skill |
| MCP server instructions (claude.ai connectors) | 4.2k | **Yes**: the `disableClaudeAiConnectors` setting |
| Names of deferred tools | 3.4k | Mostly connectors' tools; shrinks with the line above |
| Agent types, environment, git status | 2.4k | Little |
| Project CLAUDE.md | 0 | The InvoiceMe snapshot had none |

**Finding:** in #28 the project layer was not the problem. About 72k of the 84k tokens was the owner's *global* setup plus the desktop app's own tools, and every session and every call carries it.

Settings that can shrink it, from the [settings docs](https://code.claude.com/docs/en/settings) and the [settings reference](https://code.claude.com/docs/en/settings-reference):

| Setting | Effect |
|---|---|
| `enableArtifact: false` | Removes the Artifact tool. Honored from any file. |
| `disableClaudeAiConnectors: true` | Removes the claude.ai connectors (Figma, Docs, Slides, Microsoft Learn and others). Honored from any file. |
| `enabledPlugins` | Turns individual plugins on or off per scope. |
| `syncClaudeAiSkills: false` | Stops loading the skills synced from claude.ai. Not honored in the shared project file, only in user, local or managed settings. |
| `skillListingMaxDescChars`, `skillListingBudgetFraction` | Caps each description in the skill listing and the listing's share of context. |

These settings take effect at session start, so they don't break the cache mid-session.

**Estimates:**

- Turning off all three (Artifact, connectors, unrelated plugins) would remove about 20–25k tokens, for a startup of about 55–60k.
- **D6 keeps the Artifact tool and the connectors and turns off only the unrelated plugins.** That removes about 4–5k, for a startup of **about 78–80k** in the desktop app.
- The CLI may load fewer app-specific tools; that is not measured.
- **Verify with `/context` during implementation.** If the measured cost later justifies it, the Artifact tool and the connectors can still be turned off.

For comparison, the study repo's own rule ("read README, Vision, Roadmap, AI_CONTEXT and Context/* before any edit") adds 69k characters, about 17–20k tokens, on top of the global overhead before any work starts.

### 5.2 Budget

These are targets to validate in §8, not measurements.

| Layer | Budget | Why |
|---|---|---|
| Global overhead (system, tools, listing) | ≤ 80k | §5.1 estimate under D6 |
| Project layer (CLAUDE.md and unscoped rules) | **≤ 3k tokens (~120 lines)** | Docs recommend under 200 lines. This layer is in every call of every block and every subagent. |
| Block skill body | ≤ 2.5k tokens each | Loaded once per block. The docs re-attach at most 5k per skill after compaction, so keep the essentials at the top. |
| Plan (A → B) | ≤ 3k tokens | It is B's only inherited context |
| Handoff (B → C) | ≤ 2k tokens | It is C's only inherited context |
| Start of Block B | ≈ 88k | Global + project + skill + plan |
| Start of Block C | ≈ 87k | Global + project + skill + handoff; the full diff goes to the red-team, not the main session |

### 5.3 Where each instruction lives

| Content | Home | Loads |
|---|---|---|
| Repo facts, build, test and lint commands, branch and commit rules, safety rules, a "where things are" path list, compact instructions | `CLAUDE.md` | Every session |
| The Working Agreements rules every block needs (owner decides; stop on an unplanned behaviour change; options with a recommendation; the three triage questions) | `CLAUDE.md`, compressed to about 12 lines (D7) | Every session |
| Conventions for one area (UI, API, data layer, XAML…) | `.claude/rules/<area>.md` with `paths:` | When Claude touches matching files |
| Block A procedure and plan template | skill `scope` | On invocation |
| Block B loop and handoff template | skill `build`, invoked as step 0 of every plan | On invocation |
| Block C procedure and G2 report format | skill `review` | On invocation |
| Block D procedure | skill `close` (`disable-model-invocation: true`) | On invocation |
| Independent review | agent `red-team`, with `model` set explicitly | When spawned |
| Code survey and checks | agent `surveyor` on Sonnet; built-in Explore also runs on Sonnet (D14) | When spawned |
| Architecture, Data Flow, UI Guidelines, the ADR log | Project docs, read on demand by the Block A survey | Only when needed |
| Current state of the work | The issue, plus `.claude/work/<issue>/{plan,handoff,stale-docs}.md` (gitignored; deleted by `/close`) | When a block starts |

How the study's pages map:

- `Development_Workflow` → the four skills
- `Working_Agreements` → the compressed CLAUDE.md section
- `Decisions_Consistency` → standing rules go to CLAUDE.md (global) or `paths:` rules (one area); the ADR log stays a doc
- `Current_Focus` → dropped; the issue, the plan and the handoff carry state, as the study already intended
- `AI_CONTEXT.md` → dropped (D5)

Two cautions from the docs:

- `@imports` load in full at launch, so they don't save context. Don't use them to "lazy-load" docs.
- `paths:` rules and nested CLAUDE.md files get summarized away by compaction until they match a file again. A rule that must survive compaction belongs in the root CLAUDE.md.

### 5.4 Plan template (output of Block A)

```markdown
# Plan: #<issue> <title>
0. Invoke the `build` skill before anything else.
## Scope (decided at G1)
<2–4 lines; link to the issue's scope comment>
## Facts checked / corrected
## Acceptance criteria
- [ ] …
## Sub-phases
### 1. <name>
- Files: …
- Change: …
- Check: <command or observable result>
## Docs likely to go stale
## Out of scope
```

### 5.5 Handoff template (output of Block B, input of Block C)

```markdown
# Handoff: #<issue> → Review
Plan: .claude/work/<issue>/plan.md · Branch: <branch> · PR: <url> (draft)
## Commits
<sha> <message>  (one line per sub-phase)
## Checks
<command> → pass/fail, with counts. CI: <status at handoff>
## Deviations from the plan
- <what changed, and why> (empty if none)
## Decisions made inside the plan's latitude
- <small choices the reviewer should know about>
## Docs
Updated: <files>. Script-flagged but left unchanged: <file — why>
## Open questions for G2
## Known gaps / risks
```

Rules:

- Block B writes the handoff file last, before stopping.
- Block C's `review` skill refuses to start without one.
- Each section is filled in, or marked "none" — never left out.
- Keep it within 2k tokens. The diff itself stays in git and isn't copied in.

## 6. Automation: hooks and scripts

**Status: decided (D8–D11, §9).**

### 6.1 Ground rules

- **Command hooks only.** `prompt` and `agent` hook types make model calls, so every one would cost tokens.
- **Silent on success.** Hook output reaches Claude's context with the next request (`additionalContext`, stderr on exit 2). A passing hook prints nothing; a failing one prints at most ~40 lines.
- **Cross-platform.** Hooks use the `command` + `args` form (`"command": "node"`), with all scripts in Node.js (D11), so the same config runs on Windows and in CI.
- **Explicit `timeout` on every hook.** Defaults vary by event. Fast checks must finish well inside the timeout.
- **One project config file**, `.claude/harness.json`, holds everything project-specific. Hooks and scripts are generic and read it:

```jsonc
{
  "defaultBranch": "main",
  "checks": {
    "fast": ["<seconds-scale commands; run by the Stop gate>"],
    "full": ["<mirrors CI; run once before push>"]
  },
  "fileTools": {               // per glob: format, then lint, the one file
    "FRONTEND/src/**/*.{js,jsx}": { "lint": "npx eslint --max-warnings 0 {file}" },
    "NODEAPI/**/*.js": { "lint": "node --check {file}" }
  },
  "docs": ["Docs/**/*.md", "README.md", ".claude/CLAUDE.md", ".claude/rules/**/*.md"],
  "docmap": { "NODEAPI/routes/**": ["Docs/API.md"] }   // concept links no path text reveals
}
```

What the source projects actually run (their CI):

| | Fast check (Stop gate) | Full check (before push) |
|---|---|---|
| **InvoiceMe** | `npm run lint` in `FRONTEND`; `node --check server.js` in `NODEAPI`. **No test suite exists**: the `NODEAPI` `test` script is a stub that exits 1. | the fast checks plus `npm run build` in `FRONTEND`, the same as CI |
| **BabyBuddyHelper** | `dotnet test --project test/BabyBuddyHelper.Tests/...` (net10.0, no MAUI workload) | the same tests. The MAUI build (`dotnet build BabyBuddyHelper.csproj -f net10.0-windows10.0.19041.0`) is **not run by the harness**: the owner runs it before merging (D9), and CI's `build.yml` runs it on the PR. |

Two things follow from this:

- **InvoiceMe has no tests.** The blueprint's Block B assumes `npm test` exists, which isn't true there. D8: the gate is CI's checks plus each sub-phase's named check.
- **A MAUI build takes minutes.** D9: it stays out of the harness and is the owner's step before merge.

### 6.2 Hooks

| ID | Event · matcher | Script | What it does | Output |
|---|---|---|---|---|
| H1 | `PostToolUse` · `Edit\|Write` | `file-check` | Formats, then lints, the one edited file, using its `fileTools` entry. On lint errors, exits 2: the tool already ran, and the errors go back to Claude. | Silent, or ≤ 20 error lines |
| H2 | `Stop` | `check-gate` | Skips if the working tree matches the last passing tree (hash stored in `.claude/work/.lastpass`). That makes it near-free in Blocks A and C and after a pass. Otherwise runs `checks.fast`; on failure returns `decision: "block"` with the trimmed failures. After **3** consecutive failures it lets Claude stop, with `additionalContext` saying to report the failure. That limit is below Claude Code's own cap of 8, because each forced continuation is a full-context call. | Silent, or ≤ 40 lines |
| H3 | `PreToolUse` · `Bash`, with an `if` filter on the configured check, test and build commands | `quiet` | Rewrites the command (`updatedInput`) to run through a wrapper. The wrapper keeps the exit code and prints a one-line summary plus failures only. This is the pattern the [cost docs](https://code.claude.com/docs/en/costs#offload-processing-to-hooks-and-skills) recommend. | Summary + failures |
| H4 | `PreToolUse` · `Bash`, `if: Bash(git commit *)` | `stale-docs --staged --gate` | D2 enforcement. If the staged code changes flag docs that are neither staged nor acknowledged, the commit is denied, with the list as the reason (D10). | Silent, or the list |
| H5 | `SessionStart` · `startup\|clear` | `session-state` | One line of state for D3's fresh sessions: "Plan for #N in progress → Block B" or "Handoff for #N ready → run `/review`". | ≤ 60 tokens |

Not used, and why:

- `UserPromptSubmit`: nothing needs checking per prompt.
- `PreCompact`: blocking compaction risks hitting the context limit.
- `PreModelSwitch`: model choice is made at session boundaries anyway (P6).

### 6.3 Push and PR guard (enforcing D1)

The [permissions docs](https://code.claude.com/docs/en/permissions) warn that Bash rules which constrain arguments are fragile. `Bash(git push *)` does not match `git -C . push`. So D1 is enforced in three layers, strongest first:

1. **GitHub branch protection or a ruleset on the default branch:** require a pull request, block force pushes. This runs on the server and is the real guarantee. It is a one-time owner action per repository, outside this harness.
2. **The auto-mode classifier.** It already blocks force pushes and merging a PR that no human approved.
3. **Rules in `.claude/settings.json`:**
   - `allow`: `Bash(git push origin *)`, `Bash(git push -u origin *)`, `Bash(gh pr create --draft *)`, `Bash(gh pr view *)`, `Bash(gh pr checks *)`
   - `deny`: `Bash(git push * <default>)`, `Bash(git push --force *)`, `Bash(git push -f *)`, `Bash(gh pr merge *)`

   Here `<default>` is the project's `defaultBranch`: `main` in BabyBuddyHelper, **`master` in InvoiceMe**. A rule hard-coded to `main` would not protect InvoiceMe.

   Deny wins over allow. Allow rules in the shared file need workspace trust; deny rules apply right away.

### 6.4 Scripts

**S1 `stale-docs`** — maps changed files to the docs that may now be wrong.

- **Input:** `--staged` (the H4 gate) or `--range <base>..HEAD` (the handoff and the review).
- **Matching rules**, in order:
  1. `docmap` globs.
  2. The doc's text contains the changed file's repo-relative path.
  3. The doc's text contains the file's basename, unless it is on a stoplist of generic names (`index.js`, `package.json`, `README.md`, and similar).
  4. The doc's text contains the file's directory path.
- **Deleted or renamed files** are flagged first, because they leave dangling references.
- **Output:** `doc ← file (rule)`. With `--record`, it appends to `.claude/work/<issue>/stale-docs.md`.
- **Acknowledging a flag:** a line `ack: <doc> — <why unchanged>` in that file clears it for H4. Acks are copied into the handoff ("Script-flagged but left unchanged").
- **Limit:** drift that never names a path is invisible to the script. `docmap` covers known concept links, and the red-team checks docs against code (D2).

**S2 `close <issue>`** — the script half of D4.

1. Looks up the PR for the issue's branch with `gh pr view <branch> --json state,mergedAt`. **Aborts unless it is `MERGED`.**
2. `git switch <default>`, then `git pull --ff-only`.
3. `git branch -d <branch>`. A squash merge makes `-d` refuse, because the commits differ. In that case it falls back to `-D` **only because GitHub reported the PR merged**, and says so in the report.
4. `git fetch --prune`.
5. Deletes `.claude/work/<issue>/`.
6. Lists the memory files that mention `#<issue>`, for the skill's model half to condense.

Prints a short report and changes nothing outside the repository except those memory files.

**S3 `handoff-check`** — the review skill runs it before anything else.

- It checks that every §5.5 section is present (filled in, or "none") and that the file is within ~2k tokens (characters ÷ 4).
- It fails closed: no valid handoff, no review.
- The scope skill runs the same check on plans against §5.4.

**S4 `cost`** — [research/scripts/cost.js](research/scripts/cost.js). It already exists and is used in §8.

### 6.5 File layout in an adopting project

```
.claude/
  settings.json          hooks (H1–H5), permissions (§6.3), enabledPlugins (D6), showClearContextOnPlanAccept,
                         model: opusplan (D12), effortLevel: high (D13), env CLAUDE_CODE_SUBAGENT_MODEL=sonnet (D14)
  harness.json           defaultBranch, checks, fileTools, docs, docmap
  CLAUDE.md              ≤ 3k tokens (§5.2)
  rules/<area>.md        paths: rules
  skills/{scope,build,review,close}/SKILL.md
  agents/red-team.md     model: opus, effort: high
  agents/surveyor.md     model: sonnet, effort: high, read-only tools
  hooks/                 file-check, check-gate, quiet, session-state
  scripts/               stale-docs, close, handoff-check
  work/                  gitignored; per-issue plan, handoff, stale-docs; .lastpass; hooks.log (§8.3)
```

## 7. Models and subagents

**Status: decided (D12–D14, §9).**

### 7.1 Evidence

**From #28** (main session on Opus 5.5 at high effort; subagents as noted):

| Agent | Model | Calls | Starting → peak context | Output, and the share that was thinking | Cost |
|---|---|---|---|---|---|
| Main | Opus 5.5 | 142 | 84k → 320k | 113k, 21% | $12.35 |
| red-team ×2 | Opus 5.5 (inherited) | 30 | 12k → 100k | 1.3k, 4% | $0.99 |
| surveyor ×4 | Sonnet 5.5 | 35 | 7–8k → 79k | 27k, 40% | $0.90 |

- **Subagents start small** (7–12k, against the main session's 84k) because they get their own short system prompt and tool list. Delegating is cheap per call. Most of a subagent's cost is its first cache write, which uses the 5m TTL.
- **Thinking was about 4% of total cost** (21% of output × 18% output share). Effort affects cost mostly through *how many calls and checks* the model makes, not through thinking tokens.
- **Sonnet as surveyor worked:** its checks found 15, 2 and 3 issues before each checkpoint (#28 result). There is no evidence either way on Sonnet as the main implementer; the study never tried it.

**From the docs** ([model config](https://code.claude.com/docs/en/model-config), [models overview](https://platform.claude.com/docs/en/about-claude/models/overview), [costs](https://code.claude.com/docs/en/costs)):

- **Prices** (in / cache read / out, per MTok):

  | Model | Input | Cache read | Output |
  |---|---|---|---|
  | Opus 5.5 | $4 | $0.20 | $20 |
  | Sonnet 5.5 | $2 | $0.10 | $10 |
  | Haiku 5.5 | $0.10 | $0.01 | $0.50 |

  **Sonnet is exactly half of Opus on every token type.**
- **Positioning:**
  - Opus 5.5: "long-running agentic coding"; the platform docs say to start with it "for most workloads".
  - Sonnet 5.5: "best combination of speed and intelligence". The Claude Code cost docs say it "handles most coding tasks well", and that Opus is for "complex architectural decisions or multi-step reasoning".
  - Haiku 5.5: "simple tasks".
  - Fable 5.1 ($10/$50): long-horizon work. Not needed here.
- **Effort:**
  - Claude Code defaults to `medium` on all three 5.5 models.
  - Doc guidance: `medium` for clear-scope features; `high` where verification matters (bug fixes in existing code); `max` "prone to overthinking".
  - On the 5.5 models, changing effort mid-session **keeps the cache**.
- **`opusplan`** uses Opus in plan mode and Sonnet otherwise. Each plan-mode toggle is a model switch and so a cache miss. Under D3 the switch falls exactly at the clear-on-accept boundary, where the cache is rebuilt anyway, so it costs nothing extra.
- **Subagent model order:** the per-call `model` parameter → the agent's `model` frontmatter → `CLAUDE_CODE_SUBAGENT_MODEL` → inherit the parent's. The built-in Explore and general-purpose agents inherit the main model unless one of the first three is set.
- **Subscription limits:** "Opus limit" and "Sonnet limit" messages exist (costs docs), so splitting work across models also spreads plan usage.

### 7.2 Proposed model per role

Effort is **high for every role** (D13).

| Role | Model | Why |
|---|---|---|
| Block A: scope (main, plan mode) | Opus 5.5 (`opusplan`) | Decisions and decomposition here carry through the autonomous Block B. The context is small and the calls are few. |
| Block B: build (main) | **Sonnet 5.5 (`opusplan`, D12)** | Clear scope, a plan per sub-phase, and deterministic gates (H1, H2, H4) catch mechanical errors. This is the block with the most calls, so the halved price matters most here. |
| Block C: review (main) | Opus 5.5 (`--model opus`) | Triage needs judgment. The context is small (≈ 87k at start) and there are few calls. |
| Block D: close | session's model | Mostly script. A skill `model` override would cost a full cache miss for one turn. |
| red-team | **Opus 5.5, `model: opus` in frontmatter** | Independent review is where quality matters most, and the Opus red-team is the safety net for a Sonnet builder. About $0.50 per run in #28. |
| surveyor (A), stale-doc and check passes | Sonnet 5.5 | Proven in #28. Half the price of inheriting Opus. |
| Any other subagent | Sonnet, via `CLAUDE_CODE_SUBAGENT_MODEL` (D14) | Stops built-in agents from silently inheriting Opus. |

**Not adopted:**

- **Haiku for surveys:** cheapest, but a survey needs code comprehension, and Haiku is documented for simple tasks. It may be worth a later trial for pure lookups; that trial is not part of the §8 pilot.
- **Fable:** higher price; the workflow keeps tasks within a sitting.
- **A 1h subagent cache TTL** (`subagentPromptCacheTtl`): it would only pay off if a red-team re-review resumed more than 5 minutes later and saved more than the doubled write cost. Expected gain is about $0.10 per issue. Keep the default.

### 7.3 Expected effect

This is arithmetic on #28's split, not a measurement. If Block B is about half of main-session cost, Sonnet for Block B cuts main-session cost by about a quarter, on top of the context savings from D3 and D5. Moving surveyor-type work off Opus is already reflected in #28's figures.

## 8. Measurement and validation

**Status: decided (D15–D17, §9).**

### 8.1 Baseline (measured)

Detail: [research/02-baseline.md](research/02-baseline.md). Every issue session priced from local records, Opus 5.5 era, at list price:

| | Issues | Median cost per issue | Median peak context | Owner turns |
|---|---|---|---|---|
| **BabyBuddyHelper code issues** (the production baseline) | 10 | **$9.99** (range $3.08–$20.21) | 291k | 6–32 |
| Study-repo docs issues (12-stage workflow) | 5 | $10.01 | 289k | 13–27 |

Every one of them starts at 68–83k, grows to 144–409k, and never shrinks.

### 8.2 Expected cost under this plan (estimate, to be tested)

Assumed per issue, from the baseline's call counts:

| Block | Model | Calls | Context | Cost |
|---|---|---|---|---|
| A | Opus | 20 | 80k → 120k | ≈ $1.8, plus surveyor ≈ $0.2 |
| B | Sonnet | 70 | 88k → 200k | ≈ $2.5 |
| C | Opus | 25 | 87k → 130k | ≈ $1.9, plus red-team ≈ $0.5–1.0 |
| D | | | | ≈ $0.3 |

**Total ≈ $7.2–7.7, about 25% below the $10 median.**

Most of the remaining cost is the ~80k global overhead. It is re-read on every call, and in each block it is usually written to the cache again at the 1h rate:

- Block B switches to Sonnet, and each model has its own cache.
- Block C's Opus session usually starts more than an hour after Block A's last call.

The exception: a session on the same model within the TTL reads the shared system-and-tools prefix from cache. #28's first call read 56k that an earlier session had cached. If the validation shows that, the next lever is D6 (turning off the Artifact tool and the connectors). Re-deciding it would save roughly $1 more per issue.

### 8.3 Metrics recorded per issue

| Metric | Source |
|---|---|
| Cost by block and by subagent, split by token type | `cost.js` on the block's session (D3 makes each block its own session) |
| Starting context per block; peak context per block | the first and largest call in each session; `/context` once per project at V0 |
| Calls per block; owner turns; active minutes | `sessions-survey.js` |
| H2 forced continuations; H2 hits of the 3-failure cap; H4 denials; acks | hook logs (each hook appends one line to `.claude/work/hooks.log`) |
| Handoff and plan check failures | S3 output |
| Red-team findings by severity; G2 decisions (fix or decline); number of fix loops | the G2 report |
| Escapes: bugs found after merge that trace back to the issue | issues labelled to the original issue within 4 weeks |

Session transcripts contain personal data such as the email address, so run records stay **out of git**. Only the metrics table is committed.

### 8.4 Targets (hypotheses)

| Target | Threshold | Basis |
|---|---|---|
| Cost per issue | Median **≥ 25% below $9.99** over the pilot | §8.2 estimate |
| Peak context | **≤ 200k** in every block | §5.2 budgets plus growth |
| Starting context | ≤ 85k in the main session (`/context`) | §5.2: global ≤ 80k plus project layer ≤ 3k, with slack |
| Owner turns | **≤ 6** per issue (G1, G2, merge, `/close`, plus slack) | Two gates replace seven |
| Quality | Red-team majors per issue no higher than the first runs' median; **zero escapes** traced to a pilot issue | P5: fewer gates, not weaker guarantees |

### 8.5 Protocol

**V0: setup check, no real issue.** In each adopting repo:

- `/context` shows ≤ 85k at start.
- Seeded tests make each hook fire once: a lint error (H1), a failing test (H2), a filtered test run (H3), a flagged doc (H4), and state lines (H5).
- `close` runs on a throwaway merged branch.
- A push to `main` and a force push are refused by branch protection.

**V1: pilot (D15).** Three real BabyBuddyHelper issues of small-to-medium size, under the full configuration (D12 `opusplan`, D13 high effort). Record the §8.3 metrics for each issue.

**V2: Block B model comparison (validates D12).**

- Method (D16): replay Block B on the same approved plan in two worktrees, once on Sonnet and once on Opus.
- Compare Block B cost, H2 continuations, red-team majors, and whether a fix loop was needed.
- Opus-only B wins only if it avoids a fix loop or a major finding that Sonnet-B produced. Cheaper alone is not enough to keep Sonnet if it adds rework.

**V3: a project without tests.** InvoiceMe, 1–2 issues, to validate D8. The plan's named checks must show up as evidence in the handoff.

**What a result triggers:**

| Result | Action |
|---|---|
| Starting context > 85k | Revisit D6 |
| H2 hits the 3-failure cap on more than 1 in 5 issues | Review the fast checks and the plans' check definitions |
| A peak context > 200k | Find which reads entered the main session; move them to a subagent or a hook |
| S3 fails more than once | Tighten the handoff or plan template |
| Cost target missed but quality held | Re-decide D6, and the effort for B (`medium`) |
| Quality target missed | Restore a gate where the escape slipped through, before cutting any further cost |

**Done:** the targets hold across the pilot. Then this plan's status moves to "validated", and the measured numbers replace the estimates in §8.2.

## 9. Decisions log

| ID | Decision | Status |
|---|---|---|
| D1 | **Push and draft PR pre-authorized.** Allowed: `git push` to non-default branches and `gh pr create --draft`. Denied: push to the default branch (`main` or `master`, §6.3), force push, and merge. G2 reviews the PR. | Decided 2026-10-21 |
| D2 | **Docs updated inline in Block B.** A script maps changed paths to the docs that reference them. Doc updates go in the same sub-phase commit as the code. The red-team checks docs against code. No historian subagent. | Decided 2026-10-21 |
| D3 | **Gates are session boundaries.** A→B: approve the plan with clear context, so the plan is the handoff. B→C: Block B writes a handoff file, and Block C starts in a fresh session. Chosen over `/compact` because the file can be read and edited, survives across days and machines, gives triage a stated record of intent, and is cleaned up by `/close`. Estimated saving over keeping one session: ~$1–5 per issue (not yet measured). Risk: a thin handoff, addressed by a fixed template (§5). | Decided 2026-10-21 |
| D4 | **`/close` skill, no gate.** The owner invokes it after merging. A script deletes the issue's own scratch files and prunes the branch. Memory edits are made and listed in the report, with no pre-approval. | Decided 2026-10-21 |
| D5 | **Drop the AI_CONTEXT.md index; docs read on demand.** CLAUDE.md keeps a short "where things are" path list. Architecture, Data Flow, UI and the ADRs are read by the Block A survey only when relevant. Area conventions become `paths:` rules. | Decided 2026-10-21 |
| D6 | **Only unrelated plugins off.** In project settings, `enabledPlugins` is false for marketing, figma, design, productivity, dataviz and pdf-viewer (~4–5k). The Artifact tool and the claude.ai connectors stay on, so their ~18k is accepted. Skill descriptions are not capped. | Decided 2026-10-21 |
| D7 | **Working Agreements compressed into CLAUDE.md** (~12 lines). Every block and the red-team see them, and they survive compaction. | Decided 2026-10-21 |
| D8 | **Projects without tests are gated on their CI checks plus the plan's checks.** The checks mirror CI: lint and `node --check` as fast checks, plus the build before push (§6.1). Every sub-phase in the plan names an observable check, such as a request, a page or a value. Adding tests to InvoiceMe is a separate follow-up, not something the harness requires first. | Decided 2026-10-21 |
| D9 | **The Stop gate runs fast checks only.** The MAUI build is not part of the harness: the owner runs it before merging into the default branch, and the G2 report lists it as the owner's step. `checks.full` (before push) holds only checks that take seconds to a minute; for BabyBuddyHelper that means the tests, without the MAUI build. | Decided 2026-10-21 |
| D10 | **Stale-docs blocks the commit until each flagged doc is updated or acknowledged.** An `ack: <doc> — <why>` line clears a false positive, and acks are copied into the handoff for G2. | Decided 2026-10-21 |
| D11 | **Hooks and scripts are written in Node.js.** It runs the same on Windows, macOS, Linux and CI, and reads hook input JSON natively. Node is a prerequisite on the machine, including for .NET projects. | Decided 2026-10-21 |
| D12 | **Block B builds on Sonnet through `opusplan`.** Opus 5.5 in plan mode (Block A), Sonnet 5.5 after plan accept (Block B). The switch falls on the clear-on-accept boundary, so it costs no cache. Block C sessions start with `--model opus`. §8 validates this against an Opus-only run. | Decided 2026-10-21 |
| D13 | **High effort everywhere**: every block and every subagent, as #28 ran. Set it as the project default (`effortLevel`) and in each agent's `effort` frontmatter. On the 5.5 models a later change keeps the cache, so §8 can still test `medium` for Block B. | Decided 2026-10-21 |
| D14 | **`CLAUDE_CODE_SUBAGENT_MODEL=sonnet`** in the project `env`. Built-in Explore and general-purpose agents run on Sonnet. The red-team keeps `model: opus` in its frontmatter, which takes precedence over the env var. | Decided 2026-10-21 |
| D15 | **Pilot: 3 issues in BabyBuddyHelper, then 1–2 in InvoiceMe.** Start where tests exist and the baseline was measured. InvoiceMe follows as V3, to validate D8. | Decided 2026-10-21 |
| D16 | **Compare the Block B models by replaying B on the same plan.** For one pilot issue, after G1, Block B runs twice from the same approved plan in two worktrees: once on Sonnet, once on Opus. Only one branch continues to Block C. Extra cost: one Block B, about $2.5–5. | Decided 2026-10-21 |
| D17 | **The §8.4 targets stand as proposed.** | Decided 2026-10-21 |

## 10. Open questions

- How do subscription plan limits weigh cache reads? Observe with `/usage` attribution.
- #16's onboarding run can't be priced: only its orchestration session is on record (2c185155, $14.00), not the run itself.
- **Owner setup, outside the harness:** branch protection or a ruleset on the default branch of each adopting repository (§6.3, layer 1).
- **Recorded, not scheduled:** a test suite for InvoiceMe (D8). Until it exists, Block B on InvoiceMe relies on lint, build and the plan's named checks.
- **Check at implementation:** the default hook timeouts per event, and whether H3's `updatedInput` rewrite works with the `if` filter on Windows.
