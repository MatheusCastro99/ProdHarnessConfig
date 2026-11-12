# ProdHarnessConfig Assessment: Evolution, Gaps, and Direction

**Date:** 2026-11-11  
**Scope:** Comparison of the current repository (D26, under validation) against the original Optimization Plan (D1–D17, 2026-10-21) and the intermediate measured state (D24/D25).  
**Sources:**  
- Current README and Evidence/OPTIMIZATION_PLAN.md  
- Evidence/research/13-d25-meta-analysis.md (49 priced runs)  
- Evidence/research/11-meta-analysis.md and earlier pilot notes  
- Original critique of the 2026-10-21 plan  

This assessment is written in the same spirit as the earlier critique: evidence first, explicit about sample limits, and focused on what the numbers and design actually show.

---

## 1. Executive Judgment

The project moved from a well-motivated but unvalidated design hypothesis (Oct 21) to a working production harness with a visible research trail, real cost and context reductions, and honest accounting of its own limitations.

The core architecture—session boundaries at gates, forked Sonnet builder, independent Opus red-team, hooks for deterministic enforcement, and handoff files—survived contact with measurement and improved. Several soft spots identified in the first critique were closed or mitigated. New bottlenecks appeared (as expected) and are already being addressed in D26.

The system is now useful for real work by its owner. It is not yet a settled, general-purpose solution. Sample size remains small, issue sizes and projects are not matched, and a few quality and process gaps are still open. That is a healthy state for a single-owner harness at this stage of iteration.

---

## 2. Comparison with Earlier Versions

### 2.1 Original Plan (D1–D17, 2026-10-21)

**What it proposed**
- 4 blocks / 2 gates
- Estimated $7.2–7.7 per issue (~25% below the $9.99 baseline)
- Opus for scope and review; Sonnet for build
- Drop AI_CONTEXT.md and the independent historian
- Inline docs + H4 commit gate
- Context budgets (≤80k global, ≤3k CLAUDE.md, ≤200k peak)
- Status: decisions made, not validated

**What the first critique flagged**
- Cost target optimistic; residual dominated by global overhead
- Gate reduction risked weaker quality guarantees
- Historian removal traded currency for independence
- Complexity and Claude Code surface area would rise
- Block B autonomy assumed a complete G1 plan
- InvoiceMe / no-tests path under-specified
- Need for mandatory Sonnet-vs-Opus comparison and real instrumentation

### 2.2 What Actually Happened (D19 → D25 → D26)

| Dimension | Original estimate / claim | Measured (D24 / D25) | Assessment |
|-----------|---------------------------|----------------------|------------|
| Median cost (Standard) | $7.2–7.7 target | D24 $6.03 (5 issues); D25 $8.32 (10 issues, larger diffs) | Directionally correct; absolute number moves with issue size and G1 co-writing |
| Peak main-session context | ≤200k target | 125k (D24) → 145k (D25) vs 291k baseline | Clear win |
| Owner turns | ≤6 target | 7 (D24) → 9 (D25) vs 11 baseline | Partial win; G1 rounds and mid-run owner changes drive the rest |
| Builder cost (Sonnet, forked) | ~half of Opus arithmetic | ~$1.02–1.11, flat even on 3× larger diffs | Strongest single technical result |
| Quality | No higher majors; zero escapes | No blocking findings at merge; first escapes were 5 doc-drift lines caught by Epic audit | Acceptable so far; failure mode shifted to cross-issue drift |
| Safety | Hooks + branch protection | SHA binding, `/close` safety, plan/handoff posted to issue, explicit BLOCKED state | Materially stronger than the first plan |
| Small tier | Not in original | Added (D18); code median ~$3.99 under D25 | Correct response to fixed overhead |

**Key design evolutions that improved the original**
- Forked Sonnet builder (the single highest-impact change)
- SHA binding on the handoff (review refuses if head moved)
- Plan and handoff posted to the issue (durable across machines/days)
- Small tier for one-sub-phase work
- Explicit BLOCKED state after three consecutive check failures
- Safety hardening absorbed from independent assessments (research/03)
- D26 move of G2 fixes out of the Opus review session and back to the forked builder

**What the original critique got right**
- Absolute cost would be sensitive to issue size and residual global overhead
- Review would become the expensive block once Build moved to Sonnet
- Gate reduction would shift, not eliminate, quality risk
- Complexity and platform coupling would rise
- Measurement had to be the real design phase

**What the original critique overstated or understated**
- Quality held better than the more pessimistic scenarios
- The owner’s discipline at G1 and G2, plus the red-team, compensated for the collapsed intermediate gates more effectively than expected on the measured runs
- The research discipline (priced runs, meta-analyses, explicit caveats) exceeded what the first plan required of itself

### 2.3 Summary of the Arc

The project did the rare thing: it treated its own plan as a hypothesis, instrumented it, published the numbers (including the ones that missed), and iterated. D24 looked like a clean win; D25 revealed the new bottleneck (Opus review doing fix work at high context) and the sensitivity to issue size/co-writing; D26 is the corrective step. That loop is the real product.

---

## 3. Gaps in the Current Version

### 3.1 Measurement and Generalizability

- **Sample size and confounding remain real.** 49 runs is better than a 3-issue pilot, but still one owner, three repositories of different maturity, and unmatched issue sizes. D25 Standard median ($8.32) is higher than D24 ($6.03) largely because the work was larger and more content was co-written at G1. Direction is clear; effect size is not yet solid.
- **List-price vs subscription.** All reported costs are list-price equivalents. The owner is on a subscription. The relative ranking of designs is still informative; absolute dollars are not transferable without that caveat.
- **D26 is still under validation.** The README correctly states this. Claims about the current shipped version should remain provisional until the next meta-analysis closes.

### 3.2 Cost Shape

- **Review is the new expensive block.** In D25 Standard, review was ~38% of cost. G2 fixes performed inside the Opus review session at 120–200k context were the main regression. D26’s move of those fixes to the forked builder is the right response; it must be confirmed by data.
- **G1 still expands under real use.** Multi-round planning and content co-writing inside `/scope` push both cost and context back up. The design assumes a relatively clean plan; reality is messier.
- **Global overhead is still the floor.** Artifact tool + connectors remain on (D6). The plan itself identifies turning them off as the next lever if further reduction is needed. Nothing fundamental has changed here.

### 3.3 Quality

- **Cross-issue / Epic-level doc drift** is the current failure mode. Per-issue red-team + H4 catch local staleness. They do not catch “this ADR or spec no longer matches the code three issues later.” The first recorded escapes were five such lines, caught by an Epic knowledge audit, not by a user and not by the per-issue review.
- **Red-team is still the primary doc checker.** Most G2 fixes remain documentation-related. That is useful, but it means the automated stale-docs path is not yet carrying the full load.
- **Owner live check still finds things review cannot.** One root cause only reproduced on the owner’s device. Independent review is necessary but not sufficient.

### 3.4 Process and Complexity

- **Process defects still appear in runs.** Examples from the D25 meta-analysis: `set_monitor` denied (Auto-fix left on), G2 fixes built in the review session, owner content drafted inside `/scope`, Epic close order living only in project memory, handoff CI line trusting only jobs that ran. Several of these have clear mitigations; not all are closed.
- **Surface area is large.** Hooks, scripts, harness.json, installer, tests, SHA binding, tiers, frontmatter, permission rules, and Claude Code-specific behaviors. For a single owner who lives in the system this is manageable. For anyone else the onboarding and maintenance cost is non-trivial.
- **Platform coupling.** The Claude Code surface (hooks, `opusplan`, clear-on-accept, Auto-fix, permission classifier, etc.) is larger than the Platform_Neutral layer can fully abstract. Portability is limited by design.

### 3.5 Open Design Questions

- How often does the tier check correctly raise or lower the tier under real G1 expansion?
- Is the Epic knowledge audit a permanent second net, or can stronger cross-issue invariants be encoded?
- Should content drafting before planning become an explicit step, or remain an anti-pattern that the owner simply avoids?
- When (if ever) is medium effort on Block B justified?

---

## 4. Recommended Direction

The project should stay on the path it is already on: measure → identify the new bottleneck → change one thing → re-measure. The following priorities are ordered by expected impact and risk.

### Priority 1 — Close the D25 regression and confirm D26

- Finish validation of D26 (G2 fixes routed to the forked builder).
- Publish the next meta-analysis with the same honesty as research/13.
- Treat any claim of “the harness is now X% cheaper” as provisional until that analysis lands.

### Priority 2 — Attack the current cost shape without weakening gates

- Confirm whether turning off Artifact + connectors (or making them opt-in per project) still saves ~$0.70 per issue under the current session structure. If yes, make it a configurable D6 revision.
- Keep G1 discipline high: discourage large content co-writing inside `/scope` or add an explicit pre-plan drafting step if the owner wants that workflow.
- Watch peak context on the builder when the UI check runs; the D25 data already showed builders crossing 200k on those runs.

### Priority 3 — Strengthen the quality net that the current design is weakest on

- Keep running Epic-level knowledge audits. They caught the only recorded escapes.
- Consider a lightweight standing rule or periodic job that checks ADR/spec claims against the current code for paths that the per-issue stale-docs script cannot see.
- Do not restore a full independent historian; the currency win of inline docs is real. Add a second net instead of undoing the first.

### Priority 4 — Reduce process friction that the meta-analyses already named

- Close the concrete defects listed in research/13 §8 (permission allow-list for monitor, explicit fork for G2 fixes, clearer Epic close order, more robust CI status in the handoff).
- Make the tier check and the “raise tier when G1 adds work” path more visible and tested.
- Keep the research scripts and the Evidence folder as first-class artifacts; they are part of the product.

### Priority 5 — Resist premature generalization

- Do not market this as a general framework. The current framing (“one owner’s working setup, documented so you can adapt it”) is accurate and protective.
- Platform_Neutral is useful for ideas; it will not fully erase Claude Code coupling. Accept that limit.
- Prefer more priced runs on the existing projects over new surface area until D26 and the next meta-analysis are closed.

### What not to do

- Do not collapse the two remaining gates further. The owner decision points are load-bearing.
- Do not re-introduce a long-lived main session in the name of “convenience.” The session-boundary rule is the highest-leverage design choice in the system.
- Do not treat the current medians as stable effect sizes. They are directional evidence under specific conditions.

---

## 5. Closing Assessment

**Relative to the 2026-10-21 plan:** the project is substantially better. The architecture was stress-tested, safety was hardened, the biggest technical bet (forked Sonnet builder) paid off, and the measurement culture is now the strongest part of the system.

**Relative to a production bar for a single owner:** it is already usable and is improving under its own feedback loop. Cost and context are better than the old long-session baseline; quality has held on the measured runs with a shifted (and visible) failure mode.

**Relative to a general, low-maintenance solution for other developers:** it is not there yet, and the current framing correctly does not claim that it is.

The right next step is not a large redesign. It is to finish the D26 validation, publish the numbers, close the named process defects, and keep the Epic-level quality net. The system has earned the right to be iterated on the basis of its own data rather than on further theoretical compression of the original 12-stage workflow.

That is the direction that matches both the evidence and the project’s own best habits.

---

*End of assessment.*
