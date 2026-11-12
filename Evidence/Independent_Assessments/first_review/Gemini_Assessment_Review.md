# Review of the Gemini assessment

Reviewed 2026-10-21 against `OPTIMIZATION_PLAN.md` at `0889287`, the study repo, the session records behind `research/`, and Anthropic's pricing docs.

## Overall

- **Short and concrete.** It raises four risks and four recommendations, and it shows its maths, which made it checkable.
- **Two of its quantitative claims don't survive checking.** The Artifact saving is overstated about 1.8×, and the "Sonnet negates its price advantage" claim is arithmetically wrong.
- **Calibration:** the "brutally honest" framing shows as **impact inflation**. "Lockup", "token leak" and "High" ratings are attached to effects worth cents per issue. Its non-numeric recommendations, though (plan template additions, structured gate output, escalation), are cheap and sound.

## Ledger

Verdicts: **V** verified · **P** partly verified · **C** contradicted · **U** unverifiable · **A** already addressed in the plan.

| ID | Claim, in my words | Type | Verdict | Evidence | Triage |
|---|---|---|---|---|---|
| GEM-1 | The A→B clear leaves Block B blind to edge cases and approaches that were discarded; add "Non-goals & rejected approaches" and "invariants" to the plan template | Gap | V | §5.4 has "Out of scope", but nothing for rejected approaches or invariants. The plan is B's only inherited context. | **Adopt**: two sections in §5.4, kept within the 3k plan budget |
| GEM-2 | The Artifact tool is ~12.6k, 15% of the 84k start | Fact | V | §5.1: 12.6/84 = 15% | — |
| GEM-3 | Turning Artifact off saves enough to reach $6.40–6.90 per issue (~31%) | Fact | **C (overstated)** | Pricing it per block at list price: reads A $0.05 + B $0.09 + C $0.06, plus 1h writes A $0.10 + B $0.05 + C $0.10, **≈ $0.45 per issue**. That gives ≈ $6.8–7.3, not $6.4–6.9. Its cache-write line also uses Sonnet's base input ($2) instead of the 1h write rate ($4). | **Owner decision** stays with D6's existing trigger. The real saving is ≈ 6% of the estimate. |
| GEM-4 | If Sonnet takes 30–40% more turns, the price advantage disappears | Fact | **C** | Sonnet is half price on every token type (pricing docs). 1.4× the calls at the same context is 0.7× Opus's cost. Even 1.4× calls *and* 1.2× average context is 0.84×. It takes about 2× the calls to break even. | Decline the claim. The *risk* of rework stays, and V2/D16 already measures it. |
| GEM-5 | A hook failure or ambiguous stderr makes the model try to fix the hook | Risk | P | Plausible, but no evidence offered. V0 already plans to make each hook fire once. | **Adopt** small: hooks prefix their output with `[harness <hook>]` and fail loudly on bad input; V0 injects a malformed input |
| GEM-6 | H2 output should be structured: attempt n/3, the failing component, the error, the required action | Practice | V | §6.2 gives a line cap but no format | **Adopt** (cheap) |
| GEM-7 | Escalation: after repeated H2 cap hits, stop and suggest resuming B on Opus | Design | P | It overlaps GPT-8 (BLOCKED state). Switching the model mid-session costs a cache miss, so resume in a **fresh** Opus session from the plan and handoff. | **Adopt** merged with GPT-8: BLOCKED → the owner chooses: fix the plan, resume on Opus, or stop |
| GEM-8 | Startup drops 80k → 67k with Artifact off | Fact | V | Arithmetic on §5.1 | Depends on GEM-3's decision |
