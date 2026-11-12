# R15: Meta-review of the second round of independent assessments

Date: 2026-11-12. Input: three assessments of ProdHarnessConfig at `9d6087f`, the merge of D26, in [`Independent_Assessments/second_assessment_9d6087f/`](../Independent_Assessments/second_assessment_9d6087f/): ChatGPT, Gemini and Grok, all dated 2026-11-11. Each is reviewed separately in [`Independent_Assessments/second_review/`](../Independent_Assessments/second_review/). This file combines them, as [research/03](03-assessment-review.md) did for the first round.

**Scope:** reasoning only. Nothing in the harness changes here; §5 proposes changes for the owner's decision.

## 1. Method

1. **What each reviewer saw.** All three were given the repo at `9d6087f`.
   - Grok read the README and research/13.
   - ChatGPT read the README and the optimization plan, including its pilot-era status and Result blocks.
   - Gemini read the plan's design sections.

   None of them had the session records or research/14's D26 runs.
2. **One ledger per assessment,** with a verdict per claim: **V** verified, **P** partly, **C** contradicted, **U** unverifiable, **A** already addressed.
3. **Every factual claim re-checked** against the repo at `9d6087f`, `main` today, `runs.json`, and the D26 runs in [research/14](14-d26-validation.md) (9 runs, all ThisIsMatheusCastro, 2026-11-11 to 12).
4. **Weighed by evidence, not agreement.**
5. **Triaged with the plan's questions:** does it apply today, does it change cost, time or quality measurably, and is it worth its cost?

## 2. How the reviewers compare

| | Claims | V | P | C | U | A | Defects found | Calibration |
|---|---|---|---|---|---|---|---|---|
| **ChatGPT** | 15 | 3 | 5 | 1 | 0 | 5 | **2 real ones,** both still on `main`: the README's headline figure and the plan's status block | Mild: two P0s that are documentation status |
| **Grok** | 15 | 10 | 2 | 0 | 0 | 4 | 0, but one open lever (D6) | Measured, no inflation |
| **Gemini** | 12 | 1 | 4 | 3 | 2 | 2 | 0 | Confident and flattering; reviewed a design that has since moved on |

**Takeaways:**
- **ChatGPT is again the one that found defects,** and both come from the same root: documents that summarize results went stale while the research moved on. That also explains its one contradicted claim (the Small tier "only on docs").
- **Grok is accurate but mostly restates the project's own conclusions.** Its one new contribution is to re-test D6.
- **Gemini's gaps are answered by things already built:** the test suite, and the required plan sections for rejected approaches and invariants.
- **All three agree on direction:** validate D26 before optimizing further, and don't collapse the gates. The D26 data supports it: the 9 runs so far are from one project, and the Standard median is $10.61, pulled up by drafting, stuck CI and post-build changes.

## 3. Errors in the repo, confirmed

| # | Error | Found by | Evidence |
|---|---|---|---|
| X1 | The README's opening says a typical issue "now costs about 40% less" than one long session. That is D24's figure. D25 was 17% below the baseline, and D26 is still being validated | ChatGPT | `README.md:5`, at `9d6087f` and on `main` |
| X2 | The optimization plan's status line still reads "D1–D24 … installed in BabyBuddyHelper and InvoiceMe", and its Result block reports the pilot ($5.16 and $4.80 Standard; Small $2.91 "all docs only"). Two assessors took these as current | ChatGPT (Gemini was misled by the same sections) | `OPTIMIZATION_PLAN.md:3` and `:44–48`; D26 is installed in all three projects since 2026-11-10 |

## 4. What the data says about their main recommendations

- **"Validate D26 before D27"** (all three). The D26 evidence is narrow: 9 runs, one project, 5 Standard and 4 Small. BabyBuddyHelper and InvoiceMe have no D26 runs yet. ProdHarnessConfig#9's twelve changes all come from those runs. Building them now is consistent with "measure, change, re-measure", provided the runs after the reinstall are labelled apart.
- **"Keep the harness small"** (ChatGPT). Each section of #9 names the failure it answers and was observed in a priced run. #9's Done-when already requires tests and the size budgets. The risk is CLAUDE.md and skill sizes: §1, §3, §6, §10, §11 and §12 all add text to skills or the template.
- **"Quality is more than no blocking finding"** (ChatGPT). The logs already record findings by source, priority and outcome, and escape windows. What's missing is cheap to add: a per-run tally of findings fixed, declined (a proxy for false positives) and found after merge.
- **Real-time context warnings and mid-build escalation** (Gemini). Not supported: 1 of 9 D26 runs crossed 200k, for a cause #9 §1 removes, and no builder thrashed.

## 5. Proposed changes, for the owner's decision

| # | From | Change | Cost |
|---|---|---|---|
| R15-1 | X1, ChatGPT | The README's opening states results by configuration: D24 about 40% below the baseline, D25 17%, D26 under validation. No single percentage | Done 2026-11-12 |
| R15-2 | X2, ChatGPT | The optimization plan's status line says D26, installed in all three projects from `9d6087f`; its Result block points to the README's Results and research/13–14 rather than repeating the pilot's figures | Done 2026-11-12 |
| R15-3 | ChatGPT | One versions table (README or plan §10): config → harness commit → each project's install PR → the research file that validates it → the `runs.json` label. The installer already records the commit in each project | A table, kept at each install |
| R15-4 | ChatGPT | Before D26's meta-analysis, get D26 runs in BabyBuddyHelper and InvoiceMe, and report by project, tier and kind as well as overall | Runs the owner does anyway |
| R15-5 | ChatGPT | When #9 and #8 are installed, label the runs that follow as a new config (D27), so D26's validation stays clean. When building #9, check CLAUDE.md and every skill against their budgets, and say which sections could be cut if one binds | Part of #9's build |
| R15-6 | ChatGPT | The next meta-analysis adds a quality tally per run: findings fixed, declined, and found after merge (escapes), by source | A column in the log |
| R15-7 | Grok | Once D26's medians are in, re-measure D6: turn off the Artifact tool and the connectors on one project for a few runs, and price the difference (≈ $0.70 per issue estimated) | A setting, then runs |

**Declined:**
- A public supported-version contract and changelog (the README says this isn't a product; GET_STARTED states Node 22).
- Real-time context telemetry.
- Mid-build model escalation.
- An `npx` scaffolder with branch protection by API (the installer exists).
- An AST-based doc map (the Epic audit and the red-team's doc lens cover drift).
- A seeded-defect programme. It's worth reconsidering if an escape appears that the logs can't explain.

## 6. Notes

- The owner moved the first round's files into `first_assessment/` and `first_review/`, beside `second_assessment_9d6087f/`. research/03's paths and the README's repo map are updated to match.
- ChatGPT's filename spells "ChatGTP"; it's kept as the owner saved it.
