# Review of the Grok assessment (second round)

Reviewed 2026-11-12. The assessment ([Grok_PROD_HARNESS_ASSESSMENT.md](../second_assessment_9d6087f/Grok_PROD_HARNESS_ASSESSMENT.md)) is dated 2026-11-11 and was handed the repo at `9d6087f`. It was checked against that commit, `main` today, and the D26 runs in [research/14](../../research/14-d26-validation.md).

## Overall

- **The most current reading of the three.** It worked from the README and research/13, so its figures, its escapes and its account of D25's regression match the record.
- **It mostly restates the project's own conclusions,** which is accurate but adds little. Every process defect it lists became a D26 change (E1–E13).
- **One lever worth acting on:** the global overhead D6 keeps on purpose. Turning off the Artifact tool and the connectors was priced at about $0.70 per issue, and it's the one cost lever the plan names that hasn't been tried. D26's Standard median so far is $10.61.
- **Calibration:** measured and careful. No inflation.

## Ledger

| ID | Claim, in my words | Verdict | Evidence | Triage |
|---|---|---|---|---|
| GRK2-1 | D24 $6.03 (5), D25 $8.32 (10); peaks 125k, 145k against 291k; turns 7, 9 against 11 | V | README Results, research/13 | — |
| GRK2-2 | The builder costs about $1.02–1.11, flat on larger diffs | P | research/13 gives $0.25–2.41 per builder; the flat medians aren't re-derived here | Note only |
| GRK2-3 | The owner-turn target is ≤ 6 | P | The first plan's target; research/13 §10 set ≤ 7 for Standard and ≤ 6 for Small | — |
| GRK2-4 | The first escapes were doc drift, caught by the Epic audit | V | research/13:129 | — |
| GRK2-5 | The owner's live check found a cause review couldn't | V | research/13:133 (#155) | — |
| GRK2-6 | Review became the dearest block; G2 fixes ran on Opus at high context | V | research/13; D26 E1 moved the fixes to the forked builder | — |
| GRK2-7 | Builders cross 200k when they run the UI check | V for D25, A for D26 | E7 moved the check to `ui-check` in review. D26 builders peaked at 169k at most, and that while polling stuck CI | — |
| GRK2-8 | Re-test turning off the Artifact tool and the connectors (≈ $0.70 per issue) | V, open | `OPTIMIZATION_PLAN.md` lines 50 and 717 name it as the next lever | **Adopt** (R15-7) |
| GRK2-9 | Add a second net for ADR and spec drift across issues | A | The Epic knowledge audit (E3); R14-12 fixes its order | — |
| GRK2-10 | Close research/13 §8's process defects | A | D26 E1–E13. In the D26 runs E2 and E5 held, and E3 missed once (#44) | — |
| GRK2-11 | Make content drafting an explicit step | A | ProdHarnessConfig#9 §1, `/draft` | — |
| GRK2-12 | Make the tier check visible and tested | P | The tier check works (no wrong tier in 9 D26 runs), but it was asked as a question twice where E8 says to state it (#53, #56) | Note only |
| GRK2-13 | Costs are list price; the owner is on a subscription | V | Stated in the research | Note only |
| GRK2-14 | Large surface area; coupled to Claude Code | V | The README frames it as one owner's setup | Note only |
| GRK2-15 | Don't collapse the gates; keep the session boundaries | V | Consistent with the design | — |

**Counts:** 15 claims · V 9 · P 3 · A 4 (GRK2-7 carries V then A).
