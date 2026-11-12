# Strategic Assessment: `ProdHarnessConfig` vs. Earlier Iterations, Current Gaps & Future Direction

**Subject Repository:** `MatheusCastro99/ProdHarnessConfig`  
**Baseline Comparison:** `MatheusCastro99/HarnessConfigAndWorkflow` & Early Blueprints  
**Date:** November 11, 2026  

---

## Executive Summary

The evolution from the educational `HarnessConfigAndWorkflow` (12 stages, 7 approval gates, monolithic context) to `ProdHarnessConfig` (4 blocks, 2 gates, strict session boundaries) marks a transition from **prompt-driven orchestration** to **deterministic systems engineering**. 

`ProdHarnessConfig` successfully eliminates the primary cost and latency bottlenecks of the earlier versions—namely unbounded context accumulation (~320k peak tokens) and expensive cold session resumes. However, shifting from human-gated checkpoints to autonomous, script-enforced loops introduces new structural vulnerabilities around **context amnesia across session wipes, local hook fragility, and observability blind spots**.

This document outlines the architectural progression, diagnoses the remaining gaps in `ProdHarnessConfig`, and provides a prioritized strategic roadmap for the project's next phase.

---

## 1. Architectural Evolution: Study Repo vs. Early Blueprint vs. `ProdHarnessConfig`

```
+---------------------------------------------------------------------------------------------------+
|                                  HARNESS EVOLUTION MATRIX                                         |
+-----------------------+---------------------------+-----------------------+-----------------------+
| Architectural Layer   | Study Repo (v1)           | Early Blueprint (v2)  | ProdHarnessConfig(v3) |
+-----------------------+---------------------------+-----------------------+-----------------------+
| Workflow Topology     | 12 sequential stages      | Compressed 4 blocks   | 4 blocks, 2 strict    |
|                       | 7 manual gates            | Implicit transitions  | session-clear gates   |
+-----------------------+---------------------------+-----------------------+-----------------------+
| Context Management    | Monolithic session        | Attempted per-file    | Hard context wipes at |
|                       | (84k → 320k tokens)       | cache pinning (flawed)| G1 & G2; file handoffs|
+-----------------------+---------------------------+-----------------------+-----------------------+
| Guardrail Enforcement | Prose instructions in     | Hybrid prose + basic  | Node.js hooks (H1-H5) |
|                       | CLAUDE.md (~20k overhead) | shell scripts         | blocking on exit 2    |
+-----------------------+---------------------------+-----------------------+-----------------------+
| Model Allocation      | Opus everywhere           | Unspecified split     | opusplan (Opus A/C,   |
|                       |                           |                       | Sonnet 5.5 B, high)   |
+-----------------------+---------------------------+-----------------------+-----------------------+
| Doc Synchronization   | Separate Historian pass   | Parallel Historian    | Inline updates gated  |
|                       | post-review               | (race condition risk) | by H4 stale-docs      |
+-----------------------+---------------------------+-----------------------+-----------------------+
```

### Key Gains Realized in `ProdHarnessConfig`
1. **Elimination of the "Cold Resume Tax":** By treating Gates G1 and G2 as hard session boundaries (`showClearContextOnPlanAccept` and fresh Block C initialization), the harness eliminates the most expensive operation observed in the baseline runs (resuming a 250k+ token cache after a human pause).
2. **Correction of Cache Pinning Assumptions:** The early blueprint assumed Claude Code supported per-file cache pinning via `AI_CONTEXT.md`. `ProdHarnessConfig` correctly aligns with Anthropic's prefix-matching cache architecture by keeping the root `CLAUDE.md` under 3k tokens and lazy-loading area rules via `paths:`.
3. **Inline Documentation Integrity:** Dropping the parallel Historian subagent in favor of commit-blocking hook enforcement (`H4: stale-docs`) guarantees that documentation never drifts from code changes during autonomous build loops.

---

## 2. Critical Gaps in the Current `ProdHarnessConfig`

While `ProdHarnessConfig` solves the macro-economics of token usage, deploying it across real repositories exposes **five structural gaps**:

### Gap 1: Loss of "Negative Knowledge" Across the G1 Context Wipe
* **The Vulnerability:** When G1 clears context and passes *only* `.claude/work/<issue>/plan.md` to Block B, Sonnet 5.5 loses all conversational context from Block A's `surveyor` exploration.
* **Why It Matters:** A plan naturally describes *what to build*, rarely *what was investigated and ruled out*. Without explicit negative constraints, Block B's autonomous builder frequently wastes turns re-exploring dead ends or violating implicit architectural invariants that Opus noticed during scoping.

### Gap 2: Hook Maintenance & Cross-Platform Brittleness
* **The Vulnerability:** The harness relies on five custom Node.js hooks (`file-check`, `check-gate`, `quiet`, `stale-docs`, `session-state`) tightly coupled to Claude Code's CLI JSON schemas, `updatedInput` rewriting, and stderr exit codes.
* **Why It Matters:** Claude Code's hook lifecycle and output filtering APIs evolve rapidly. A subtle change in how Windows handles stdout buffering or how Claude Code parses `PreToolUse` rewrites can silently break `H3` (`quiet`) or lock `H2` (`check-gate`) into false-positive blocks. Currently, there is no automated self-test suite for the harness scripts themselves.

### Gap 3: Static Effort & Model Allocation During Block B Anomalies
* **The Vulnerability:** Decision D12 locks Block B to Sonnet 5.5 (`opusplan`) with a 3-strike `check-gate` limit (H2).
* **Why It Matters:** Not all sub-phases are equal. If Sub-phase 1 is boilerplate wiring and Sub-phase 3 is a complex state-machine refactor, Sonnet 5.5 may breeze through 1 and 2, then burn 30+ calls thrashing on Sub-phase 3. Currently, the harness has no graceful mid-block escalation mechanism to hand off a stuck sub-phase to Opus without manual intervention.

### Gap 4: Observability & Telemetry Friction
* **The Vulnerability:** Metrics collection (§8.3) relies on post-hoc parsing of session transcripts (`cost.js`, `sessions-survey.js`) and flat text appends to `.claude/work/hooks.log`.
* **Why It Matters:** If a pilot run misses its cost or peak-context target (< 200k tokens), diagnosing *which specific tool call or file read* blew up the context window requires manual transcript archaeology. There is no real-time context-budget warning inside the harness loop.

### Gap 5: False-Positive Noise in `stale-docs` (`S1`)
* **The Vulnerability:** Matching changed files to documentation via basename and directory string scanning (`S1` rules 3 & 4) is prone to false positives in larger repositories, forcing the agent to spend turns adding `ack: <doc> — <why>` lines to satisfy the `H4` commit gate.
* **Why It Matters:** Every forced `ack:` cycle costs an extra LLM round-trip and pollutes the handoff file with low-signal noise for G2 review.

---

## 3. Recommended Direction: Roadmap for `ProdHarnessConfig` v2

To mature `ProdHarnessConfig` from a high-performing personal setup into a resilient, zero-maintenance engineering standard, the project should focus on **four strategic pillars**:

```
  PHASE 1: HARDEN          PHASE 2: OBSERVE         PHASE 3: ADAPT           PHASE 4: DISTRIBUTE
  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
  │ Harness Unit │         │ Real-Time    │         │ Smart Model  │         │ Multi-Repo   │
  │ Test Suite & │ ──────► │ Context &    │ ──────► │ Escalation & │ ──────► │ CLI / Template│
  │ Plan Guards  │         │ Cost Alerts  │         │ AST Doc-Map  │         │ Scaffolding  │
  └──────────────┘         └──────────────┘         └──────────────┘         └──────────────┘
```

### Pillar 1: Build a Self-Testing Harness Suite (Immediate Priority)
* **Direction:** Treat `.claude/hooks/` and `.claude/scripts/` as production software with their own `package.json` and zero-dependency Node test runner (`node --test`).
* **Implementation:** Create mock JSON payloads for `PreToolUse`, `PostToolUse`, `Stop`, and `SessionStart` events. Run these tests automatically whenever any file inside `.claude/` is modified. This eliminates the risk of silent hook regressions across Windows/macOS/Linux.

### Pillar 2: Upgrade Plan & Handoff Schemas with "Guardrail Contracts"
* **Direction:** Evolve the Block A plan template (§5.4) from a task list into a strict behavioral contract for Block B.
* **Implementation:**
  * Require an **"Explicit Non-Goals / Rejected Paths"** block so Sonnet knows what *not* to touch.
  * Require an **"Invariants"** section (e.g., *"Must not add new npm dependencies"*, *"Preserve existing API response shape"*).
  * Enforce these sections deterministically inside `S3` (`handoff-check`).

### Pillar 3: Introduce Real-Time Context Budget Telemetry
* **Direction:** Shift from post-mortem cost analysis (`cost.js`) to active context governance during Block B.
* **Implementation:** Enhance `H5` (`session-state`) or a lightweight `PostToolUse` hook to track cumulative token growth or large tool outputs. If a single tool response injects > 15k characters into the main session (violating Principle P2), emit a warning to Claude to delegate subsequent reads to the `surveyor` subagent.

### Pillar 4: Package as an Installable Scaffolding CLI
* **Direction:** Once V1–V3 pilots validate the metrics on *BabyBuddyHelper* and *InvoiceMe*, extract the generic harness engine from repo-specific configurations.
* **Implementation:**
  * Separate **Core Harness** (`.claude/hooks/`, `.claude/scripts/`, `.claude/skills/`, `.claude/agents/`) from **Repo Config** (`harness.json`, `CLAUDE.md`, `.claude/rules/`).
  * Build a simple `npx init-harness` script that detects stack type (.NET, Node, Python), generates a tailored `harness.json`, and configures GitHub branch protection rules via `gh api` automatically.

---

## Summary Verdict

`ProdHarnessConfig` represents the top 1% of practical AI agent orchestration. By grounding every architectural decision in empirical token telemetry and replacing fragile prompt rules with deterministic Node.js hooks, you have built a system that is both **cheaper** and **safer** than standard agentic workflows.

**Next Immediate Move:** Freeze feature additions to the workflow topology, execute the V1/V2 pilots to gather empirical data on Sonnet 5.5's Block B reliability, and invest in **Pillar 1 (automated tests for your `.claude/` scripts)** so the harness itself never becomes a maintenance bottleneck.