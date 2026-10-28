# Review of the Grok assessment

Reviewed 2026-10-21 against `OPTIMIZATION_PLAN.md` at `0889287`, the study repo (`Docs/Project_Vision.md`, `Development_Workflow.md`, `Working_Agreements.md`), and the session records behind `research/`.

## Overall

- **A faithful summary.** Its baseline table matches the plan exactly, and its strengths and weaknesses are fair.
- **Most of its evidence is the plan quoting itself.** Few points add external evidence.
- **Calibration:** the "brutally honest" framing shows less here. Its errors are of a different kind:
  - It **repeats one of the plan's false claims** (handoffs "survive across days/machines", §3.4).
  - It **misreads a decided item as optional** (V2).
  - It makes **one unsourced generalisation** ("history of agentic systems shows…").
- **Its useful contributions:** a thin-handoff recovery path, a one-shot surveyor for Block B, owner wall-clock time, and naming the "simple first" tension.

## Ledger

Verdicts: **V** verified · **P** partly verified · **C** contradicted · **U** unverifiable · **A** already addressed in the plan.

| ID | Claim, in my words | Type | Verdict | Evidence | Triage |
|---|---|---|---|---|---|
| GRK-1 | Baseline numbers ($9.99, 291k, 68–83k, $14.68, 46/37/18, 72k of 84k…) | Fact | V | Match §2, §5.1, §8.1 and the records | — |
| GRK-2 | A handoff file "survives across days/machines" | Fact | **C** | Repeats the plan's own error. `work/` is gitignored (§6.5), so it survives on the same machine only. | Correct the plan (see GPT-10) |
| GRK-3 | The cost target is optimistic; the remainder is structural global overhead | Risk | V | §8.2 says so; GEM-3's recomputation sizes the Artifact share at ≈ $0.45 | Already the D6 trigger. No change. |
| GRK-4 | Fewer gates can weaken the guarantees; "history of agentic systems shows…" | Risk | P / U | The risk is real, and §8.4's quality targets exist for it. The historical claim has no source. | Keep the risk; drop the unsourced claim |
| GRK-5 | Removing the historian is weaker on conceptual drift | Risk | V | §6.4 S1 states the limit | Merged with GPT-12 |
| GRK-6 | Tight coupling to the current Claude Code surface | Risk | P | Real dependencies; the original's "not tied to one stack" means .NET versus MERN, not the agent platform (`Project_Vision.md:38`) | Merged with COP-3 |
| GRK-7 | Complexity cuts against "Simple first" | Tension | V | `Docs/Project_Vision.md:26` and `Docs/README.md:31` contain the principle; §6.5 adds about 15 files | **Owner awareness**: tiers (combined F2) are the main mitigation |
| GRK-8 | Make V2 mandatory, not optional | Method | **A** | D16 already decides V2 for one pilot issue | No change |
| GRK-9 | Add a "thin handoff" failure path: present but underspecified | Gap | V | S3 checks that sections exist and the size limit, not substance | **Adopt**: if `review` finds the handoff insufficient, it may request one bounded summary from Block B's commits and diff, via the surveyor, before G2. Count it as a metric. |
| GRK-10 | Measure `/context` under D6 before writing skills | Method | A | V0 already does this | No change |
| GRK-11 | Plan-completeness checklist before G1 | Gap | A + P | S3 already checks plans against §5.4. Only GEM-1's sections are new. | Merged with GEM-1 |
| GRK-12 | Without tests, require one *automated* observable per sub-phase | Gap | V | D8 allows manual checks | **Adopt**: automated where the project allows (a scripted request, a build artifact check); manual only with a stated reason |
| GRK-13 | A copy-paste branch-protection template | Practice | V | §6.3 leaves it as owner setup | Merged with GPT-9 |
| GRK-14 | Try medium effort on Block B | Method | A | D13 and the §8.5 triggers already allow it | No change |
| GRK-15 | Let Block B request a one-shot surveyor when the plan is thin | Design | V | Not forbidden, but not stated; subagents start at 7–12k (§7.1) | **Adopt**: allowed for reading. Behaviour changes still stop and ask (Working Agreements rule 5). |
| GRK-16 | Track owner wall-clock time, not only turns | Metric | P | §8.3 tracks session active minutes, not the owner's time | **Adopt**: the owner's time at G1 and G2 (time from prompt to reply) |
