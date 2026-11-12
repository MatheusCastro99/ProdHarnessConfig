# Critique of the Production Harness Optimization Plan

**Author:** Grok analysis  
**Date:** 2026-10-21  
**Source documents:**
- Optimization Plan (`OPTIMIZATION_PLAN.md`, status: all decisions D1–D17 made, not yet validated)
- Original repository: [HarnessConfigAndWorkflow](https://github.com/MatheusCastro99/HarnessConfigAndWorkflow)
- Key original pages examined: `AI_CONTEXT.md`, `Development_Workflow.md`, `Working_Agreements.md`, `Project_Vision.md`

This document provides a structured, evidence-based critique of the Optimization Plan. Every major claim, strength, weakness, and suggestion is tied to measured data from the plan itself, the original 12-stage workflow, or Claude Code mechanics described in the plan.

---

## 1. Executive Assessment

The original HarnessConfigAndWorkflow is a deliberate, owner-centric process that prioritizes human judgment, explicit stages, independent review, and documentation hygiene. It grew from two real projects (BabyBuddyHelper and InvoiceMe) and is intentionally conservative.

The Optimization Plan correctly diagnoses the two largest problems surfaced in validation run #28 and the broader baseline:
- **O8**: 7 approval gates make the 12-stage workflow clunky.
- **O9**: Token usage and cost are unsustainable (median ~$9.99 per BabyBuddyHelper code issue; context grows from 68–83k to ~290k with no shrinkage).

The proposed redesign (4 blocks, 2 gates, session boundaries at gates, hooks for deterministic enforcement, model role-splitting, tight context budgets) is coherent and mostly well-motivated. The measurement framework in §8 is a particular strength.

However, several cost and quality claims remain optimistic, the residual cost is largely structural (global overhead), and the new machinery is significantly heavier than the original’s “simple first” principle. The plan should be treated as a strong hypothesis set that must be validated by the pilot before any claim of “validated” status.

**Core recommendation:** Implement as written, instrument the pilot ruthlessly, and treat measured results (not the §8.2 arithmetic) as the authority for further decisions.

---

## 2. Evidence Baseline Used in This Critique

All quantitative claims below draw from the Optimization Plan’s own data unless otherwise noted.

| Metric | Value | Source in Plan |
|--------|-------|----------------|
| Median cost per BabyBuddyHelper code issue | $9.99 (range $3.08–$20.21) | §8.1, 10 issues |
| Median peak context | 291k | §8.1 |
| Starting context range | 68–83k | §8.1 / §2 |
| #28 total cost (list price) | $14.68 | §2 |
| #28 cost split | Cache reads 46%, cache writes 37%, output 18% | §2 |
| #28 main-session share | 84% of cost | §2 |
| #28 context growth | 84k → 320k (mean 218k) over 142 calls | §2 |
| Global setup overhead in #28 start | ~72k of 84k tokens | §5.1 |
| Artifact tool alone | ~12.6k tokens | §5.1 |
| Skill listing | ~10.8k | §5.1 |
| Claude Code system prompt | ~11.1k | §5.1 |
| Estimated startup under D6 | ~78–80k | §5.1 |
| Estimated cost under new plan | $7.2–7.7 (~25% below $9.99) | §8.2 (estimate) |
| Target peak context | ≤200k per block | §8.4 |
| Target owner turns | ≤6 | §8.4 |
| Sonnet vs Opus price ratio | Exactly ½ on every token type | §7.1 |

The original workflow’s 12 stages and 7 gates are taken from `Development_Workflow.md`. The “owner decides / independent review / docs as part of the change” principles are taken from `Project_Vision.md` and `Working_Agreements.md`.

---

## 3. Strengths (Keep These)

### 3.1 Evidence-first diagnosis
The cost breakdown, the identification of cold resumes and day-2 work as expensive, and the recognition that ~72k of starting context is global setup (not project docs) are the strongest parts of the plan. Treating gates as session boundaries (P3 / D3) is the single highest-leverage design decision.

**Evidence:** #28 day-2 close alone consumed 39% of the run; a single cold resume call was 12% of main-session cost. Read cost scaled from ~$0.017 at 84k to ~$0.064 at 320k.

### 3.2 Deterministic enforcement over prose
Hooks H1 (PostToolUse lint), H2 (Stop gate on `checks.fast` with 3-failure escape), H3 (output quieting), and H4 (stale-docs commit blocker) correctly implement P4. CLAUDE.md is acknowledged as “context, not enforced configuration.”

**Evidence:** Claude Code documentation (cited in plan) states that CLAUDE.md is not enforced configuration and that hooks can block. The original relied on the model following stage instructions and Working Agreements rules; that is weaker under long contexts.

### 3.3 Model role split + `opusplan`
Opus for scope (A) and red-team / triage (C), Sonnet for the high-call-volume Build block (B) is rational. The clear-on-accept boundary makes the model switch free (no extra cache miss).

**Evidence:** Sonnet is exactly half the price of Opus on every token type (§7.1). Block B is expected to contain the majority of calls. Subagents already start small (7–12k vs main 84k in #28).

### 3.4 Structured handoff + size-capped templates
Replacing long-lived sessions and cold resumes with a fixed-template, S3-validated handoff file is superior to `/compact` for this workflow. The plan correctly notes that a file can be edited, survives across days/machines, and gives triage an explicit record of intent.

**Evidence:** Day-2 and cold-resume costs in #28; P3 principle derived from that data.

### 3.5 Honest measurement protocol
§8 labels estimates as estimates, defines clear targets, and schedules a multi-stage pilot (V0 setup → V1 BabyBuddyHelper → V2 model comparison → V3 InvoiceMe). Kill criteria are explicit.

---

## 4. Weaknesses and Risks

### 4.1 Cost target is optimistic; residual is mostly structural
The $7.2–7.7 estimate assumes clean session boundaries, limited growth to ≤200k, and that Sonnet + smaller contexts deliver ~25% savings. Most remaining cost is the ~80k global overhead that is re-read (and often re-written to cache) on every call of every block.

**Evidence:**
- §5.1 shows ~72k of #28’s 84k start was global (tools, system prompt, skill listing, connectors).
- D6 deliberately keeps Artifact (~12.6k) + connectors.
- Each new block session usually starts after the 1h main-session TTL, forcing a new cache write of the global prefix.
- §8.2 itself notes that the next lever if the pilot misses is D6.

**Risk:** Declaring the plan a 25% win before measured data arrives.

### 4.2 Context budgets are aspirational
≤3k CLAUDE.md, ≤2.5k per skill, ≤3k plan, ≤2k handoff, ≤80k global are good targets. In practice the sticky global layer dominates.

**Evidence:** §5.1 measurement; the original’s “read README + Vision + Roadmap + AI_CONTEXT + Context/* before any edit” already added 17–20k tokens on top of global overhead. The new design removes that but still budgets as if the project layer is the main controllable variable.

### 4.3 Gate reduction can weaken original quality guarantees
Original: 7 explicit owner gates. New: G1 (plan) + G2 (findings + docs + PR readiness). P5 claims “fewer gates, not weaker guarantees” via hooks and red-team. This only holds if the single G1 plan is complete, Sonnet stays inside the plan’s latitude, the one fix loop is enough, and the owner still performs the MAUI build + merge.

**Evidence:** Original `Development_Workflow.md` deliberately placed gates at decisions, sub-phases, implementation plans, PR, findings, docs, and memory. The plan’s own quality targets (§8.4) correctly require “red-team majors no higher than first runs’ median” and “zero escapes.” History of agentic systems shows collapsing human checkpoints often increases escape rate unless automated checks are extremely strong.

### 4.4 Historian removal is a trade-off, not a pure win
D2 (inline docs in the same commit as code) improves currency. The script + H4 + red-team is a reasonable replacement, but it is weaker on conceptual / non-path-linked drift.

**Evidence:** Original design intentionally used an independent historian subagent after the change was final. The plan itself notes that “drift that never names a path is invisible to the script.”

### 4.5 Tight coupling to current Claude Code surface
`opusplan`, `showClearContextOnPlanAccept`, Auto-fix, exact hook events, `updatedInput` rewriting, permission classifier, cache TTLs, Artifact tool size, etc. Any of these changing (or behaving differently on Windows vs Linux / desktop vs CLI) forces rework.

**Evidence:** Multiple sections of the plan cite specific Claude Code behaviors and settings. The original workflow was more platform-agnostic in spirit (`Project_Vision.md`: “not tied to one stack”).

### 4.6 Increased complexity and maintenance surface
New artifacts: `harness.json`, 5 hooks, 4 scripts, 4 skills, 2 agents with frontmatter, work/ directory, strict templates, branch-protection + allow/deny rules that must stay in sync with `defaultBranch`.

**Evidence:** Compare original structure (readable context pages + a few agents/skills) with the file layout in §6.5. The original’s “Simple first. Add structure when the project needs it” principle (`Project_Vision.md`) is partially sacrificed.

### 4.7 Block B autonomy assumptions
“The plan is the only inherited context” means any ambiguity or missing detail in the G1 plan becomes a failure mode. The surveyor is deliberately summary-only (good for cost, risk for completeness).

**Evidence:** #28 surveyor runs found issues before checkpoints; the plan notes there is “no evidence either way on Sonnet as the main implementer.”

### 4.8 InvoiceMe / no-tests path is thinner
D8 is pragmatic, but “named observable checks” still requires the model and owner at G1 to invent good oracles. Without a real test suite the quality safety net is weaker.

**Evidence:** Plan §6.1 explicitly states InvoiceMe has no test suite (`test` script is a stub that exits 1). Adding tests is correctly treated as a separate follow-up.

---

## 5. Prioritized Suggestions with Evidence

### Must-do (before or during implementation)

**1. Treat $7.2–7.7 and ≤200k as hypotheses only. Instrument every pilot issue with the exact §8.3 metrics and publish the actuals.**

- **Justification:** §8.2 is arithmetic on #28’s split, not a measurement. The plan itself labels it an estimate “to be tested.” Declaring victory on 25% before data arrives violates P7 (“Measure before claiming”).
- **Evidence:** #28 raw token totals misread cost by ~2× until priced; the same risk exists here.

**2. Make V2 (Sonnet vs Opus Block B on the same approved plan) mandatory, not optional.**

- **Justification:** D12 is a major cost lever. The only way to know whether Sonnet adds rework (extra fix loops or major findings) is a controlled comparison.
- **Evidence:** Plan §8.5 already defines the method (two worktrees, same plan). §7.3’s “about a quarter” saving is arithmetic, not measured. Opus-only B should win only if it avoids a fix loop or major finding that Sonnet produced.

**3. Add an explicit “thin handoff” failure mode and recovery path.**

- **Justification:** S3 refuses to start review without a valid handoff, but the plan does not specify what happens if the handoff is present yet incomplete or underspecified. A degraded context in Block C defeats the purpose of the session boundary.
- **Evidence:** D3’s estimated saving (~$1–5) and the risk of a thin handoff are both stated in the plan. Fixed templates help but do not guarantee completeness.

**4. Measure actual starting context with `/context` under the exact D6 settings before writing production skills.**

- **Justification:** The 78–80k estimate is derived from #28’s request shape converted at 2.84 chars/token. It needs confirmation on the target machine and settings.
- **Evidence:** §5.1 itself says “Verify with `/context` during implementation.”

### Should consider

**5. Soften D6 earlier if the pilot misses the cost target.**

- **Justification:** Artifact (~12.6k) + connectors are large fixed costs that every call pays. Turning them off (or making them opt-in) is the cleanest remaining lever once session boundaries and Sonnet are in place.
- **Evidence:** §5.1 and §8.2 both identify the global overhead as the dominant residual. D6 already notes that Artifact + connectors can still be turned off later.

**6. Keep a lightweight independent doc check or strengthen red-team doc-vs-code instructions.**

- **Justification:** Full historian removal improves currency but weakens detection of conceptual drift. The script only catches path-named or basename matches.
- **Evidence:** Plan §6.4 S1 limit statement; original design intentionally used an independent historian after the change was final.

**7. Add a cheap “plan completeness” checklist that the scope skill runs before presenting G1.**

- **Justification:** The single G1 plan carries the entire downstream autonomy. A short mechanical checklist (files, acceptance criteria, named checks, docs at risk, out-of-scope) reduces the chance of a thin plan.
- **Evidence:** Original stages 2–4 were separate gates precisely to force completeness. Collapsing them into one plan increases the cost of any omission.

**8. For projects without tests, require at least one automated observable in every sub-phase plan.**

- **Justification:** Manual “open the page and look” checks are easy to invent but weak. Lint, type-check, build, or a scripted smoke should be mandatory.
- **Evidence:** InvoiceMe has no real test suite (§6.1). D8 already requires named checks; making one of them automated is a low-cost strengthening.

**9. Document the exact branch-protection / ruleset template so it is one copy-paste action per repo.**

- **Justification:** Layer 1 of D1 enforcement is the real guarantee. Leaving it as tribal knowledge increases the chance it is incomplete or drifts.
- **Evidence:** Plan §6.3 and open questions section both call out owner setup of branch protection as outside the harness but required.

### Nice-to-have / later

**10. Experiment with medium effort on Block B only.**

- **Justification:** Effort affects cost mostly through number of calls/checks, not thinking tokens. Medium may be sufficient once the plan and hooks are strong.
- **Evidence:** §7.1 notes that on 5.5 models a later effort change keeps the cache; #28 thinking was only ~4% of total cost.

**11. Consider a short-lived “Block B may request a one-shot surveyor” escape hatch.**

- **Justification:** If the G1 plan proves incomplete mid-implementation, the current design forces either stop-and-ask or suboptimal code. A constrained, summary-only surveyor call is cheap.
- **Evidence:** Subagents start at 7–12k; surveyor cost in #28 was low.

**12. Track owner wall-clock time in addition to turns.**

- **Justification:** Gate reduction is claimed to help human time and cognitive load, not only tokens. Turns alone do not capture context-switching cost.
- **Evidence:** Original O8 was primarily about owner attention; the plan’s ≤6 turns target is necessary but not sufficient.

---

## 6. Mapping of Original Principles to New Design

| Original Principle (Vision / Working Agreements) | How the Optimization Plan Treats It | Assessment |
|--------------------------------------------------|-------------------------------------|------------|
| Owner decides every project decision | G1 + G2; escalation on unplanned behaviour change | Preserved |
| Independent review before merge | Red-team (Opus) + one fix loop | Mostly preserved; loop count reduced |
| Documentation is part of the change | Inline in Block B + H4 + red-team check | Currency improved; independence reduced |
| Explicit stages, no jumping | 4 blocks with fixed templates and S3 | Compressed but still ordered |
| Simple first | New hooks, scripts, harness.json, work/ dir | Partially sacrificed for production robustness |
| Context written down and loaded | On-demand via surveyor + paths: rules; AI_CONTEXT.md dropped | Correct direction; risk of under-loading |

---

## 7. Recommended Next Actions

1. Implement the plan exactly as written (including all D1–D17 decisions).
2. Run V0 (setup check) and confirm `/context` ≤85k under D6 settings.
3. Execute the pilot (V1–V3) with full §8.3 instrumentation.
4. Publish the measured cost, peak context, owner turns, H2/H4 events, red-team majors, and escapes.
5. Re-decide D6, effort level for B, and any restored intermediate gate *only* on the basis of those numbers.
6. Do not move the plan status to “validated” until the §8.4 targets hold across the pilot *and* quality (majors + escapes) is no worse than the original baseline.

The original’s core values—owner decides, independent review, docs as part of the change, explicit process—are still present, just compressed. Keep them sacred. Everything else is negotiable based on data.

---

*End of critique.*
