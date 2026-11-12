# Review of the ChatGPT assessment (second round)

Reviewed 2026-11-12. The assessment ([ChatGTP_ProdHarnessConfig_Assessment.md](../second_assessment_9d6087f/ChatGTP_ProdHarnessConfig_Assessment.md)) is dated 2026-11-11 and reviews ProdHarnessConfig at `9d6087f`, the merge of D26. It was checked against the repo at that commit, against `main` today, and against the D26 runs in [research/14](../../research/14-d26-validation.md).

## Overall

- **The most useful of the three again.** It found two real documentation defects that are still on `main`: the README's headline figure and the optimization plan's status block. Both misled it, and one of them misled Gemini too.
- **It read the stale parts of the plan as current.** Its figures for InvoiceMe ($5.16, $4.80) and the Small tier ($2.91, "documentation only") come from the plan's pilot-era Result block. research/13 had already superseded them at `9d6087f`. The error is the plan's, and the assessment shows its cost.
- **Its main recommendation fits the data:** validate D26 before optimizing further. The D26 runs so far are all from one project.
- **Calibration:** the two P0s are documentation status, not harm. That's milder inflation than its first assessment, and both points are real.

## Ledger

Verdicts: **V** verified · **P** partly verified · **C** contradicted · **U** unverifiable · **A** already addressed.

| ID | Claim, in my words | Verdict | Evidence | Triage |
|---|---|---|---|---|
| GPT2-1 | D26's rollout status is unclear: the plan says D24, installed in two projects | V, then A for the install | `OPTIMIZATION_PLAN.md:3` still says "D1–D24 … installed in BabyBuddyHelper and InvoiceMe", on `main` too. D26 has been installed in all three since 2026-11-10 (`c570f15`) | **Adopt** (R15-2) |
| GPT2-2 | One version-to-evidence record: version, commit, installs, runs, limits | P | The installer records the harness commit it installed from in each project, and `runs.json` labels every run's config. No single table ties them together | **Adopt, small** (R15-3) |
| GPT2-3 | Cross-project evidence is thin: two InvoiceMe runs, BabyBuddyHelper built on Opus | P | The figures are the plan's pilot block; research/13 priced 49 runs in three projects. But all 9 D26 runs so far are ThisIsMatheusCastro's | **Adopt** (R15-4) |
| GPT2-4 | "About 40% less" is D24's figure, not today's | V | `README.md:5` still says it. D25 is 17% below the baseline, and D26's Standard median so far is $10.61 | **Adopt** (R15-1) |
| GPT2-5 | Quality needs a scorecard, not "no blocking finding at merge" | P | The logs record findings by source, priority and outcome, plus escape windows. No false-positive tally, and no seeded defects since the v0 trials (research/04, /07) | **Adopt the cheap part** (R15-6) |
| GPT2-6 | The Small tier has only run on docs ($2.91) | C | research/13: Small code median $3.99 over 3 runs; D26 adds #53, #54 and #56, all code | Feeds R15-2 |
| GPT2-7 | Small needs risk limits, and the builder mustn't downgrade the tier | A | `scope` step 2: no schema, migration, auth, security, dependency or public-interface change. The tier is the approved plan's, not the builder's (D25) | — |
| GPT2-8 | Projects without tests need explicit evidence limits | A | The handoff's Checks must say what isn't verifiable (tested in `handoff-check.test.cjs`); G2 reports list "Not verifiable here" | — |
| GPT2-9 | Keep model comparisons controlled | — | None is planned | Note only |
| GPT2-10 | Keep the harness small: each addition names its failure and has a test | V as a principle | ProdHarnessConfig#9 holds 12 changes. Each names the failure it answers, and its Done-when asks for tests and the size budgets | **Adopt as a check** for #9's build (R15-5) |
| GPT2-11 | Doc drift is recurring | A | The Epic knowledge audit (E3), the red-team's doc lens, and R14-12 for the close's order | — |
| GPT2-12 | Failure-path tests: stale head, old-SHA CI, local-only commit, dirty tree, BLOCKED | A | `handoff-check` and `close` tests cover each; the installer refuses a dirty target | — |
| GPT2-13 | A supported contract: versions, OS, Node, a changelog | P | GET_STARTED states Node 22; the decision log serves as the changelog. The README says this isn't a product | Decline for now |
| GPT2-14 | Next is D26 validation and stabilization, not D27 optimization | P | Right about validation. But #9 is a batch of fixes found by D26's own runs, not a redesign | **Adopt the labelling** (R15-5) |
| GPT2-15 | The evolution table, strengths and success criteria | — | Accurate summary | Note only |

**Counts:** 15 claims · V 3 · P 5 · C 1 · A 5 · notes 2 (one row carries V then A).
