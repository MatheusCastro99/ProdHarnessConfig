# Review of the Copilot assessment

Reviewed 2026-10-21 against `OPTIMIZATION_PLAN.md` at `0889287`, the study repo, and the session records behind `research/`.

## Overall

- **Mostly affirmation.** It has three concerns and three suggestions, and none of them names a specific defect.
- **Its citations (`【1-eb7ceb】`) are opaque tool markers.** They point to "the plan" in general, not to a section or line, so they can't be checked.
- **Calibration:** despite the "brutally honest" instruction, it under-critiques: there are scores of 9/10 throughout. The concerns it does raise are reasonable in direction. Two factual statements are wrong.

## Ledger

Verdicts: **V** verified · **P** partly verified · **C** contradicted · **U** unverifiable · **A** already addressed in the plan.

| ID | Claim, in my words | Type | Verdict | Evidence | Triage |
|---|---|---|---|---|---|
| COP-1 | Of the 84k start, ≈ 72k is global overhead and ≈ 12k is project-specific content | Fact | **C** | §5.1: the project CLAUDE.md is **0**. The remaining ~12k is the Claude Code system prompt (11.1k) plus environment. Nothing in it is project content. | Decline. Note: it also misreads why D5 was decided. |
| COP-2 | Session boundaries address the real cost driver | Praise | V | §2, research/01 | No change |
| COP-3 | The plan is coupled to Claude Code; write an ADR with dependencies, assumptions and fallbacks | Risk | P | It is true the design uses Claude Code features throughout. But "the original was platform agnostic" is overstated: the study's templates are Claude Code definitions, and its Vision's "not tied to one stack" means .NET versus MERN, not the agent platform. This production harness is meant for the owner's tool. | **Adapt**: a short "Claude Code dependencies" list (each feature, the version tested, and the fallback), which is cheap and feeds the V0 checks. Portability stays with study issue #22. |
| COP-4 | Outcome metrics are missing: escaped defects, reopened work, rework, misinterpretation | Gap | **C / P** | §8.3 already tracks escapes, red-team findings, G2 decisions and fix loops. Not tracked: reopened issues, follow-up issues created at G2, and plan deviations (the handoff has them, but they aren't counted). | **Adopt** the missing three as counts. Decline the "not measured" framing. |
| COP-5 | Removing the historian loses knowledge auditing; add periodic audits (monthly ADRs, quarterly docs) | Gap | P | The S1 limit is admitted in §6.4. An audit calendar is a new process, at a cadence that can't be justified yet. | **Adapt**: one audit at the epic close-out (as the study's memory flush already ran), not on a calendar |
| COP-6 | Workflow tiers: tiny issues go A → B → D, skipping review | Design | P | Tiers are supported by our data (fixed floor ≈ $2.4; combined F2). **Skipping C removes the independent review**, a guarantee P5 keeps. | **Owner decision** on tiers. Recommend that a tiny tier keeps a review but merges blocks, not that it drops the review. |
| COP-7 | Formalize "measured evidence overrides preference" as a principle | Principle | A | P7 "Measure before claiming", plus the plan's opening sentence | No change |
