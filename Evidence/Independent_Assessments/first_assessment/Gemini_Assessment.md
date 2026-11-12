# Comprehensive Review & Strategic Critique: Production Harness Optimization Plan

**Target Document:** Production Harness: Optimization Plan (2026-10-21)  
**Author:** Matheus Castro  
**Reviewer:** Senior Systems & AI Harness Architect  
**Status:** Strategic Recommendations & Risk Analysis  

---

## Executive Summary

The **Production Harness Optimization Plan** is an exceptionally well-engineered, empirical framework for managing LLM agent costs, session state, and execution quality. By leveraging real telemetry from issue #28 and historical baselines ($9.99 median cost, 291k peak context), the shift from a 12-stage/7-gate model to a **4-block/2-gate model** with rigid session boundaries addresses the primary cost driver: context inflation.

However, a granular evaluation of the plan reveals **four critical friction points** where assumptions about LLM behavior, tool overhead, and hook architecture could compromise the estimated 25% cost savings or lead to agent execution failures.

This report details those failure modes, provides data-backed justifications, and outlines concrete optimization updates prior to executing the V1/V2 pilot phase.

---

## 1. Comprehensive Critique & Failure Mode Analysis

```
+-----------------------------------------------------------------------------------+
|                            IDENTIFIED RISKS & FRICTION                            |
+--------------------------+----------------------------------+---------------------+
| Risk Area                | Primary Mechanism                | Impact Level        |
+--------------------------+----------------------------------+---------------------+
| Context Isolation (D3)   | Cognitive loss across session A→B| High (Rework)       |
| Hook & Script Over-Eng.  | Brittle execution & local loops  | Medium (Maint.)     |
| Sonnet 5.5 Autonomous B  | Drift on edge cases / multi-file | Medium (Cost Spike) |
| Artifact Tool Overhead   | Unnecessary context tax (~12.6k) | High (Token Leak)   |
+--------------------------+----------------------------------+---------------------+
```

### 1.1 Context Clear Risk (D3: Gate A → B Session Boundary)
* **The Mechanism:** Decision D3 mandates clearing context upon plan acceptance (`showClearContextOnPlanAccept`). Block B inherits *only* the written plan (§5.4).
* **The Failure Mode:** Relying exclusively on an abbreviated text template as the sole source of state creates a context void. While Block A's Opus session may have evaluated edge cases, architectural trade-offs, or discarded approaches during its survey phase, Block B's Sonnet instance has **zero memory** of these implicit constraints.
* **Impact:** Sonnet may re-explore discarded implementation approaches or fall into predictable anti-patterns for the codebase, leading to failed sub-phase checks and expensive correction loops.

### 1.2 Tool Overhead & Token Leaks (D6: Keeping Artifacts Enabled)
* **The Mechanism:** Decision D6 keeps the Artifact tool enabled to maintain convenience, taking on its token overhead.
* **Data Context:**
  * Total measured starting context: **~84,000 tokens**.
  * Artifact tool definition alone: **~12,600 tokens** (~15% of initial payload).
  * Over a typical 70-call autonomous Block B sequence, re-reading and writing this unused definition accumulates substantial non-productive context.
* **The Failure Mode:** In a deterministic terminal/script workflow driven by command hooks (`file-check`, `stale-docs`, `check-gate`), the agent almost never utilizes the Artifact UI workspace. Maintaining a 12.6k token tax across every turn directly contradicts Principle P1 (*"Small at start"*).

### 1.3 Subagent Autonomous Drift in Block B (D12: Sonnet Builder)
* **The Mechanism:** Block B delegates execution to Sonnet 5.5 under `opusplan` to halve per-token costs ($2/$10 vs $4/$20 MTok).
* **The Failure Mode:** While Sonnet 5.5 excels at bounded, localized tasks, multi-file refactoring across 70+ autonomous calls can lead to context drift. If Sonnet encounters an unexpected build or lint error, it risks spending multiple turns making trial-and-error adjustments.
* **Cost Vulnerability:** If Sonnet takes 30–40% more turns or triggers repeated H2 `check-gate` retries, the cumulative token count negates the price differential between Sonnet and Opus.

### 1.4 Hook Cascades & Local Execution Lockup (D10, D11)
* **The Mechanism:** Node.js hooks (`H1`–`H5`) execute synchronously on `PreToolUse`, `PostToolUse`, and `Stop` events.
* **The Failure Mode:** Unhandled exceptions, cross-platform path delimiter issues (Windows vs. Unix), or subtle CLI stdout schema updates from Claude Code updates can cause hook failures. If `H2` (`check-gate`) or `H4` (`stale-docs`) returns ambiguous stderr, the model may consume turns attempting to "fix" the hook itself rather than the code.

---

## 2. Evidence-Based Optimization Recommendations

```
  +---------------------------------------------------------------------------------+
  |                            RECOMMENDED ADJUSTMENTS                              |
  +---------------------------------------------------------------------------------+
  |  1. Disable Artifact Tool (D6 Update)   -->  Saves ~12.6k tokens/call             |
  |  2. Hardened Plan Blueprint (§5.4)       -->  Injects explicit Non-Goals/Limits   |
  |  3. Hook Failure Circuit Breaker        -->  Prevents infinite retry turns        |
  |  4. Dynamic Model Escalation Rule       -->  Fallback to Opus after N check hits  |
  +---------------------------------------------------------------------------------+
```

### Recommendation 1: Disable the Artifact Tool in Project Settings (Update D6)
* **Justification:** §5.1 identifies tool definitions at **45.5k tokens**, with Artifacts consuming **12.6k tokens**.
* **Math:**
  $$\text{Savings per Call} = 12,600 \text{ tokens}$$
  $$\text{Savings across Block B (70 calls)} \approx 70 \times 12,600 \times \$0.10 / 1\text{M (Cache Read)} = \$0.088 \text{ / run directly}$$
  $$\text{Cache Write Savings} = 12,600 \times \$2.00 / 1\text{M} = \$0.025 \text{ per miss}$$
* **Action:** Update `.claude/settings.json`:
  ```json
  {
    "enableArtifact": false
  }
  ```
  *Expected Startup Context Drop:* **80k → 67k tokens**.

### Recommendation 2: Augment the Plan Template (§5.4) with "Explicit Non-Goals & Architectural Boundaries"
* **Justification:** To mitigate context loss across the A→B session clear (D3), the plan template must convey negative constraints and discarded paths.
* **Action:** Amend §5.4 with two mandatory sections:
  ```markdown
  ## Non-Goals & Rejected Approaches
  - DO NOT: <Explicitly list approaches considered and rejected during Block A>
  
  ## Critical Architectural Constraints
  - <Key invariants or patterns that must be preserved>
  ```

### Recommendation 3: Implement an Explicit Circuit Breaker on Hook H2 (`check-gate`)
* **Justification:** H2 currently allows 3 consecutive failures before letting Claude stop. If the agent receives generic failure messages, it degrades into blind retry behavior.
* **Action:** Require H2 output to provide structured context when blocking or stopping:
  ```text
  [Harness Gate Block]: Fast checks failed (Attempt 2/3).
  Failed Component: NODEAPI lint
  Error Detail: Line 42: 'res' is defined but never used.
  Action Required: Resolve the specific lint error before making additional file edits.
  ```

### Recommendation 4: Establish a Clear Model Escalation Rule for Block B
* **Justification:** Validates D12 during V2 pilot runs. If Sonnet struggles with a complex issue, continuing to run it yields diminishing returns.
* **Rule:** If Block B hits **2 consecutive H2 gate stops** (6 failed check attempts overall), the session should stop, output a state checkpoint, and advise the owner to resume Block B using `--model opus`.

---

## 3. Revised Budget & Metric Tracking Matrix

Incorporating the disabled Artifact tool and hardened plan boundaries adjusts the target contextual metrics as follows:

| Context Phase | Original Plan Estimate | Revised Target (Artifacts Off) | Variance / Savings |
|---|---|---|---|
| **Global Overhead** | ~80,000 tokens | **~67,400 tokens** | $-12,600$ tokens |
| **Project Layer** | ≤ 3,000 tokens | **≤ 3,000 tokens** | Neutral |
| **Start of Block B** | ~88,000 tokens | **~75,000 tokens** | $-13,000$ tokens |
| **Start of Block C** | ~87,000 tokens | **~74,000 tokens** | $-13,000$ tokens |
| **Projected Cost/Issue** | $7.20 – $7.70 | **$6.40 – $6.90** | **~31% reduction vs $9.99 baseline** |

---

## 4. Immediate Next Steps for Pilot Phase (V0 & V1)

1. **Apply Configuration Update (V0):**
   * Add `"enableArtifact": false` to `.claude/settings.json`.
   * Confirm startup context drop via `/context` (Target: $\le 70\text{k}$).
2. **Deploy Hook Diagnostics Verification (V0):**
   * Run error injection tests for `H1`–`H4` to ensure node scripts format error output cleanly without causing unhandled exceptions.
3. **Proceed to V1 Pilot:**
   * Execute 3 BabyBuddyHelper issues adhering to the updated plan template and model escalation thresholds.