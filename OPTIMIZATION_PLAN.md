# Production Harness: Optimization Plan

Status: **all decisions made (D1–D18); not yet validated.** Use this as the guidance and reference when ProdHarnessConfig is implemented. The §8 pilot turns its estimates into measurements.
Owner: Matheus Castro. Written 2026-10-21. **Revised 2026-10-22** from a meta-review of four independent assessments ([research/03](research/03-assessment-review.md)): P0 safety fixes, hardening, and decisions D3, D6, D8, D9 and D18.

Every recommendation here rests on one of four things: measured data from past session records (the study repo and BabyBuddyHelper), Anthropic's documentation (linked), an established engineering standard, or an owner decision (logged in §9). Estimates are labelled as estimates.

## Executive summary

**The problem.** The study repo's 12-stage workflow works, but it has 7 approval gates (O8) and costs too much (O9). Session records show where the money goes:

- A typical issue costs **about $10 at list price**: the median of 10 BabyBuddyHelper code issues was $9.99.
- Each session starts at **68–83k tokens** and grows to **~290k** without ever shrinking.
- Every call re-reads the whole context. Cost is therefore roughly *calls × context size*. Cache reads are 46% of it, cache writes 37%, output 18%.
- About 72k of the starting context is **global setup** (tools, plugin skill listings, connectors), not project docs.

The blueprint's cache-isolation idea (§1 of the blueprint) rests on a mechanism Claude Code doesn't have: there is no per-file caching. Its workflow compression (§2) was right in direction.

**The design.** Four blocks, two gates (the **Standard** tier):

| Block | What happens | Model | Gate |
|---|---|---|---|
| **A · Scope** | Plan mode; the survey is delegated to a subagent; one plan with every decision and sub-phase | Opus | **G1**: approve the plan, which also clears the context |
| **B · Build** | Autonomous implement → check → commit loop; docs updated in the same commits; push and draft PR pre-authorized; ends with a handoff file | Sonnet (`opusplan`) | none |
| **C · Review** | Fresh session from the handoff; Opus red-team; findings triaged | Opus | **G2**: one decision on findings, docs and PR; the owner merges |
| **D · Close** | `/close` after merge: script cleanup plus memory condensing | (session's) | none |

A **Small** tier (D18) runs one-sub-phase issues in a single session with the same two gates and the same Opus review. Without it, the Standard tier's fixed floor (≈ $2.4) would leave small issues no cheaper.

**Rules that make it hold:**

- **Gates are session boundaries.** No session carries a large context forward, and none is resumed cold. The approved plan and the handoff are also posted to the issue, so they survive anywhere (amended D3).
- **Checks run as hooks and scripts, not instructions.**
  - The edited file is linted after each edit.
  - Claude can't stop while fast checks fail; three failures end in an explicit `BLOCKED` state, never a handoff.
  - A commit is blocked while it leaves docs stale.
  - Checks run through one named-check runner that keeps the real exit code.
- **Review is bound to one commit.** The handoff records the PR head SHA, and the review refuses if the head moved. "Ready to merge" means the SHA reviewed, the PR head and the SHA CI passed on are the same.
- **Nothing is deleted that can't be proven safe.** `/close` aborts if the local branch holds anything the merged PR didn't.
- **GitHub branch protection** blocks pushes to the default branch and **requires CI to pass**, not only Claude Code rules. CI's MAUI build is the gate; a local build is optional (amended D9).
- **CLAUDE.md is kept to ≤ 3k tokens.** Workflow detail lives in four skills; area conventions live in rules that load only for matching paths. No "read every doc first" rule.
- **Subagents default to Sonnet**; the red-team is pinned to Opus. Effort is high everywhere.

**Expected result (estimate):**

- **Standard:** about **$7.2–7.7 per issue**, around the 25% cut-off of $7.49.
- **Small:** about **$2.2–2.5** for a tiny issue.
- **Owner turns:** ≤ 6, instead of 6–32.

Most of what remains is the ~80k global overhead that each block's session loads, and usually writes to the cache again (§8.2). D6 keeps that overhead on purpose. Turning off the Artifact tool and the connectors would save ≈ $0.70 per issue, and is the first lever if the pilot misses its cost target.

**Validation (§8).**

1. **V0, the setup check.** It must pass first, including three P0 checks:
   - `/close` safety
   - SHA binding
   - clear-on-accept in the desktop app, with a `/clear` fallback
2. **The pilot:** 3 BabyBuddyHelper issues, at least one on the Small tier, and one where Block B runs twice from the same plan, Sonnet against Opus (booked as experimental spend).
3. **InvoiceMe:** 1–2 issues, in a project with no tests.

Targets: Standard median ≤ $7.49; every block ≤ 200k context; no more major red-team findings; red-team catches the seeded defects; zero bugs escaping to after merge. A 3-issue pilot is **preliminary evidence**, not proof.

**Before implementation**, the owner sets up branch protection with required CI checks on each adopting repository (§6.3 checklist).

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

**Status: decided (D1–D4, D18; D3 amended, §9).** The plan and handoff templates are in §5.4–5.5, the hooks in §6, the models in §7. This section describes the **Standard** tier; the **Small** tier (D18) is in "Tiers" below.

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
| 7 PR + monitor 🔒 | B→C | D1: push and draft PR pre-authorized. Block B waits for CI on the head it hands off; review is bound to that SHA (F3) |
| 8 Red-team | C | (no gate) |
| 9 Triage 🔒 · 10 Historian 🔒 | C | One report, one decision: **G2** |
| 11 Ready to merge | C | (no gate; the owner merges) |
| 12 Memory flush 🔒 | D | D4 |

### Block A: Scope (gate G1)

- **Session:** fresh, in plan mode. `opusplan` puts plan mode on Opus 5.5 (D12); effort is high (D13). The owner invokes the `scope` skill and names the tier (Standard or Small, D18).
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
    - approaches considered and rejected, and the invariants Block B must preserve. Block A's reasoning is discarded at the clear, so anything B needs from it must be written here (F10).

    The plan follows the §5.4 template and passes S3 before it is shown.
- **G1:** the owner approves the plan once, with edits if needed (`Ctrl+G` opens it in an editor).
  - **The approved plan is posted to the issue as one comment (amended D3).** The comment also carries the scope decisions, so it is the durable copy. The file in `.claude/work/<issue>/plan.md` is the working copy.
  - Posting is pre-authorized like D1 (§6.3). On a public repository, nothing security-sensitive goes into a comment (Working Agreements rule 6).
- **Exit:** approve with **clear context** (`showClearContextOnPlanAccept`). Block B starts from the plan alone (P3).
  - **This is unverified on the owner's surface (F4).** A bug once made the option not clear anything (anthropics/claude-code#48951, now closed), and the desktop docs don't document the option. V0 tests it.
  - **Fallback**, if the option is missing or doesn't clear: approve the plan, run `/clear`, then send "continue #N". H5 fires on `clear` and points the new session at the plan, so Block B starts the same way.
- **Kept from the study:** owner decides scope; options with a recommendation; scope changes go into the issue first.

### Block B: Build (autonomous)

- **Session:** the same session after the clear-on-accept. The plan is its only inherited context, and its step 0 invokes the `build` skill. `opusplan` now runs Sonnet 5.5 (D12).
- **Permission mode:** auto, with the classifier reviewing actions. Auto mode is Claude Code's built-in starting mode from v2.1.283. `defaultMode: auto` can't be set from project settings, only user settings or `--permission-mode`.
- **Loop for each sub-phase:**
  1. Implement. H1 lints each edited file and feeds errors back.
  2. Run the sub-phase's check from the plan through the check runner (S5). Projects without tests use an observable check, automated where possible (D8, F14).
  3. Fix what fails.
  4. Update the docs that S1 flags as candidates. Also check the docs the plan listed, because S1 can't see drift that names no path (F11).
  5. Commit, one commit per sub-phase. H4 blocks the commit while a flagged doc is neither updated nor acknowledged (D10).
- **Enforcement (P4):** the **H2 Stop gate** runs `checks.fast` and blocks stopping while they fail.
  - Its output is structured: attempt n/3, the failing check, the error.
  - After 3 consecutive failures it writes **`BLOCKED`** (F5) and lets Claude stop. Claude Code's own cap of 8 forced continuations is never reached.
- **BLOCKED (F5):** `.claude/work/<issue>/BLOCKED` holds the failing check ID, its exit code and the trimmed output.
  - While it exists, Block B neither pushes nor opens a PR. It writes a handoff with `Status: BLOCKED`, and S3 refuses to start a review from it.
  - The owner chooses one of three ways out:
    - amend the plan (back to G1)
    - resume Block B in a **fresh Opus session** (`claude --model opus`; H5 points it at the work) — not a mid-session switch, which costs a full cache miss
    - stop
  - The file is deleted only when the check passes.
- **Output filtering (P2):** checks run through the S5 runner, which trims output to failures. H3 remains only as a fallback for test commands typed directly (§6.2).
- **Reading when the plan is thin (F10):** Block B may call the `surveyor` once per sub-phase to read code the plan didn't cover. It returns a summary, not file contents.
- **Escalation, kept from Working Agreements rule 5:** anything the plan does not cover, such as a behaviour change, a new dependency or a scope change, stops and asks. Auto mode still asks when the prompt or skill explicitly requires it.
- **Docs (D2):** doc updates land in the same commit as the code they describe, so docs never trail code and no separate doc pass is needed.
- **Exit** (only without `BLOCKED`):
  1. Run `checks.full` once. It mirrors CI except for the minutes-long MAUI build, which CI runs on the PR (D9 amended).
  2. Push the branch and open a draft PR (D1).
  3. **Bind the handoff to one commit (F3).**
     - Wait, bounded, for CI on the pushed head (`gh pr checks --watch`). Fix failures inside Block B, then push again.
     - Then record the head SHA (`gh pr view --json headRefOid`) and the CI result *for that SHA*.
     - Then turn off the desktop app's PR monitoring (Auto-fix) for this session, so nothing pushes after the handoff. Block C turns monitoring on in its own session if it is wanted.
     - Auto-fix is an external dependency (§6.6). How it is switched per session is verified in V0.
  4. Write the **handoff file** (§5.5 template; it must pass S3), and post it to the issue as one comment (amended D3). Security-sensitive items stay in the local file only, marked "withheld". Then stop.

### Block C: Review (gate G2)

- **Session:** fresh, started with `--model opus` (D12). The owner invokes the `review` skill.
  - It reads the handoff from the local file, or from the issue comment on another machine (amended D3).
  - It runs S3 and refuses to start on a missing, invalid or `BLOCKED` handoff.
  - **It refuses if the PR head has moved** since the handoff's recorded SHA (F3).
  - Its inputs are the handoff and the PR diff (P3). A small context also makes waiting at G2 cheap: a cold resume costs little.
- **Thin handoff (F10):** if the handoff passes S3 but is too thin to triage against, `review` may ask the `surveyor` for one bounded summary of Block B's commits and diff before G2. Each use is counted (§8.3).
- **Red-team:** a background subagent with `model: opus` in its frontmatter (§7.2). It reviews the diff at the recorded SHA against the plan's acceptance criteria and invariants. It checks the docs against *behaviour*, not only against paths: S1 can't see drift that names no path (F11). It returns scored findings. The full diff goes to the red-team, not into the main session.
- **Triage:** the main session runs each finding and review comment through the three questions (reachable today? affects users? fix cost justified?) and recommends fix or decline.
- **G2:** one report holds:
  - PR link, **the SHA reviewed**, and CI status for that SHA
  - each finding and comment with its recommendation, marked **blocking** or not. A blocking finding (security, data integrity, correctness) can't move to a follow-up issue without the owner's explicit, recorded acceptance (F5).
  - the docs diff
  - acceptance criteria met or not, and what was "not verifiable here" (F14)
  - optional owner steps, such as a local MAUI run (D9 amended; CI's build is the required check)

  The owner decides everything in one reply.
- **Fix loop:** approved fixes are applied, then one narrow red-team re-review of the fixes only.
  - Each fix push creates a new head. The re-review and the CI result are bound to that new SHA.
  - Whatever remains after that goes to a follow-up issue, unless the owner asks for another round. Blocking findings are the exception above.
  - The study allowed two loops; this allows one, then a follow-up.
- **Exit:** a "ready to merge" note, stating that **the SHA reviewed, the PR head and the SHA CI passed on are the same** (F3). **The owner merges.** Branch protection requires the CI checks (F8), and auto mode blocks merging a PR no human approved.

### Block D: Close

- **Trigger (D4):** the owner runs `/close` after merging. Claude Code has no "PR merged" hook event. The skill sets `disable-model-invocation: true`, so it runs only when the owner calls it.
- **Script part (deterministic, S2):**
  - check with GitHub that the PR is merged
  - check that the local branch holds nothing the PR didn't (F1)
  - update the local default branch
  - delete the merged branch
  - delete the issue's plan, handoff and stale-docs files. The issue comments stay as the record.
- **Model part:** condense notes about the issue into outcome, deferred follow-ups and lasting lessons. Memory edits are made and listed in the close report, with no pre-approval (D4).
  - In the study this ran at epic close or after an isolated issue; keep that cadence.
  - At an epic's close, also run **one knowledge audit**: the ADRs and docs the epic touched, checked against behaviour by the red-team. This is the historian's lasting role, run once per epic instead of on every issue (F11).

### Tiers (D18)

The four blocks have a fixed cost floor. Three session starts write the global overhead to the cache (A 83k at $8, B 88k at $4, C 87k at $8 per MTok, ≈ $1.7). Add the red-team (≈ $0.5) and the surveyor (≈ $0.2), and **≈ $2.4 is spent before any work**.

A tiny issue under the Standard tier comes to an estimated ≈ $3.1–3.3. The baseline's small issues cost $3.08 (#118) and $3.82 (#47), so Standard alone doesn't make small issues cheaper ([research/03](research/03-assessment-review.md), F2).

| | **Standard** (default) | **Small** |
|---|---|---|
| When | Anything not Small | **One sub-phase**; no schema, data-migration, auth, security or dependency change; no change to a public interface. The owner names the tier at `/scope`. |
| Sessions | A → (clear) → B → fresh C | **One session**: plan mode → G1 → build → red-team → G2. No clear, no handoff file. |
| Survey | `surveyor` subagent | Optional; Block A may read the few files itself |
| Gates | G1, G2 | **G1, G2** (the same two) |
| Independent review | Opus red-team | **Opus red-team, kept** (P5) |
| Hooks, BLOCKED, SHA binding, docs gate | All | All |
| Plan posted to the issue | Yes | Yes. The G2 report doubles as the handoff record. |
| Estimated cost | ≈ $7.2–7.7 for a typical issue | ≈ **$2.2–2.5** for a tiny issue: one start write (≈ $0.66), the switch to Sonnet rewriting a small context (≈ $0.40), red-team (≈ $0.5), about 30 calls at ~100k (≈ $0.4) and output (≈ $0.3) |

- **Upgrading mid-way:** if a Small issue breaks its criteria, Block B stops and asks (Working Agreements rule 5). The owner can upgrade it to Standard; the work so far becomes sub-phase 1 of a new plan.
- **No tier drops the review.** One assessment proposed a tier that skips Block C; it is not adopted, because the independent review is a guarantee P5 keeps.

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
| (not in blueprint) | A Small tier in one session (D18) | The fixed floor would make small issues no cheaper (F2) |
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
| Current state of the work | Working copies in `.claude/work/<issue>/{plan,handoff,stale-docs}.md` and `BLOCKED` (gitignored, so on this machine only; deleted by `/close`). **Durable copies of the plan and the handoff are posted as issue comments** (amended D3). | When a block starts |

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
# Plan: #<issue> <title>   ·   Tier: Standard | Small
0. Invoke the `build` skill before anything else.
## Scope (decided at G1)
<2–4 lines; the decisions taken at G1>
## Facts checked / corrected
## Acceptance criteria
- [ ] …
## Sub-phases
### 1. <name>
- Files: …
- Change: …
- Check: <check-runner ID, or an automated observable; manual only with a reason>
## Rejected approaches
- <considered in Block A, and why not>  (Block B must not re-explore these)
## Invariants to preserve
- <patterns, contracts, behaviour that must not change>
## Docs likely to go stale
## Out of scope
```

The two sections after the sub-phases (F10) carry what the clear-on-accept discards. S3 requires every section to be filled in or marked "none".

### 5.5 Handoff template (output of Block B, input of Block C)

```markdown
# Handoff: #<issue> → Review
Status: READY | BLOCKED
Plan: .claude/work/<issue>/plan.md (issue comment: <url>) · Branch: <branch> · PR: <url> (draft)
PR head: <sha> · CI on that head: pass | fail | none
## Commits
<sha> <message>  (one line per sub-phase)
## Checks
<check ID> → pass/fail, with counts
Not verifiable here: <what no available check covers, e.g. "no API tests in InvoiceMe"> (or "none")
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

- Block B writes the handoff file last, before stopping, and posts it to the issue (amended D3).
- Security-sensitive items stay in the local file, and the comment says "withheld" (Working Agreements rule 6).
- Block C's `review` skill refuses to start without a handoff, on `Status: BLOCKED`, or when the PR head no longer matches `PR head` (F3, F5).
- Each section is filled in, or marked "none" — never left out.
- Keep it within 2k tokens. The diff itself stays in git and isn't copied in.

## 6. Automation: hooks and scripts

**Status: decided (D8–D11; D9 amended, §9).** Hardened from the assessment review (F5, F7, F8, F11, F12).

### 6.1 Ground rules

- **Command hooks only.** `prompt` and `agent` hook types make model calls, so every one would cost tokens.
- **Silent on success.** Hook output reaches Claude's context with the next request (`additionalContext`, stderr on exit 2). A passing hook prints nothing; a failing one prints at most ~40 lines.
- **Tagged and loud on failure (F12):**
  - Every hook's output starts with `[harness <hook>]`, so Claude can tell a hook's message from a tool's.
  - A hook that gets input it can't parse says so and fails closed. It never guesses.
- **Cross-platform.** Hooks use the `command` + `args` form (`"command": "node"`), with all scripts in Node.js (D11), so the same config runs on Windows and in CI.
  - Child processes run with `execFile`/`spawn` and argument arrays, never through an interpolated shell string (F12).
- **Explicit `timeout` on every hook.** Defaults vary by event. Fast checks must finish well inside the timeout.
- **Hooks don't trust their `if` filter (F7).** The docs say Bash `if` matching is best-effort: when Claude Code can't parse the command, the hook "runs regardless of the pattern". Every Bash hook re-checks the command it was given and does nothing if the command isn't its own. Hard allow and deny rules belong to permissions (§6.3), not hooks.
- **One project config file**, `.claude/harness.json`, holds everything project-specific. Hooks and scripts are generic and read it:

```jsonc
{
  "defaultBranch": "main",
  "checks": {                  // named checks; S5 runs them by ID
    "fast": ["<seconds-scale commands; run by the Stop gate>"],
    "full": ["<mirrors CI; run once before push>"],
    "<id>": ["<a sub-phase check the plan names, e.g. an API smoke request>"]
  },
  "requiredCiChecks": ["<the CI check names branch protection requires (§6.3)>"],
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
| **BabyBuddyHelper** | `dotnet test --project test/BabyBuddyHelper.Tests/...` (net10.0, no MAUI workload) | the same tests. The MAUI build (`dotnet build BabyBuddyHelper.csproj -f net10.0-windows10.0.19041.0`) is **not run by the harness**. CI's `build.yml` runs it on every `pull_request`, and it is a **required status check** (D9 amended, F8). |

Three things follow from this:

- **InvoiceMe has no tests.** The blueprint's Block B assumes `npm test` exists, which isn't true there.
  - D8: the gate is CI's checks plus each sub-phase's named check, **automated where possible** (a scripted request through S5, a build-artifact check). A manual check needs a stated reason (F14).
  - What no check covers is reported as "Not verifiable here" in the handoff and at G2.
- **A MAUI build takes minutes.** It stays out of the harness. CI is the gate, and a local MAUI build or run is optional for the owner (D9 amended).
- **CI already builds the same target the owner would build locally** (`build.yml`, `on: pull_request`), so a required local build would duplicate it (F15).

### 6.2 Hooks

| ID | Event · matcher | Script | What it does | Output |
|---|---|---|---|---|
| H1 | `PostToolUse` · `Edit\|Write` | `file-check` | Formats, then lints, the one edited file, using its `fileTools` entry. On lint errors, exits 2: the tool already ran, and the errors go back to Claude. | Silent, or ≤ 20 error lines |
| H2 | `Stop` | `check-gate` | Skips if the fingerprint matches the last pass, stored in `.claude/work/.lastpass`; that makes it near-free in Blocks A and C and after a pass. Otherwise runs `checks.fast` through S5. On failure it returns `decision: "block"` with structured output: attempt n/3, the check ID, the exit code, the trimmed error. **After 3 consecutive failures it writes `BLOCKED`** (F5) and lets Claude stop. That limit is below Claude Code's own cap of 8, because each forced continuation is a full-context call. | Silent, or ≤ 40 lines |
| H3 | `PreToolUse` · `Bash`, with an `if` filter on the configured test and build commands | `quiet` | **A fallback only (F7).** The skills run checks through S5. If Claude types a configured test command directly, H3 re-checks that the command exactly matches one in `harness.json` and only then rewrites it (`updatedInput`) through S5. Anything else passes through untouched. | Summary + failures |
| H4 | `PreToolUse` · `Bash`, `if: Bash(git commit *)` | `stale-docs --staged --gate` | D2 enforcement. It re-checks that the command is a commit (F7). If the staged changes flag candidate docs that are neither staged nor acknowledged, the commit is denied, with the list as the reason (D10). | Silent, or the list |
| H5 | `SessionStart` · `startup\|clear` | `session-state` | One line of state for fresh sessions and the clear-on-accept fallback (F4): "Plan for #N in progress → Block B", "Handoff for #N ready → run `/review`", or "#N is BLOCKED on <check> → owner decision". | ≤ 60 tokens |

**The `.lastpass` fingerprint (F12).** It is a hash of:

- the index (`git write-tree`), the tracked work-tree diff, and the untracked, non-ignored files with their contents
- `harness.json`, and the versions of the hook and check scripts

Any staged, unstaged, untracked, deleted or renamed change, or a change to the checks, invalidates the pass. Generated output that is gitignored doesn't count. If the fingerprint can't be computed, H2 runs the checks.

Not used, and why:

- `UserPromptSubmit`: nothing needs checking per prompt.
- `PreCompact`: blocking compaction risks hitting the context limit.
- `PreModelSwitch`: model choice is made at session boundaries anyway (P6).

### 6.3 Push and PR guard (enforcing D1)

The [permissions docs](https://code.claude.com/docs/en/permissions) warn that Bash rules which constrain arguments are fragile. `Bash(git push *)` does not match `git -C . push`. So D1 is enforced in three layers, strongest first:

1. **GitHub branch protection or a ruleset on the default branch.** This runs on the server and is the real guarantee. It is a one-time owner action per repository, outside this harness. Checklist (F8):
   - [ ] Require a pull request before merging.
   - [ ] **Require status checks to pass**, naming `requiredCiChecks` from `harness.json`. BabyBuddyHelper: the `build.yml` and `xunit-tests.yml` jobs. InvoiceMe: the `node.js.yml` jobs.
   - [ ] Block force pushes and deletion of the default branch.
   - [ ] Decide on bypass, and write it down. The owner is an admin, so "do not allow bypassing" must be set explicitly if admins should be held to it too.

   V0 proves each item: a failing required check blocks the merge, a missing one blocks the merge, and a force push is refused.
2. **The auto-mode classifier.** It already blocks force pushes and merging a PR that no human approved.
3. **Rules in `.claude/settings.json`:**
   - `allow`: `Bash(git push origin *)`, `Bash(git push -u origin *)`, `Bash(gh pr create --draft *)`, `Bash(gh pr view *)`, `Bash(gh pr checks *)`, `Bash(gh issue comment *)`. The last is for the plan and handoff comments (amended D3).
   - `deny`: `Bash(git push * <default>)`, `Bash(git push --force *)`, `Bash(git push -f *)`, `Bash(gh pr merge *)`

   Here `<default>` is the project's `defaultBranch`: `main` in BabyBuddyHelper, **`master` in InvoiceMe**. A rule hard-coded to `main` would not protect InvoiceMe.

   Deny wins over allow. Allow rules in the shared file need workspace trust; deny rules apply right away.

### 6.4 Scripts

**S1 `stale-docs`** — maps changed files to **candidate** docs that may now be wrong. Its output is a list to review, not a complete inventory (F11).

- **Input:** `--staged` (the H4 gate) or `--range <base>..HEAD` (the handoff and the review).
- **Matching rules**, in order:
  1. `docmap` globs.
  2. The doc's text contains the changed file's repo-relative path.
  3. The doc's text contains the file's basename, unless it is on a stoplist of generic names (`index.js`, `package.json`, `README.md`, and similar).
  4. The doc's text contains the file's directory path.
- **Deleted or renamed files** are flagged first, because they leave dangling references.
- **Output:** `doc ← file (rule)`. With `--record`, it appends to `.claude/work/<issue>/stale-docs.md`.
- **Acknowledging a flag:** a line `ack: <doc> — <why unchanged>` in that file clears it for H4. Acks are copied into the handoff ("Script-flagged but left unchanged").
- **Limit:** drift that never names a path is invisible to the script.
  - `docmap` covers known concept links.
  - The plan's "Docs likely to go stale" list covers what Block A foresaw.
  - The red-team checks docs against behaviour (D2, F11).
  - V0 seeds one doc-drift case that names no path, to show the red-team catches what S1 can't.

**S2 `close <issue>`** — the script half of D4. **It deletes nothing it can't prove is safe (F1).**

1. Looks up the PR for the issue's branch with `gh pr view <branch> --json state,mergedAt,headRefOid`. **Aborts unless it is `MERGED`.**
2. **Aborts if the local branch holds anything the PR didn't:**
   - the local tip ≠ `headRefOid` (a commit added after the PR's last push), or
   - staged, unstaged or untracked changes on that branch.

   It reports both SHAs and keeps the branch.
3. `git switch <default>`, then `git pull --ff-only`.
4. `git branch -d <branch>`. A squash or rebase merge makes `-d` refuse, because the commits differ. Only then, and only because step 2 proved the local tip *is* the merged PR's head, does it fall back to `-D`. The report says so.
5. `git fetch --prune`.
6. Deletes `.claude/work/<issue>/`. The issue comments remain as the record (amended D3).
7. Lists the memory files that mention `#<issue>`, for the skill's model half to condense.

It prints a short report: PR state, PR head SHA, local SHA, and what it deleted or kept. It changes nothing outside the repository except those memory files. V0 tests it on a normal merge, a squash merge, a rebase merge, and a merged PR with an extra local commit, which must abort.

**S3 `handoff-check`** — the review skill runs it before anything else.

- It checks that every §5.5 section is present (filled in, or "none") and that the file is within ~2k tokens (characters ÷ 4).
- It fails closed: no valid handoff, no review. It also refuses `Status: BLOCKED`, and a `PR head` that no longer matches `gh pr view --json headRefOid` (F3, F5).
- The scope skill runs the same check on plans against §5.4, including "Rejected approaches" and "Invariants" (F10).

**S4 `cost`** — [research/scripts/cost.js](research/scripts/cost.js). It already exists and is used in §8.

**S5 `check <fast|full|id>`** — the named-check runner (F7). This is the one way Claude runs project checks.

- It looks up the ID in `harness.json` and fails closed on an unknown ID.
- It runs each command with `execFile` and a bounded timeout, and **returns the command's own exit code**. Output filtering can never turn a failure into a pass.
- It prints a one-line summary plus failures only, and appends the check ID, exit code and duration to `hooks.log`.
- V0 tests it with: pass, fail, zero-output failure, timeout, a path with spaces, and a benign "ERROR" string in passing output.

### 6.5 File layout in an adopting project

```
.claude/
  settings.json          hooks (H1–H5), permissions (§6.3), enabledPlugins (D6), showClearContextOnPlanAccept,
                         model: opusplan (D12), effortLevel: high (D13), env CLAUDE_CODE_SUBAGENT_MODEL=sonnet (D14)
  harness.json           defaultBranch, checks (named), requiredCiChecks, fileTools, docs, docmap
  CLAUDE.md              ≤ 3k tokens (§5.2)
  rules/<area>.md        paths: rules
  skills/{scope,build,review,close}/SKILL.md
  agents/red-team.md     model: opus, effort: high
  agents/surveyor.md     model: sonnet, effort: high, read-only tools
  hooks/                 file-check, check-gate, quiet, session-state
  scripts/               stale-docs, close, handoff-check, check
  work/                  gitignored; per-issue plan, handoff, stale-docs, BLOCKED; .lastpass; hooks.log (§8.3)
```

Outside the repository, but part of the harness:

- **GitHub:** the branch-protection ruleset (§6.3), and the issue comments holding plans and handoffs.
- **The desktop app:** PR monitoring (Auto-fix), §6.6.

### 6.6 Claude Code dependencies (F16)

The production harness targets the owner's tool, Claude Code. Portability is the study repo's concern (#22). Each feature it relies on is recorded here, with how V0 verifies it and the fallback if it fails.

| Feature | Used for | V0 verifies | Fallback |
|---|---|---|---|
| Clear context on plan accept (`showClearContextOnPlanAccept`) | A → B boundary (D3) | `/context` right after accepting shows the exploration gone, **in the desktop app** | `/clear` + "continue #N"; H5 picks up the plan |
| `opusplan` | Opus for A, Sonnet for B (D12) | The resolved model per block, from the session records | Start B in a fresh session with `--model sonnet` |
| Hooks: `Stop`, `PostToolUse`, `PreToolUse` with `if`, `SessionStart` | H1–H5 | Each hook fires once on a seeded case; malformed input fails closed | None; a hook failure is a V0 blocker |
| Auto mode | Block B autonomy | The effective permission mode at Block B's start | `--permission-mode`, as a documented launch step |
| Desktop PR monitoring (Auto-fix) | CI fixes in B | It can be turned off for one session at handoff, with no push afterwards | Don't enable it; B polls `gh pr checks` until a bounded timeout |
| `CLAUDE_CODE_SUBAGENT_MODEL`, agent `model` and `effort` frontmatter | D13, D14 | The resolved model per subagent | Set `model` in every agent file |
| Settings keys (`enabledPlugins`, `effortLevel`, `model`) | D6, D12, D13 | `/status` setting sources; `/context` | User-scope settings |

V0 also records the Claude Code version (2.1.304 on 2026-10-22), the surface (desktop, CLI), the provider, and the price table used (F13). A feature that fails its V0 check blocks the pilot until its fallback is in place.

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
| surveyor (A; at most once per sub-phase in B; a thin-handoff summary in C) | Sonnet 5.5 | Proven in #28. Half the price of inheriting Opus. |
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

**Total ≈ $7.2–7.7, about 25% below the $10 median.** The 25% cut-off itself is **$7.49** ($9.99 × 0.75). The estimate straddles it, so it says a reduction is plausible, not that the target follows (F13).

For a tiny issue on the Small tier (D18), the estimate is ≈ $2.2–2.5, against $3.08 and $3.82 for the baseline's two small issues (§4, Tiers).

Most of the remaining cost is the ~80k global overhead. It is re-read on every call, and in each block it is usually written to the cache again at the 1h rate:

- Block B switches to Sonnet, and each model has its own cache.
- Block C's Opus session usually starts more than an hour after Block A's last call.

The exception: a session on the same model within the TTL reads the shared system-and-tools prefix from cache. #28's first call read 56k that an earlier session had cached.

If the pilot shows the overhead is what's left, the next lever is D6. Priced per block, turning off the Artifact tool saves **≈ $0.45 per issue**, and the connectors **≈ $0.25** more: **≈ $0.70 together**, about 9% of the estimate. That corrects an earlier "roughly $1" ([research/03](research/03-assessment-review.md), E3).

### 8.3 Metrics recorded per issue

| Metric | Source |
|---|---|
| Tier; cost by block and by subagent, split by token type | the plan header; `cost.js` on the block's session (D3 makes each block its own session) |
| **Experimental spend, kept separate** (V2's second Block B) | `cost.js` on the replay session; never added to the issue's production cost (F13) |
| Context before the first prompt; starting context per block; peak context per block | `/context` at session start; the first and largest call in each session |
| Calls per block; owner turns; active minutes | `sessions-survey.js` |
| **Owner time at G1 and G2**: from the report to the owner's reply | session timestamps (F9) |
| H2 forced continuations; H2 cap hits and `BLOCKED` states; H4 denials; acks; S5 runs | hook logs (each hook and S5 append one line to `.claude/work/hooks.log`) |
| Handoff and plan check failures; head-moved refusals; thin-handoff summaries requested | S3 output; the `review` skill |
| Red-team findings by severity and blocking flag; G2 decisions (fix or decline); fix loops | the G2 report |
| **Follow-up issues created at G2; plan deviations** (from the handoff); **reopened issues** | the G2 report; the handoff; GitHub (F9) |
| Escapes: bugs found after merge that trace back to the issue | issues labelled to the original issue within 4 weeks |
| **Red-team recall on seeded defects** | V0 only: known defects found ÷ defects seeded (F9) |
| Runtime: Claude Code version, surface, provider, resolved model and effort per block and subagent, price table used | V0, then each session record (F13, §6.6) |

Session transcripts contain personal data such as the email address, so run records stay **out of git**. Only the metrics table is committed.

### 8.4 Targets (hypotheses)

| Target | Threshold | Basis |
|---|---|---|
| Cost per issue | Standard: median **≤ $7.49** (25% below $9.99) over the pilot, production spend only. Small: below the baseline's small issues ($3.08). | §8.2 estimate |
| Peak context | **≤ 200k** in every block | §5.2 budgets plus growth |
| Context before the first prompt | ≤ 85k (`/context` at session start, before the skill and plan load; F13) | §5.2: global ≤ 80k plus project layer ≤ 3k, with slack. Block starts are tracked separately: ≈ 88k for B, ≈ 87k for C. |
| Owner turns | **≤ 6** per issue (G1, G2, merge, `/close`, plus slack) | Two gates replace seven |
| Quality | Red-team majors per issue no higher than the first runs' median; **zero escapes** traced to a pilot issue; red-team catches the V0 seeded defects | P5: fewer gates, not weaker guarantees |

**The pilot is preliminary evidence, not proof (F9).** Zero escapes in 3 issues still allows an escape rate of up to ~63% at 95% confidence (1 − 0.05^(1/3)). Passing V1–V3 makes the plan "validated for continued use". Quality confidence grows with each issue tracked after that, not from the pilot alone.

### 8.5 Protocol

**V0: setup check, no real issue.** In each adopting repo, on a throwaway branch or fixture repo. **Every item passes before V1 starts.** P0 items come first.

- **Runtime** (§6.6): record the Claude Code version, surface, provider, effective permission mode, and the resolved model and effort per role. `/context` before the first prompt is ≤ 85k.
- **Clear-on-accept, in the desktop app (F4, P0):** accept a seeded plan large enough to tell old context from new. `/context` must show the exploration gone. If it doesn't, adopt the `/clear` fallback (§4, Block A) and re-test it.
- **`close` (F1, P0):** run it on a normal merge, a squash merge and a rebase merge; each deletes cleanly. On a merged PR with an extra local commit, and on a dirty tree, it must abort and keep the branch.
- **SHA binding (F3, P0):** a commit pushed after the handoff makes `review` refuse. Turning off PR monitoring at handoff leaves no push afterwards.
- **Hooks and S5:**
  - Each hook fires once on a seeded case: a lint error (H1); a failing test, then a pass after 3 failures → `BLOCKED` (H2); a test command typed directly (H3); a flagged doc (H4); state lines on `startup`, `clear`, and `BLOCKED` (H5).
  - Malformed hook input fails closed with a `[harness …]` message.
  - S5 passes its cases (§6.4), and the `.lastpass` fingerprint is invalidated by staged, untracked, deleted and renamed changes and by a `harness.json` edit (F12).
- **Branch protection** (§6.3 checklist): a failing required check blocks the merge, a missing one blocks the merge, and a push to the default branch and a force push are refused.
- **Seeded defects (F9):** 2–3 known defects and one doc drift that names no path go into a throwaway change. Record the red-team's recall. Missing the doc drift means F11's red-team instruction needs strengthening before V1.
- **Issue comments:** the plan and handoff comments post, and a security-tagged item is withheld (amended D3).

**V1: pilot (D15).** Three real BabyBuddyHelper issues of small-to-medium size, under the full configuration (D12 `opusplan`, D13 high effort). **At least one runs on the Small tier**, if a suitable issue exists; otherwise the first suitable issue in V3 does (D18). Record the §8.3 metrics for each issue.

**V2: Block B model comparison (validates D12).**

- Method (D16): replay Block B on the same approved plan in two worktrees, once on Sonnet and once on Opus.
  - Both worktrees start from the same base commit, and both use the plan whose hash matches the G1 issue comment.
  - Only one branch continues to Block C; the report says which one and why.
- Compare Block B cost, H2 continuations, `BLOCKED` states, red-team majors, and whether a fix loop was needed.
- The replay's cost is **booked as experimental spend**, not as the issue's cost (F13).
- Opus-only B wins only if it avoids a fix loop or a major finding that Sonnet-B produced. Cheaper alone is not enough to keep Sonnet if it adds rework.

**V3: a project without tests.** InvoiceMe, 1–2 issues, to validate D8. Each sub-phase's check must be automated, or carry a stated reason why it isn't. The handoff's "Not verifiable here" line must name what lint and build can't show (F14).

**What a result triggers:**

| Result | Action |
|---|---|
| Starting context > 85k | Revisit D6 |
| H2 hits the 3-failure cap (`BLOCKED`) on more than 1 in 5 issues | Review the fast checks and the plans' check definitions. If Sonnet-B is the one blocking, weigh it in the D12 comparison. |
| `review` asks for a thin-handoff summary on more than 1 in 5 issues | Tighten the handoff template |
| A Small-tier issue costs more than the baseline's small issues | Revisit D18's criteria |
| A peak context > 200k | Find which reads entered the main session; move them to a subagent or a hook |
| S3 fails more than once | Tighten the handoff or plan template |
| Cost target missed but quality held | Re-decide D6, and the effort for B (`medium`) |
| Quality target missed | Restore a gate where the escape slipped through, before cutting any further cost |

**Done:** the targets hold across the pilot. Then this plan's status moves to **"validated for continued use"** (see the note under §8.4), and the measured numbers replace the estimates in §8.2.

## 9. Decisions log

| ID | Decision | Status |
|---|---|---|
| D1 | **Push and draft PR pre-authorized.** Allowed: `git push` to non-default branches and `gh pr create --draft`. Denied: push to the default branch (`main` or `master`, §6.3), force push, and merge. G2 reviews the PR. | Decided 2026-10-21 |
| D2 | **Docs updated inline in Block B.** A script maps changed paths to the docs that reference them. Doc updates go in the same sub-phase commit as the code. The red-team checks docs against code. No historian subagent. | Decided 2026-10-21 |
| D3 | **Gates are session boundaries.** A→B: approve the plan with clear context, so the plan is the handoff; the `/clear` fallback applies if the option fails (§4). B→C: Block B writes a handoff file, and Block C starts in a fresh session. Chosen over `/compact` because the file can be read and edited, gives triage a stated record of intent, and is cleaned up by `/close`. Estimated saving over keeping one session: ~$1–5 per issue (not yet measured). Risk: a thin handoff, addressed by a fixed template (§5) and the thin-handoff path in Block C. **Amended 2026-10-22 (F6):** the original said the file "survives across days and machines". The working file in gitignored `.claude/work/` survives on one machine only, so **the approved plan and the handoff are also posted to the issue as comments**, which makes them durable anywhere. Posting is pre-authorized (`gh issue comment`). Security-sensitive items stay local and are marked "withheld". | Decided 2026-10-21; amended 2026-10-22 |
| D4 | **`/close` skill, no gate.** The owner invokes it after merging. A script deletes the issue's own scratch files and prunes the branch. Memory edits are made and listed in the report, with no pre-approval. | Decided 2026-10-21 |
| D5 | **Drop the AI_CONTEXT.md index; docs read on demand.** CLAUDE.md keeps a short "where things are" path list. Architecture, Data Flow, UI and the ADRs are read by the Block A survey only when relevant. Area conventions become `paths:` rules. | Decided 2026-10-21 |
| D6 | **Only unrelated plugins off.** In project settings, `enabledPlugins` is false for marketing, figma, design, productivity, dataviz and pdf-viewer (~4–5k). The Artifact tool and the claude.ai connectors stay on, so their ~18k is accepted. Skill descriptions are not capped. **Reconfirmed 2026-10-22, with a corrected figure:** turning both off would save ≈ $0.70 per issue (Artifact ≈ $0.45, connectors ≈ $0.25), not "~$1". The decision is re-opened only by the §8.5 triggers, using measured numbers. | Decided 2026-10-21; reconfirmed 2026-10-22 |
| D7 | **Working Agreements compressed into CLAUDE.md** (~12 lines). Every block and the red-team see them, and they survive compaction. | Decided 2026-10-21 |
| D8 | **Projects without tests are gated on their CI checks plus the plan's checks.** The checks mirror CI: lint and `node --check` as fast checks, plus the build before push (§6.1). Every sub-phase in the plan names an observable check, such as a request, a page or a value. **Refined 2026-10-22 (F14):** the check is automated through S5 where possible, and manual only with a stated reason; what no check covers is reported as "Not verifiable here". Adding tests to InvoiceMe is a separate follow-up, not something the harness requires first. | Decided 2026-10-21; refined 2026-10-22 |
| D9 | **The Stop gate runs fast checks only.** The MAUI build is not part of the harness. `checks.full` (before push) holds only checks that take seconds to a minute; for BabyBuddyHelper that means the tests, without the MAUI build. **Amended 2026-10-22 (F15):** CI's `build.yml` already builds the same MAUI target on every PR, so **CI's build is the gate**, enforced as a required status check (§6.3). The owner's local MAUI build or run is optional, listed at G2 only as an optional step. | Decided 2026-10-21; amended 2026-10-22 |
| D10 | **Stale-docs blocks the commit until each flagged doc is updated or acknowledged.** An `ack: <doc> — <why>` line clears a false positive, and acks are copied into the handoff for G2. | Decided 2026-10-21 |
| D11 | **Hooks and scripts are written in Node.js.** It runs the same on Windows, macOS, Linux and CI, and reads hook input JSON natively. Node is a prerequisite on the machine, including for .NET projects. | Decided 2026-10-21 |
| D12 | **Block B builds on Sonnet through `opusplan`.** Opus 5.5 in plan mode (Block A), Sonnet 5.5 after plan accept (Block B). The switch falls on the clear-on-accept boundary, so it costs no cache. Block C sessions start with `--model opus`. §8 validates this against an Opus-only run. | Decided 2026-10-21 |
| D13 | **High effort everywhere**: every block and every subagent, as #28 ran. Set it as the project default (`effortLevel`) and in each agent's `effort` frontmatter. On the 5.5 models a later change keeps the cache, so §8 can still test `medium` for Block B. | Decided 2026-10-21 |
| D14 | **`CLAUDE_CODE_SUBAGENT_MODEL=sonnet`** in the project `env`. Built-in Explore and general-purpose agents run on Sonnet. The red-team keeps `model: opus` in its frontmatter, which takes precedence over the env var. | Decided 2026-10-21 |
| D15 | **Pilot: 3 issues in BabyBuddyHelper, then 1–2 in InvoiceMe.** Start where tests exist and the baseline was measured. InvoiceMe follows as V3, to validate D8. | Decided 2026-10-21 |
| D16 | **Compare the Block B models by replaying B on the same plan.** For one pilot issue, after G1, Block B runs twice from the same approved plan in two worktrees: once on Sonnet, once on Opus. Only one branch continues to Block C. Extra cost: one Block B, about $2.5–5. | Decided 2026-10-21 |
| D17 | **The §8.4 targets stand as proposed.** | Decided 2026-10-21 |
| D18 | **Two tiers: Standard and Small (F2).** Small (one sub-phase; no schema, migration, auth, security, dependency or public-interface change) runs as one session: plan mode → G1 → build → Opus red-team → G2. No clear and no handoff file; the same two gates; the same hooks and checks. The owner names the tier at `/scope` and can upgrade a Small issue mid-way. No tier skips the independent review. Estimated ≈ $2.2–2.5 for a tiny issue, against a Standard floor of ≈ $2.4 before any work (§4, Tiers). | Decided 2026-10-22 |

The 2026-10-22 changes come from the meta-review of four independent assessments ([research/03-assessment-review.md](research/03-assessment-review.md)). The findings applied without a new decision, because they add to or specify existing ones: F1, F3, F4, F5, F7–F14 and F16. They are referenced by F-number where they appear.

## 10. Open questions

- How do subscription plan limits weigh cache reads? Observe with `/usage` attribution.
- #16's onboarding run can't be priced: only its orchestration session is on record (2c185155, $14.00), not the run itself.
- **Owner setup, outside the harness:** branch protection or a ruleset on the default branch of each adopting repository (§6.3, layer 1).
- **Recorded, not scheduled:** a test suite for InvoiceMe (D8). Until it exists, Block B on InvoiceMe relies on lint, build and the plan's named checks.
- **Check at implementation:** the default hook timeouts per event, and whether H3's `updatedInput` rewrite works with the `if` filter on Windows.
- **Verify in V0 (§6.6):**
  - whether the desktop app offers and honours clear-context on plan accept (F4)
  - how PR monitoring (Auto-fix) is turned off for one session at handoff (F3)
- **Not adopted from the assessments, with reasons:** [research/03](research/03-assessment-review.md) §5.
