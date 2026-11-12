# Review of the Gemini assessment (second round)

Reviewed 2026-11-12. The assessment ([Gemini_prodharnessconfig_assessment.md](../second_assessment_9d6087f/Gemini_prodharnessconfig_assessment.md)) is dated 2026-11-11 and was handed the repo at `9d6087f`. It was checked against that commit, `main` today, and the D26 runs in [research/14](../../research/14-d26-validation.md).

## Overall

- **It reviewed the design sections of the optimization plan, not the repo.** It names hooks H1–H5, the work folder as `.claude/work/`, and the V1/V2 pilots as still to run. The work folder is `.harness/work/`, and the pilots ran weeks ago; research/13 priced 49 runs.
- **Its main gap is contradicted:** "no automated self-test suite". ProdHarnessConfig has 12 test files and 136 tests on `node --test`, hooks included.
- **Its plan-template proposal is already built:** "Rejected approaches", "Invariants to preserve" and "Out of scope" are required plan sections, checked by `handoff-check`.
- **Calibration:** confident and flattering ("the top 1%"). Two claims are stated as guarantees the data contradicts.
- **Nothing new to adopt.** Its real-time context warning and its mid-build escalation to Opus answer problems the D26 runs haven't shown.

## Ledger

| ID | Claim, in my words | Verdict | Evidence | Triage |
|---|---|---|---|---|
| GEM2-1 | G1 and G2 are hard session boundaries, so the cold-resume cost is gone | P | True on Standard. Small runs in one session by design (D22), and #47's resume after 1 h 43 min re-cached 84k ($0.68) | Note only |
| GEM2-2 | CLAUDE.md under 3k, area rules loaded by path | V | Budgets in `test/config.test.cjs` | — |
| GEM2-3 | Inline docs gated by the stale-docs hook "guarantee" docs never drift | C | research/13's first escapes were doc drift, caught by an Epic audit. Epic 4's audit found six more (#44) | — |
| GEM2-4 | The plan loses "negative knowledge"; add non-goals and invariants | A | `PLAN_SECTIONS` requires Rejected approaches, Invariants to preserve and Out of scope (test F10) | — |
| GEM2-5 | There's no self-test suite for the hooks and scripts | C | 12 test files, 136 tests, fixtures for every hook event | — |
| GEM2-6 | The hooks are coupled to Claude Code's changing schemas | P | A real risk. The tests use fixtures, not the live CLI. No hook broke in the D26 runs | Note only |
| GEM2-7 | Escalate a stuck sub-phase from Sonnet to Opus mid-build | U | No builder thrashed in D26. Builders cost $0.35–1.63 per run, except the one polling stuck CI (#52, R14-6). Three failed checks already stop the build (BLOCKED) | Decline |
| GEM2-8 | Real-time context-budget warnings | P | 1 of 9 D26 runs went over 200k (#53), from drafting inside `/scope`, which ProdHarnessConfig#9 §1 moves out | Decline |
| GEM2-9 | Stale-docs false positives cost turns | P | An acknowledgement costs one call, not an owner turn. The blocked case is R14-5 (#9 §5) | Decline beyond R14-5 |
| GEM2-10 | Package as an installer; separate the core from project config | A | `Onboard/install.cjs` and `projects/<Project>/` | Decline the rest (`npx`, branch protection by `gh api`) |
| GEM2-11 | The design as H1–H5, `.claude/work/`, `opusplan`, pilots pending | C | Stale design-section reading | — |
| GEM2-12 | "The top 1% of practical AI agent orchestration" | U | No evidence offered | — |

**Counts:** 12 claims · V 1 · P 4 · C 3 · U 2 · A 2.
