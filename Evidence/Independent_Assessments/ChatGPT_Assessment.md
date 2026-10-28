# Production Harness Optimization Plan — Findings, Evidence, and Recommendations

**Review date:** 2026-10-21  
**Reviewed material:**
- The uploaded `OPTIMIZATION_PLAN.md` (640 lines; decision log D1–D17 marked decided, validation pending).
- Public repository: [MatheusCastro99/HarnessConfigAndWorkflow](https://github.com/MatheusCastro99/HarnessConfigAndWorkflow), especially its README and stated workflow principles.
- Current public Claude Code documentation and Git/GitHub documentation linked inline below.

## Executive verdict

The optimization plan is directionally strong and worth implementing, but **it is not yet ready to be treated as production-validated**. Its best ideas are smaller context boundaries, on-demand instructions, deterministic checks, independent review, and measurement by cost and quality. The main gaps are around destructive cleanup, review/CI synchronization, the assumption that plan acceptance really clears context, and what the workflow means when checks or findings remain unresolved.

The most consequential recommendations are:

1. Make branch cleanup provably safe before allowing `git branch -D`.
2. Bind review approval and CI status to the exact pull-request head commit.
3. Verify plan-accept context clearing on the exact supported Claude Code runtime; use a genuinely fresh session if it cannot be demonstrated.
4. Turn failed checks and unresolved blocking findings into an explicit **blocked** state, not a successful handoff.
5. Require server-side branch rules that include passing required CI checks, not just a pull request and disabled force pushes.
6. Fix the cost/context arithmetic and separate experimental replay cost from the production pilot measurement.

This review is based on the plan’s stated evidence and the public README/documentation. The plan references local research records and a cost script that were not independently audited here. Accordingly, historical token/cost values below are **reported by the plan**, not independently reconstructed from raw session records. The proposed hooks/scripts are described in the plan but were not executable implementation artifacts in the reviewed material; their runtime behavior still needs testing.

---

## 1. Evidence baseline and what the numbers actually establish

The plan contains enough quantitative detail to justify an optimization experiment. It does not yet prove the forecast.

### Reported historical data

| Measure | Value reported in `OPTIMIZATION_PLAN.md` | Source location in plan | Interpretation |
|---|---:|---|---|
| BabyBuddyHelper code issues in historical baseline | 10 issues | §8.1, lines 524–532 | Useful initial sample, but small and issue-mix dependent. |
| Median BabyBuddyHelper cost per issue | **$9.99** | §8.1, lines 528–532 | Baseline used for the 25% target. Stated at list price. |
| Historical cost range | $3.08–$20.21 | §8.1, lines 528–532 | Large variance; comparisons need reasonably comparable issues. |
| Median peak context | **291k tokens** | §8.1, lines 528–533 | Supports the hypothesis that context growth is an important cost driver. |
| Owner turns | 6–32 per issue | §8.1, lines 528–533 | Supports reducing interaction overhead, although turns and token cost are separate problems. |
| Study-repository docs issues | 5; median $10.01 | §8.1, lines 528–532 | Similar price, but only five observations and a different task class. |
| Validation run #28 cost | $14.68 | §2, lines 57–71 | One detailed run; useful for diagnosis, not enough by itself to estimate typical cost. |
| Main session context in #28 | 84k → 320k; mean 218k | §2, lines 65–71 | Strong evidence of context growth in that run. |
| Main-session calls | 142 | §7.1, lines 460–469 | High number of calls creates repeated input/cache charges. |
| Day-2 close share of run cost | 39% | §2, lines 65–71 | Supports reconsidering expensive cold resumes and close-session behavior. |
| First-call starting context in #28 | 84,097 tokens | §5.1, lines 207–243 | About 72k was estimated to be global setup/tooling, not project documentation. |
| Approximate cost split | 46% cache reads; 37% cache writes; 18% output | §2, lines 57–64 | These rounded shares add to 101%; treat them as approximate, not exact accounting. |

**Evidence caveat:** These numbers are internally reported in the plan, with research links named there (`research/01-caching-and-context.md`, `research/02-baseline.md`, and `research/scripts/cost.js`). The raw records and script were not supplied as independently auditable artifacts in the review bundle. Before calling the baseline validated, retain the raw session export, estimator version, pricing assumptions, and calculated totals together.

### The cost target is slightly tighter than the forecast supports

The plan’s target is a median cost at least 25% below $9.99 (§8.4, lines 571–576):

`$9.99 × (1 − 0.25) = $7.4925`, or about **$7.49 per issue**.

The projected range is **$7.20–$7.70** (§8.2, lines 535–553). The low end meets the target; the high end does not. Therefore, the projection supports “a reduction is plausible,” not “the 25% target follows from the estimate.” Treat $7.49 as the actual acceptance threshold and $7.20–$7.70 as an uncertainty range.

### The starting-context budget is internally inconsistent

The plan estimates Block B startup as about 88k tokens (§5.2, lines 249–257), while §8.4 requires startup context of no more than 85k (§8.4, lines 571–576). The components listed in §5.2 sum to:

`80k global + 3k project + 2.5k skill + 3k plan = 88.5k tokens`.

That is already 3.5k over the stated limit before runtime variability. Fix the budget or reduce the components based on measured `/context` output; do not leave contradictory pass/fail criteria in the validation plan.

### The current validation sample is a pilot, not reliability proof

Three BabyBuddyHelper issues and one or two InvoiceMe issues (§8.5, lines 587–597) are sensible for discovering implementation defects. They are not enough to establish a low bug-escape rate. Even under a simplified independent-trial model, zero escapes in three trials leaves a very wide uncertainty range (the one-sided 95% upper bound on an escape probability is about 63%). The assumption that issues are independent and comparable is itself unlikely to hold perfectly.

Call this **preliminary validation**. Broader confidence should come from more representative issues, seeded failure tests, and ongoing post-merge tracking—not simply zero observed escapes in the first three changes.

---

## 2. Findings and recommendations, ranked by priority

Priority definitions:
- **P0 — resolve before autonomous pilot:** possible loss of work, false approval, or a gap in a core safety guarantee.
- **P1 — resolve before calling the harness production-ready:** correctness, observability, recoverability, or validation weaknesses likely to invalidate claims.
- **P2 — optimize after the safety baseline is working:** efficiency and maintainability improvements.

### P0-1. `/close` can force-delete a branch without proving every local commit was merged

**Evidence in the plan:** §6.4, lines 418–427. The script first checks that GitHub reports the PR as `MERGED`, then runs `git branch -d <branch>` and falls back to `git branch -D` if `-d` refuses, on the stated rationale that squash merges can make the local branch commits differ from the target branch.

**External evidence:** Git’s own [`git branch` documentation](https://git-scm.com/docs/git-branch) says `-d` requires the branch to be fully merged, while `-D` is force deletion irrespective of merged status. A PR’s merged state describes that PR; it does not prove that the checked-out local branch has no extra, unpushed commits beyond the PR head.

**Why it matters:** This is a real data-loss failure mode. For example, a developer or agent can add a local commit after the PR’s last push. The PR remains merged later, but deleting the local branch with `-D` can remove that extra work’s only named reference.

**Recommendation:** Do not force-delete based only on PR state. Before deleting, compare the local branch tip to the recorded PR head SHA and confirm there are no commits or working-tree changes that exist only locally. If exact equivalence or safe ancestry cannot be proved, abort and preserve the branch. Prefer an explicit cleanup confirmation when branch state is ambiguous.

**Acceptance criteria:**
- Test a normal merge, squash merge, and rebase merge.
- Test a merged PR with an additional local-only commit; cleanup must abort and preserve the branch.
- Test staged, unstaged, and untracked local changes; cleanup must preserve them and report why it stopped.
- The cleanup report records the PR state, PR head SHA, local HEAD SHA, and deletion decision.

### P0-2. Review and CI are not tied to an immutable PR head

**Evidence in the plan:** §4 Block B, lines 157–162, says CI/review comments are watched by Auto-fix and a handoff file is then written. Block C starts from the handoff and the current PR diff (§4 Block C, lines 164–177). The proposed structure lists no concrete Auto-fix component or synchronization contract (§6.5, lines 439–450).

**Why it matters:** Auto-fix may push another commit after the handoff is written or while Block C is reviewing. The reviewer could then approve one diff while the PR contains another. Similarly, a “CI passed” statement can be stale if it refers to an earlier SHA. This is a time-of-check/time-of-use problem, not just a reporting inconvenience.

**Recommendation:** Record the exact PR head SHA in the handoff. Block C must verify that the current PR head still matches that SHA and that required CI checks succeeded for that head before it reviews. If Auto-fix pushes a commit, invalidate the prior review/handoff and require a review of the updated head. Before merge, verify the reviewed SHA, current PR head SHA, and CI-tested SHA agree.

**Acceptance criteria:**
- Handoff schema requires `prHeadSha` and `ciHeadSha`.
- `review` refuses to start if the PR head differs from the handoff SHA.
- A simulated Auto-fix push during review invalidates the review state.
- The merge-ready report explicitly states the reviewed SHA and CI status for that SHA.

### P0-3. Context clearing at plan acceptance is a critical dependency and must be verified on the actual runtime

**Evidence in the plan:** §4 Block A, lines 138–145, relies on approving the plan with “clear context,” then says Block B inherits the plan alone. D3 (§9, lines 617–618) makes the session boundary a major cost assumption.

**External evidence:** Claude Code’s current [settings documentation](https://code.claude.com/docs/en/settings) directs users to the all-settings reference for individual settings. The specific `showClearContextOnPlanAccept` property is not described on the settings page reviewed. More importantly, [Claude Code issue #48951](https://github.com/anthropics/claude-code/issues/48951) reported that the “clear context” option did not actually clear the context on Claude Code v2.1.110 on Linux. That old report does **not** prove a current version is broken; it does show that this important transition has failed in at least one documented version/platform combination. Other reports have described limitations when plan approval is routed through hooks ([issue #71061](https://github.com/anthropics/claude-code/issues/71061)).

**Why it matters:** If context does not actually clear, Block B’s token forecast and “plan-only inherited context” claim are false. Worse, implementation may continue with exploration details and stale assumptions the design intends to discard.

**Recommendation:** Make this a tested runtime invariant, not an assumption. On the exact Claude Code version, surface, provider and plan-approval path to be used, accept a plan and verify `/context` plus the subsequent session state. If the test is not reliable, explicitly start a fresh session and pass only the approved plan as the handoff. Use `/context` measurements in the pilot to confirm the result.

**Acceptance criteria:**
- V0 records the exact Claude Code version, interface (CLI/desktop), provider and effective model.
- A seeded plan large enough to distinguish old context from the plan is accepted.
- Block B’s first context measurement confirms the old exploration conversation is absent or otherwise documents exactly what remains.
- The harness has a documented fallback that does not depend on the plan-accept UI behavior.

### P0-4. “Stop after three failed checks” needs an explicit blocked state

**Evidence in the plan:** §6.2 H2, lines 377–380, blocks stopping when fast checks fail, but allows the model to stop after three consecutive failures and report the failure. §4 Block C, lines 176–178, limits the fix/re-review loop to one re-review and moves remaining items to follow-up unless another round is requested.

**Why it matters:** These limits are reasonable against runaway loops, but they do not mean the work has passed. If the workflow’s exit or handoff semantics are unclear, a failure report can be confused with completion. Similarly, a critical finding cannot safely disappear into a follow-up issue merely because one more iteration is expensive.

**Recommendation:** Define machine-readable states, at minimum `PASSED`, `BLOCKED`, `NEEDS_OWNER`, and `READY_FOR_REVIEW`. The three-failure cap must transition to `BLOCKED`, with failing command, exit code, bounded diagnostic output and the attempted fixes. Block C must distinguish blocking from nonblocking findings. Security, data integrity, correctness, and release-blocking failures remain unresolved until fixed or explicitly accepted by the owner under a documented exception policy.

**Acceptance criteria:**
- Handoff schema includes a status and a structured list of check results.
- A failed fast check after the retry cap cannot produce `READY_FOR_REVIEW`.
- A seeded critical red-team finding cannot be silently moved to a follow-up issue.
- The G2 report shows any owner-approved exception and why it is safe to defer.

### P0-5. Server-side branch protection should require CI status checks, not only a PR and no force-pushes

**Evidence in the plan:** §6.3, lines 391–401, identifies branch protection/rulesets as the strongest protection and explicitly mentions requiring a PR and blocking force pushes. It does not specify required CI status checks in that section, even though CI is central to the workflow.

**External evidence:** GitHub’s official [About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches) documentation lists requiring a PR, requiring status checks, blocking force pushes, and bypass rules as separate controls. Its [status-checks documentation](https://docs.github.com/en/pull-requests/reference/status-checks) says required checks must pass before merge.

**Why it matters:** Requiring a pull request means changes go through a PR; it does not, by itself, mean CI must pass. The harness cannot claim an enforceable quality gate if a PR with failing or missing required checks can still merge.

**Recommendation:** For each adopting repository, configure and verify a server-side ruleset/branch-protection rule that requires the PR, requires the relevant checks to pass on the current head, blocks force pushes, and limits bypass rights. Decide explicitly whether approval is required by human policy or only by the G2 owner decision. The setup script cannot reliably make the owner’s one-time configuration assumption true unless it checks the GitHub repository settings/API or gives a verified manual checklist.

**Acceptance criteria:**
- A deliberately failing required check prevents merge.
- A PR with no required check result cannot merge.
- A force push to the default branch is refused.
- Bypass permissions are reviewed and documented.

### P1-1. Handoff files are gitignored, so the “survives across machines” claim is not true by default

**Evidence in the plan:** §5.3, lines 259–272, places plans and handoffs in `.claude/work/<issue>/`; §6.5 lists `.claude/work/` as gitignored; D3 says the file survives across days and machines (§9, lines 617–618).

**Why it matters:** A gitignored file survives on the same machine and working directory, but it does not normally transfer to a fresh clone or another machine. This is a direct mismatch between the design rationale and the storage mechanism. It also complicates D16’s two-worktree model comparison unless both worktrees are explicitly given the exact same approved plan.

**Recommendation:** Choose and document the intended recovery guarantee. If the requirement is only to resume later on the same machine, say that and test it. If cross-machine or fresh-clone recovery is required, store the approved plan/handoff in a durable location (for example, an issue comment or a deliberately versioned artifact) while avoiding secrets and private session transcripts. Explicitly copy/checksum the approved plan into both comparison worktrees.

**Acceptance criteria:**
- Documentation distinguishes same-machine resume from cross-machine recovery.
- A fresh clone test either recovers the handoff or clearly reports that recovery is unsupported.
- Model-comparison runs record the hash of the same approved plan used in each worktree.

### P1-2. H3 is a supported optimization pattern, but must not become a security or correctness boundary

**Evidence in the plan:** §6.2 H3, lines 377–380, rewrites matching Bash commands through a wrapper that should preserve exit codes and output only concise summaries plus failures.

**External evidence:** Anthropic’s [cost guidance](https://code.claude.com/docs/en/costs#offload-processing-to-hooks-and-skills) explicitly demonstrates filtering verbose test output by rewriting Bash input. The [hooks reference](https://code.claude.com/docs/en/hooks) documents `updatedInput`, but also says Bash `if` pattern matching is best-effort when Claude Code cannot determine what a command runs. The [permissions reference](https://code.claude.com/docs/en/permissions#what-a-bash-rule-doesnt-match) gives examples such as `git push` versus `git -C . push` to show that argument-pattern rules are not, by themselves, a full security boundary.

**Why it matters:** Output filtering is valuable and officially documented. The risk is treating a best-effort matcher or an arbitrary command-rewrite wrapper as if it proves that only the intended check ran or that its exit result was preserved. A filter can also accidentally hide useful failure diagnostics.

**Recommendation:** Keep output reduction, but prefer a finite set of named checks (`fast`, `full`, or a configured check ID) resolved by a dedicated runner over generic transparent rewriting of arbitrary Bash. The runner should preserve the original exit status, record the actual command/check ID, capture useful failure output, and have bounded execution time. Do not use hook matching as the only protection for dangerous commands; use actual permission policy and server-side GitHub controls.

**Acceptance criteria:**
- Test passing and failing commands, pipelines, zero-output failures, timeout, paths with spaces, and output containing `FAIL`, `ERROR`, or similar strings in benign contexts.
- The runner’s exit code always reflects the tested process, not `grep`/`head` or another presentation step.
- Malformed hook input and unknown check IDs fail closed with clear diagnostics.
- Tests prove that output filtering cannot turn a failed test/build into a successful result.

### P1-3. The stale-documentation matcher is a heuristic, not proof that docs are current

**Evidence in the plan:** §6.4 S1, lines 405–417, checks a `docmap`, textual paths, basenames and directory paths; it explicitly admits that drift that never names a path is invisible. The original repository’s [stale-docs template](https://github.com/MatheusCastro99/HarnessConfigAndWorkflow/blob/main/Templates/stale-docs.md) is more semantic: it records what became false, the replacement claim and supporting evidence, and uses the historian to cross-check omissions.

**Why it matters:** A change to business behavior can make docs false without those docs naming the edited file. The heuristic can identify likely candidates but cannot prove completeness. The new plan also removes the separate historian and depends on inline updates plus red-team review.

**Recommendation:** Retain `docmap` for known high-value concept relationships; add a required documentation-impact decision to each plan/sub-phase; and keep independent verification in Block C. Describe script output as “candidate docs to review,” not an exhaustive stale-doc inventory. Require each acknowledgement to state why the doc remains accurate, with enough evidence for review.

**Acceptance criteria:**
- Fixture tests cover path references, basenames, directory paths, renames, deletions and `docmap` entries.
- A seeded semantic drift case where the document contains no source path is caught by the plan/review checklist, even though S1 does not catch it.
- Review output distinguishes script-detected docs from semantically assessed docs.

### P1-4. `.lastpass` must fingerprint the state that can change test results

**Evidence in the plan:** H2 (§6.2, lines 377–380) skips checks if the working tree matches `.claude/work/.lastpass`.

**Why it matters:** The optimization is safe only if the fingerprint represents the relevant current source state. A hash that ignores untracked source files, staged changes, deletions, or relevant generated/configuration inputs can falsely conclude that the tree is unchanged and skip a necessary check. The plan does not specify the hash algorithm or exactly which paths/states are included, so this is an implementation requirement rather than a proven defect.

**Recommendation:** Define the fingerprint precisely. It should capture the index plus relevant tracked working-tree changes and relevant untracked project files, while excluding known generated/noise directories. Record the check configuration/version with the fingerprint, so changing `harness.json` or check scripts invalidates the cached “pass.” If a complete, deterministic fingerprint cannot be established, run the fast check rather than skip it.

**Acceptance criteria:**
- After a pass, creating an untracked source file forces a new check.
- Staging, modifying, deleting and renaming a source file all invalidate the pass.
- Changing `harness.json`, the check runner or lint/test configuration invalidates the pass.
- Generated build artifacts do not repeatedly trigger redundant checks.

### P1-5. The InvoiceMe “no tests failed” result would provide weak correctness evidence

**Evidence in the plan:** §6.1, lines 361–371, states InvoiceMe’s `NODEAPI` test script is a stub that exits 1 and the project has no test suite; the plan instead uses lint, `node --check`, a build and observable per-sub-phase checks (§6.1 and D8, lines 368–371 and 622).

**Why it matters:** Linting and syntax checks can catch mechanical errors, but do not prove an API returns correct data, a business rule is correct, or a user flow still works. The plan is right not to make a full testing overhaul a prerequisite for adopting automation, but the evidence strength must be explicit.

**Recommendation:** Keep D8 but label the evidence accurately. For each InvoiceMe change, require one named observable acceptance check with exact expected input/output or UI state. Add a small number of automated smoke/regression tests for high-value routes and calculations as separate follow-up work. A lack of tests must be reported as a residual risk, not reinterpreted as a pass.

**Acceptance criteria:**
- Every plan sub-phase has a check with an objective expected result.
- The handoff lists checks performed and explicitly lists checks not available.
- Critical route/calculation behavior gains targeted regression coverage over time.

### P1-6. The MAUI build policy may duplicate CI without adding confidence

**Evidence in the plan:** §6.1 and D9, lines 361–371 and 623, exclude the minutes-long MAUI build from the harness; the owner runs it before merging, and CI’s `build.yml` also runs it on the PR.

**Why it matters:** Repeating the same reliable build locally and in CI costs owner time without necessarily adding independent evidence. Conversely, if CI does not reproduce the owner’s platform/toolchain, the local build may catch something CI misses. The plan states both are present but does not show which unique failure each catches.

**Recommendation:** Identify the gap the owner build is meant to catch. If PR CI reliably builds the same target on the supported configuration, make CI the enforceable gate and keep the owner’s build optional. If local validation is materially different (for example, a platform-specific workload or environment), document that unique gap and keep it as an explicit G2 checklist item.

**Acceptance criteria:**
- Document target framework, OS/runner, workload and build command in both local and CI paths.
- Demonstrate at least one reason for keeping both, or remove the redundant mandatory step.
- Merge cannot proceed while the required version of the build is unverified.

### P1-7. Runtime/version/provider requirements need to be checked, not assumed

**Evidence in the plan:** §7.2 pins roles to Opus 5.5 and Sonnet 5.5 and §6.5 sets models/environment in project settings (§6.5, lines 439–450; §7.2, lines 496–508). The plan’s target is specifically dependent on `opusplan` selecting Opus in plan mode and Sonnet in implementation.

**External evidence:** The current [Claude Code model configuration docs](https://code.claude.com/docs/en/model-config) state Sonnet 5.5 requires Claude Code v2.1.284 or later and Opus 5.5 requires v2.1.280 or later (requirements and aliases can vary by provider/runtime).

**Why it matters:** An older runtime or a provider with different model IDs/resolution can change which model actually runs, reject the configuration, or invalidate the price estimate. Model aliases are convenient, but cost evidence requires knowing the resolved model.

**Recommendation:** Make V0 record and check the Claude Code version, interface, provider, effective permission mode, resolved model and effort level for each block and subagent. Fail setup or explicitly downgrade to a tested compatibility mode when a required model cannot be resolved.

**Acceptance criteria:**
- V0 reports the effective runtime and model per role.
- A deliberately wrong/unsupported model configuration fails with a useful message.
- The pilot records model identity and price table version alongside each session cost.

### P1-8. Project settings do not guarantee the intended permission mode

**Evidence in the plan:** §4 Block B, lines 143–157, specifies auto permission mode and notes that `defaultMode: auto` cannot be set from project settings alone; it must be configured at user scope or passed via `--permission-mode`.

**External evidence:** Claude Code’s [settings documentation](https://code.claude.com/docs/en/settings) explains that the setting’s scope determines who it affects, and its [permissions documentation](https://code.claude.com/docs/en/permissions) describes how permission modes change approval behavior.

**Why it matters:** A repository can look correctly configured while a developer starts it in a different effective mode. That can cause more prompts than expected, or a different approval/security posture than the pilot assumes.

**Recommendation:** Provide a canonical launch command or setup procedure and verify the effective mode at runtime. Make the procedure visible in the repo rather than leaving it as an implicit user-level prerequisite.

**Acceptance criteria:**
- README documents the supported launch command/settings scope.
- V0 confirms the effective mode and fails or warns clearly if it is not the intended one.
- The pilot records unexpected approval prompts or mode mismatches.

### P1-9. Auto-fix is a referenced dependency but is not specified as a component

**Evidence in the plan:** Block B says “CI and review comments are watched by Auto-fix” (§4, lines 157–162), but the proposed file layout in §6.5, lines 439–450, does not identify the Auto-fix implementation, permissions, trigger, retry limit or completion signal.

**Why it matters:** The process cannot reliably determine when it is safe to write the handoff or start the independent review if this component’s lifecycle is unspecified. This also links directly to the stale-head risk in P0-2.

**Recommendation:** Define Auto-fix’s interface as part of the harness contract: whether it is a skill, a separately running process, or an external service; what events it watches; what permissions it has; how many attempts it receives; how it indicates quiescence; and how its commits invalidate the handoff/review SHA.

**Acceptance criteria:**
- The component is represented in the architecture/file layout or explicitly identified as external.
- A deterministic signal marks it complete or timed out.
- A new commit after handoff invalidates the current review state.

### P1-10. Cross-platform Node.js does not remove shell and process-execution differences

**Evidence in the plan:** D11 (§9, lines 625) chooses Node.js for cross-platform hooks/scripts. V0 is intended to seed each hook (§8.5, lines 581–587), but the plan does not define a full Windows/Linux test matrix.

**Why it matters:** Node runs on Windows, macOS and Linux, but child-process invocation, shell quoting, executable shims, path separators, signals and timeout behavior can still differ. H3 and hook inputs are particularly sensitive to quoting and exit-code handling.

**Recommendation:** Use `spawn`/`execFile` with argument arrays wherever possible, avoid interpolating untrusted paths into shell strings, and test the hooks under the actual supported shells on Windows and Linux. Explicitly set runtime requirements and test spaces, Unicode and unusual punctuation in filenames.

**Acceptance criteria:**
- CI runs fixture-based hook/script tests on Windows and Linux (macOS too if it is a supported target).
- Tests cover paths with spaces, non-ASCII names, timeouts, child-process failures and command shims.
- The support matrix names the Node.js minimum and shell assumptions.

### P1-11. The red-team finding count alone is not a sufficient quality metric

**Evidence in the plan:** §8.3 tracks red-team findings by severity and decisions, and §8.4 sets a target that major findings should be no higher than the first runs’ median (§8.3–§8.4, lines 557–577).

**Why it matters:** A low finding count can mean better code, weaker reviewer coverage, or a different issue mix. A median from a small number of previous runs is not a stable quality threshold. The plan’s own quality goal includes zero escapes, which also cannot be convincingly established by three issue trials.

**Recommendation:** Keep the metric but add calibration. Track seeded defects known to be present, independent post-merge regressions, finding severity, whether findings were valid, and how many were missed by automated checks. Compare review quality on the same diff for the Sonnet/Opus experiment. Treat the small-pilot result as an early signal only.

**Acceptance criteria:**
- At least a small set of known seeded defects is used to test red-team sensitivity.
- Reports include false positives, false negatives where known, and severity—not only the raw count.
- No production-quality claim is based solely on zero escapes in the first three issues.

### P1-12. The model comparison experiment must not contaminate production cost results

**Evidence in the plan:** D16 and V2 replay Block B on the same approved plan in two worktrees, once with Sonnet and once with Opus (§8.5, lines 590–595; §9, lines 629–630). The plan estimates an extra $2.5–$5 for the duplicate Block B.

**Why it matters:** If the duplicate run’s price is simply included in that issue’s production cost, the pilot will make the new workflow look more expensive than normal use. If it is excluded without being disclosed, the reported methodology becomes hard to reproduce.

**Recommendation:** Report two separate measures: (1) normal workflow cost per issue, and (2) experimental model-comparison cost. Use equivalent worktrees, a checksum of the approved plan, the same baseline branch and the same acceptance criteria. Compare not only dollars but fixes required, time, red-team findings, and test outcomes.

**Acceptance criteria:**
- The pilot table has separate columns for production and experimental spend.
- Both model runs start from the same approved plan and code baseline; only the intended model variable changes.
- One branch alone proceeds to final review/merge, and the report states which one and why.

### P2-1. Risk-scaled workflow profiles would avoid applying maximum ceremony to trivial work

**Evidence in the original repository:** The [README](https://github.com/MatheusCastro99/HarnessConfigAndWorkflow) says every issue goes through the same ordered stages and fixed gates, while also stating “Simple first. Add structure when the project needs it.” The optimization plan reduces seven approval gates to two for a standard issue (§4, lines 110–121).

**Why it matters:** The plan’s four blocks are a sensible standard path, but a documentation typo or isolated text change may not need the same expensive review path as a database migration, auth change or data-loss risk. Overusing a heavyweight flow can reintroduce the cost/latency problem in another form.

**Recommendation:** Keep the four-block path as the default for ordinary code issues, but define explicit profiles by risk: a lightweight path for nonbehavioral docs/format changes; the standard four-block path for normal code changes; and a high-risk path with extra test/security/owner gates for migrations, authentication, privacy, data integrity and release-critical changes. Classification must be visible in the approved plan and escalated when uncertainty is high.

**Acceptance criteria:**
- Each profile defines permitted scope, required checks, review depth and owner approvals.
- High-risk triggers cannot be downgraded silently by the implementation agent.
- Pilot measurements include issue type/risk profile so costs are compared fairly.

### P2-2. The project’s context reduction plan is good, but the target should follow measurement

**Evidence in the plan:** §5.1 reports that about 72k of the 84k-token initial context in #28 came from global tool/plugin/connector setup (§5.1, lines 207–243). D6 intentionally preserves Artifact and connector tools, estimating a startup near 78–80k, while the Block B budget comes out to about 88k (§5.2, lines 249–257).

**Why it matters:** Reducing project documentation loads is useful, but the report suggests most starting context comes from global setup. A small root `CLAUDE.md` alone cannot solve that overhead. The context numbers are estimates derived from character counts and an average character-to-token ratio; only runtime measurements can validate them.

**Recommendation:** Keep D5–D7 (on-demand docs, scoped rules, compressed universal instructions), but measure `/context` on the actual desktop/CLI setup and each block. Make plugin/connector disablement a measured cost decision after the first pilot, not a debate based on estimates alone. Keep context size targets internally consistent.

**Acceptance criteria:**
- V0 captures `/context` for each supported runtime/interface.
- Every pilot block records measured starting and peak context.
- Changes to plugins/connectors are A/B measured for cost and impact on available workflow capabilities.

---

## 3. Decisions worth preserving

The following decisions are good and should survive the hardening work:

1. **Two owner gates for the normal workflow.** Scope approval and the consolidated review/finding decision reduce interruption without removing owner authority, provided blockers cannot be waved through implicitly.
2. **Independent red-team review.** Keep it separately configured and focused on actionable evidence-based findings. The original repository’s independent review principle is a major quality safeguard.
3. **Small root instructions and on-demand detail.** The original README says the context index and project documents are loaded before work; the production plan correctly recognizes this over-loads every task. Keep universal rules in `CLAUDE.md`, area rules in scoped rules, and detailed workflow procedures in skills.
4. **Deterministic checks over prose instructions.** Lint/build/test checks and schema checks belong in scripts/hooks where feasible. Anthropic’s [cost documentation](https://code.claude.com/docs/en/costs#offload-processing-to-hooks-and-skills) also supports filtering verbose output and moving specialized instructions into on-demand skills.
5. **Evidence-based model selection and pricing.** Keep the Sonnet-versus-Opus experiment, but make it controlled and separate experimental expenditure from ordinary per-issue cost.
6. **Docs updated with the code.** This is a useful default that prevents documentation from being deferred to a separate, easily forgotten phase. Preserve independent semantic review because path heuristics cannot catch all drift.
7. **Owner performs the final merge.** This is a sensible boundary. The workflow should make the merge-ready criteria deterministic and ensure GitHub enforces the required CI checks.

---

## 4. Suggested implementation order

### Phase 0 — close safety gaps before a real autonomous pilot

- Fix `/close` branch deletion safeguards.
- Add PR head SHA and CI head SHA checks throughout handoff/review.
- Verify the plan-accept context reset in the actual Claude Code version/interface; add a fresh-session fallback.
- Define explicit workflow states and blocker policy.
- Configure and test server-side branch protection/rulesets with required checks.

**Exit condition:** All P0 acceptance criteria pass in fixture repositories. Do not allow the first pilot issue to exercise untested destructive cleanup.

### Phase 1 — establish script/hook correctness

- Validate `harness.json` with a versioned schema; reject unknown/missing check IDs and invalid path globs.
- Implement a named-check runner for `fast`/`full` and any plan-specific checks.
- Specify and test `.lastpass` state fingerprinting.
- Test H1–H5 on Windows and Linux, including failure, timeout and malformed-input paths.
- Implement handoff/plan schema validation and clear `BLOCKED` semantics.
- Specify Auto-fix lifecycle and head-SHA invalidation.

**Exit condition:** Fixture tests demonstrate each gate fires when it should, cannot silently pass a seeded failure, and produces bounded useful diagnostics.

### Phase 2 — run a controlled pilot

- Start with the three BabyBuddyHelper issues proposed in the plan, but label results preliminary.
- Keep normal workflow cost separate from the V2 duplicate model experiment.
- Record the actual runtime, provider/model, effort, start/peak context, calls, token-type cost, owner active minutes, interventions, check failures, red-team findings and post-merge regressions.
- Run the InvoiceMe pilot with exact named observable checks and report its weaker test coverage explicitly.

**Exit condition:** Cost and context targets are met without increased missed defects or unsafe bypasses. If quality weakens, restore the relevant gate/check before tuning cost further.

### Phase 3 — broaden validation before declaring production readiness

- Add different task classes: a small bug, a feature with behavior changes, a documentation-only change, and a change stressing a known risk such as a migration or integration.
- Use seeded failures and run historical/reproducible cases where possible.
- Review the workflow after several weeks of post-merge tracking, rather than treating zero escapes in a tiny pilot as proof.
- Publish the measured values that replace the §8.2 estimates.

**Exit condition:** The operating policy describes validated conditions and known limits, not just a successful first pilot.

---

## 5. Recommended acceptance criteria summary

| Area | Minimum production-readiness criterion |
|---|---|
| Cleanup safety | No force-delete unless local/remote state proves no unmerged local work; ambiguous states abort. |
| Review integrity | Reviewed SHA = current PR head SHA = successful CI SHA at merge-readiness. |
| Context boundary | The context reset is verified on the exact runtime; otherwise a separate fresh session is used. |
| Failure state | A capped retry loop yields `BLOCKED`, never a pass. Blocking security/correctness findings require resolution or explicit documented owner acceptance. |
| GitHub enforcement | Required PR and required CI checks; no force-push; bypass rights documented. |
| Handoff | Required fields validated; known status, commit SHA, check outputs and deviations recorded; durability guarantee stated. |
| H3 output filtering | Exit code and failure evidence survive filtering; no test/build failure can be masked by the wrapper. |
| H2 fingerprint | Staged, unstaged, untracked, deleted, renamed and config/script changes invalidate `.lastpass` as appropriate. |
| Stale docs | Script findings are treated as candidates; plan and independent review cover semantic drift. |
| Project without tests | Each sub-phase has an objective observable check; testing gaps are explicitly reported. |
| Runtime | V0 verifies Claude Code version, provider, resolved model, permission mode and Node prerequisite. |
| Cost accounting | $7.49 is the 25%-reduction cutoff; experimental replay spend is reported separately. |
| Quality evidence | Pilot is labelled preliminary; later validation includes representative issues, seeded failures and post-merge observations. |

---

## 6. Source list

### User-supplied source

- `OPTIMIZATION_PLAN.md`, reviewed as supplied. Key sections: §2 evidence baseline; §4 workflow; §5 context layout; §6 hooks/scripts; §7 model selection; §8 validation; §9 decisions log.

### Original repository

- [HarnessConfigAndWorkflow — README](https://github.com/MatheusCastro99/HarnessConfigAndWorkflow): purpose, fixed stages/gates, owner authority, context documentation, independent review, doc tracking and templates.
- [Original stale-docs template](https://github.com/MatheusCastro99/HarnessConfigAndWorkflow/blob/main/Templates/stale-docs.md): records the stale claim, intended replacement and supporting evidence, and expects the historian to cross-check the running list.

### Current external documentation reviewed on 2026-10-21

- [Claude Code hooks reference](https://code.claude.com/docs/en/hooks): hook `if` matching, `updatedInput`, timeouts, command hooks and limits of best-effort Bash pattern matching.
- [Claude Code permissions](https://code.claude.com/docs/en/permissions): permission behavior and the fact that Bash argument patterns do not comprehensively cover alternate command forms.
- [Claude Code settings](https://code.claude.com/docs/en/settings): setting scopes, loading and verification.
- [Claude Code model configuration](https://code.claude.com/docs/en/model-config): model aliases and runtime/version requirements; current page states Sonnet 5.5 requires v2.1.284 or later and Opus 5.5 requires v2.1.280 or later.
- [Claude Code costs and optimization guidance](https://code.claude.com/docs/en/costs): cost tracking, output filtering with hooks, moving workflow-specific guidance into skills, and delegating verbose operations.
- [Claude Code issue #48951](https://github.com/anthropics/claude-code/issues/48951): historical report of the plan-accept clear-context option not clearing context on v2.1.110/Linux; used only to justify a runtime regression test, not to claim the current release is broken.
- [Claude Code issue #71061](https://github.com/anthropics/claude-code/issues/71061): reported limitation when plan approval is routed through a `PermissionRequest` hook.
- [Git branch documentation](https://git-scm.com/docs/git-branch): semantics of safe deletion (`-d`) versus forced deletion (`-D`).
- [GitHub protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches): PR requirements, required status checks, force-push protection, bypass options.
- [GitHub status checks](https://docs.github.com/en/pull-requests/reference/status-checks): required check status is a separate merge requirement.

---

## Final recommendation

**Proceed with the four-block design, but do not mark the plan validated or run the first fully autonomous pilot until the P0 items are closed.** The core optimization thesis is credible: load less irrelevant context, reset long sessions at meaningful boundaries, move repeatable checks into deterministic scripts, and measure the result. The production-readiness gap is enforcement and state integrity, not a lack of workflow structure.

The right success criterion is not simply “fewer approval prompts” or “lower average tokens.” It is: **lower measured cost and owner effort while preserving review integrity, blocking known failures, and never destroying work when the system cannot prove that cleanup is safe.**
