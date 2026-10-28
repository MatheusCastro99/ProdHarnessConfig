# R3: Meta-review of the four independent assessments

Date: 2026-10-21. Input: four assessments in `Independent_Assessments/` (ChatGPT, Copilot, Gemini, Grok). Each one was reviewed separately in `Independent_Assessments/review/`. This file combines them.

**Scope:** reasoning only. `OPTIMIZATION_PLAN.md` is unchanged; §6 lists the changes proposed for the owner's decision.

## 1. Method

1. **What each reviewer saw.** All four reviewed only the study repo and `OPTIMIZATION_PLAN.md` at `0889287`. ChatGPT cites 640 lines; the file has 639. None of them had the session records, the research notes or the scripts. Where a claim depended on those, I re-checked it against them.
2. **One ledger per assessment.** Every distinct claim becomes a row with its type and a verdict: **V** verified, **P** partly, **C** contradicted, **U** unverifiable, **A** already addressed in the plan.
3. **Every factual claim re-checked** against the sources the plan uses: Anthropic's docs fetched again today, the session records, the source repos, and Git's and GitHub's docs.
4. **Weighed by evidence, not by agreement.** Four models agreeing is not evidence. Agreement is shown so you can see it, but it carries no weight.
5. **Calibrated for the "brutally honest" instruction.** That framing invites inflated severity and confident unsupported claims, so each review notes how it shows in that assessment.
6. **Triaged with the plan's questions.** Does the point apply to this harness today? Does it change cost, time or quality measurably? Is the change worth its cost? A point that contradicts a decision reopens it only if it brings new evidence.

Sources checked during this review: `gh issue view` on anthropics/claude-code #48951 and #71061; the hooks docs (`if` field); the desktop docs (plan mode, Auto-fix); BabyBuddyHelper's `.github/workflows/build.yml` and `xunit-tests.yml`; `claude --version` (2.1.304); `Docs/Project_Vision.md` and `Docs/README.md` in the study repo; and the per-block costs computed from the cost tables in `research/01` and `research/02`.

## 2. How the reviewers compare

| | Claims | V | P | C | U | A | Defects in the plan they found | How the "brutally honest" framing showed |
|---|---|---|---|---|---|---|---|---|
| **ChatGPT** | 23 | 15 | 5 | 0 | 1 | 4 | **3 real ones**: `-D` data loss, a stale PR head, the false durability claim | Priority inflation: 5 items labelled P0, of which 3 meet its own P0 bar |
| **Grok** | 16 | 8 | 4 | 1 | (1) | 4 | 0 (it repeated one of the plan's errors) | Restating the plan; one unsourced generalisation; misread V2 as optional |
| **Gemini** | 8 | 4 | 2 | 2 | 0 | 0 | 0 | Impact inflation; two numeric claims wrong (Artifact saving ~1.8× too high; Sonnet break-even) |
| **Copilot** | 7 | 1 | 3 | 2 | 0 | 1 | 0 | The opposite: mostly praise. Two factual errors; citations can't be checked. |

Some rows in the ledgers carry two verdicts (e.g. A + P), so a row's verdict counts can add to more than its claims. Grok's U is shared with a P on the same claim.

**Takeaways:**

- **ChatGPT's assessment is the useful one.** It is the only one that found defects in the plan, and every external source it cites is real.
- **The other three mostly echo the plan.** Their value is a handful of cheap, sound additions: Gemini's plan-template sections and structured gate output; Grok's thin-handoff path, one-shot surveyor and owner time.

## 3. Errors in the plan, confirmed

| # | Error | Found by | Evidence |
|---|---|---|---|
| E1 | D3 says the handoff "survives across days and machines". It survives on **one machine** only, because `.claude/work/` is gitignored. | ChatGPT (Grok repeated the error) | §6.5 against D3 |
| E2 | §8.4's "starting context ≤ 85k" doesn't say *when* it is measured. Block B starts at ≈ 88k. | ChatGPT (it read this as a contradiction) | §8.4's own basis counts global + project only |
| E3 | §8.2 says re-deciding D6 saves "roughly $1 more per issue". Per-block arithmetic gives **≈ $0.45 for Artifact** and **≈ $0.25 for connectors**, so ≈ $0.70 together. | Found during this review, prompted by Gemini's (overstated) claim | Per-block reads and writes at the list rates used in R1 |
| E4 | `/close`'s `-D` fallback trusts the PR's state, not the local branch. | ChatGPT | `git branch` docs; S2 in §6.4 |

## 4. Combined findings, ranked

Each finding merges the ledger rows behind it. Priority: **P0** fix before the pilot runs any autonomous step; **P1** fix during the pilot setup (V0); **P2** owner decision or later.

| # | Finding | Rows | Priority | Evidence strength |
|---|---|---|---|---|
| **F1** | **`/close` can destroy local work.** Before any delete, compare the local tip with the PR's `headRefOid` and require a clean tree; abort otherwise. Test with a squash merge, a rebase merge, and an extra local commit. | GPT-5 | P0 | Verified (git docs) |
| **F2** | **The design has a fixed cost floor, so small issues won't get cheaper.** Three session-start writes (A 83k × $8, B 88k × $4, C 87k × $8 per MTok) ≈ **$1.7**, plus red-team ≈ $0.5 and surveyor ≈ $0.2, give **≈ $2.4 before any work**. Sketching a tiny issue under the design (≈ 8 + 15 + 8 calls) gives ≈ **$3.1–3.3**. The baseline's two small issues cost **$3.08 (#118) and $3.82 (#47)**. So risk-scaled tiers are well supported. **But** a tiny tier that drops the review (Copilot's A → B → D) removes a guarantee P5 keeps. A tier should merge blocks (e.g. A+B in one session) and keep an independent review. | GPT-22, COP-6, GRK-7 | P2, owner decision | Our own data plus arithmetic |
| **F3** | **Bind review and CI to the PR head SHA.** Auto-fix is set on the PR in Block B's session, so it can push after the handoff. The handoff records `prHeadSha`; `review` refuses if the head has moved; G2 states the SHA it reviewed. Name Auto-fix as an external dependency in §6.5. | GPT-6, GPT-18 | P0 | Verified (desktop docs, app behaviour) |
| **F4** | **Clear-on-accept is unverified on the owner's surface.** A real bug existed (#48951, closed). The desktop docs don't document the option. V0 must test it in the desktop app, and the plan needs a fallback: `/clear`, then load `.claude/work/<issue>/plan.md`. #71061 doesn't apply: no PermissionRequest hook approves plans here. | GPT-7 | P0 | Verified (issues real; docs silent) |
| **F5** | **An explicit BLOCKED state.** On H2's 3-failure cap, H2 writes `BLOCKED` with the failing check. A handoff can't be `READY` while it is set, and S3 enforces that. The owner chooses: fix the plan, resume Block B in a **fresh Opus session** (not a mid-session model switch, which costs a cache miss), or stop. H2's output is structured: attempt n/3, the failing check, the error. | GPT-8, GEM-6, GEM-7 | P1 | Design gap, verified in §6.2 |
| **F6** | **Correct the durability claim (E1).** Decide whether cross-machine recovery matters. If it does, post the approved plan and the handoff as issue comments, which are durable and already the home of scope decisions. Otherwise state "same machine". | GPT-10, GRK-2 | P1 / owner | Verified |
| **F7** | **Replace H3's command rewriting with a named-check runner.** The skills call `node .claude/scripts/check <fast\|full\|id>`. The runner preserves the exit code, logs the check ID and trims output. Rewriting arbitrary Bash relies on `if` matching that the docs call best-effort: the hook runs "regardless of the pattern" when Claude Code can't parse the command. H4 must likewise re-check the command it was given. | GPT-11 | P1 | Verified (hooks docs) |
| **F8** | **Require status checks in branch protection,** not only a PR and no force push. Ship a copy-paste ruleset checklist per repo. | GPT-9, GRK-13 | P1 | Verified (GitHub docs) |
| **F9** | **Calibrate the quality metrics.** Seed 2–3 known defects in V0 and record red-team recall. Add counts of reopened issues, follow-ups created at G2, and plan deviations. Track owner time at G1 and G2. Label the pilot **preliminary**: zero escapes in 3 issues leaves a 95% upper bound of ~63%. | GPT-4, GPT-20, COP-4, GRK-16 | P1 | Verified (statistics) |
| **F10** | **Make the plan template carry what the clear discards:** add "Rejected approaches" and "Invariants to preserve" (§5.4). Let Block B call the surveyor once for reading; behaviour changes still stop and ask. If `review` finds the handoff thin, it may request one bounded summary of Block B's commits and diff. | GEM-1, GRK-9, GRK-11, GRK-15 | P1 | Design gap |
| **F11** | **Docs: add a semantic-drift check.** Seed a doc-drift case that names no path. Instruct the red-team explicitly to check docs against behaviour. Treat S1 output as "candidates". One knowledge audit at each epic close, not a calendar. | GPT-12, GRK-5, COP-5 | P1 | Partly addressed already |
| **F12** | **Implementation specs:** define the `.lastpass` fingerprint (index + work tree + untracked + `harness.json` + script versions); use `execFile` with argument arrays; tag hook output `[harness <hook>]`; V0 injects malformed hook input. | GPT-13, GPT-19, GEM-5 | P1 | Practice |
| **F13** | **Measurement hygiene:** state $7.49 as the cut-off (E-range $7.2–7.7). Define the starting-context metric as "before the first prompt" (E2). Book V2's extra Block B separately. V0 records version, surface, resolved models and effort. Correct the D6 saving to ≈ $0.70 (E3). | GPT-2, GPT-3, GPT-16, GPT-21, E3 | P1 | Verified |
| **F14** | **Projects without tests:** one *automated* observable per sub-phase where possible (manual only with a reason), and a handoff line "Not verifiable here". | GPT-14, GRK-12 | P1 | Design gap |
| **F15** | **The owner's MAUI build duplicates CI.** `build.yml` runs on `pull_request` and builds the same `net10.0-windows` target. Keep the local build only if it catches something CI can't. | GPT-15 | P2, owner (D9) | Verified |
| **F16** | **Record the Claude Code dependencies:** opusplan, clear-on-accept, hooks, Auto-fix, the settings keys, with the version tested and the fallback for each. This is not a portability project: the production harness targets the owner's tool, and portability stays with study #22. | COP-3, GRK-6 | P2 | Partly (the "originally platform-agnostic" premise is overstated) |

## 5. Declined, with reasons

| Rows | Claim | Why declined |
|---|---|---|
| COP-1 | ≈ 12k of the start is project content | Contradicted: the project CLAUDE.md was 0; the ~12k is the system prompt plus environment |
| GEM-3 | Artifact off → $6.40–6.90 (~31%) | Overstated ~1.8×; ≈ $0.45 per issue. D6's existing trigger stays; the owner may still re-decide (§6). |
| GEM-4 | Sonnet loses its price advantage at +30–40% turns | Arithmetic: it breaks even only around 2× the calls. V2 measures the real rework risk. |
| GRK-4 (part) | "History of agentic systems shows…" | Unsourced. The underlying risk is kept via §8.4. |
| GRK-8, GRK-10, GRK-14, COP-7, GPT-17, GPT-23 | Make V2 mandatory; measure `/context`; try medium effort; an evidence principle; permission-mode note; measure before D6 | Already in the plan |
| COP-5 (part) | Monthly and quarterly audits | No evidence for a cadence; reduced to an epic-close audit (F11) |
| GPT-19 (part) | Linux test matrix now | The owner is Windows-only today; add Linux when CI runs the hooks |

## 6. Proposed plan changes, for the owner's decision (not applied)

- **Before the pilot (P0):** F1, F3, F4.
- **During V0 setup (P1):** F5, F7, F8, F9, F10, F11, F12, F13, F14. All of these are additions or specifications within decided decisions; none reverses one.
- **Owner decisions:**
  - **F2** — workflow tiers. A new decision; the likely shape is a "small" tier that merges A+B and keeps the review.
  - **F6** — same-machine durability or issue-comment durability. This amends D3.
  - **F15** — keep or drop the local MAUI build. This amends D9.
  - **D6 re-decision** — the evidence is now ≈ $0.70 per issue for Artifact plus connectors, not "~$1".
- **Errors to correct:** E1–E4 (§3) are factual fixes to the plan text, whatever the decisions above.
