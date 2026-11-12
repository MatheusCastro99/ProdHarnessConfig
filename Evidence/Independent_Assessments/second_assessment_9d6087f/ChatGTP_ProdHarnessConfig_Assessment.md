# Production Harness Assessment

## Comparison with earlier versions, current gaps, and recommended direction

**Assessment date:** 2026-11-11\
**Repository:**
[MatheusCastro99/ProdHarnessConfig](https://github.com/MatheusCastro99/ProdHarnessConfig)\
**Earlier reference:**
[HarnessConfigAndWorkflow](https://github.com/MatheusCastro99/HarnessConfigAndWorkflow)

------------------------------------------------------------------------

## Executive assessment

`ProdHarnessConfig` is the strongest and most mature expression of the
project so far. The work has progressed from a comprehensive,
instructional workflow into a production-oriented harness with
executable configuration, project profiles, installation/onboarding,
tests, and a growing record of measured runs.

The most important improvement is not simply that the workflow is
shorter or cheaper. It is that important parts of the workflow are
increasingly enforced through scripts, hooks, CI, explicit state, and
commit identity rather than relying exclusively on agent instructions.
That is the correct direction for a dependable harness.

The separation between the original study repository and the production
repository is also sound. The original repository can remain the
explanatory reference for the methodology; `ProdHarnessConfig` can
evolve around operational reliability, installation, compatibility, and
evidence.

However, the current evidence does **not** justify calling the final D26
configuration broadly validated. The repository describes D26 as built
but still awaiting installation/reinstallation in the adopting projects.
The measured results are encouraging, but the runs are not yet a
controlled, representative cross-project validation set. Public cost and
quality claims should remain qualified until that work is complete.

**Overall judgment:** a well-engineered, owner-operated harness with
promising results and a credible validation path---not yet a generally
validated production standard.

------------------------------------------------------------------------

## 1. Evolution across the versions

  -----------------------------------------------------------------------------------------------------
  Stage                        Primary purpose       Contribution        Main limitation
  ---------------------------- --------------------- ------------------- ------------------------------
  **HarnessConfigAndWorkflow / Teach and standardize Explicit stages,    The full process imposed
  HarnessEngineering101**      a comprehensive       approval gates,     substantial context,
                               engineering           owner authority,    coordination, and approval
                               methodology           independent review, overhead even for routine work
                                                     documentation       
                                                     discipline,         
                                                     templates, and      
                                                     examples            

  **Original Optimization      Reduce operational    Four workflow       Safety/lifecycle assumptions
  Plan**                       cost                  blocks, fewer owner were not sufficiently
                                                     gates, context      enforced; projected savings
                                                     boundaries,         and context budgets had
                                                     on-demand           inconsistencies
                                                     instructions,       
                                                     deterministic       
                                                     checks, and cost    
                                                     measurement         

  **Revised Optimization       Turn optimization     SHA-bound           Implementation/documentation
  Plan**                       into an enforceable   handoffs/reviews,   drift, incomplete tests,
                               design                explicit `BLOCKED`  unresolved approval semantics,
                                                     state, named-check  and limited validation
                                                     execution, safer    
                                                     cleanup, durable    
                                                     handoffs, and       
                                                     better experiment   
                                                     accounting          

  **ProdHarnessConfig**        Deliver the           Installable         D26 rollout and representative
                               production-oriented   harness,            cross-project validation
                               implementation        project-specific    remain incomplete;
                                                     configuration,      version/evidence traceability
                                                     scripts/hooks,      needs tightening
                                                     tests, onboarding,  
                                                     and measured runs   
  -----------------------------------------------------------------------------------------------------

### 1.1 What should be preserved from the original methodology

The original repository was not merely ceremony. It established valuable
principles:

-   The owner controls scope, acceptance, and consequential decisions.
-   Planning and implementation are distinct activities.
-   Review should be independent of the implementation agent.
-   Documentation is part of the deliverable, not optional cleanup.
-   Findings should be evidence-based and actionable.
-   The workflow should make decisions and state visible.

The production harness should preserve these guarantees even if their
implementation changes. Independent review and owner authority should
not be traded away for lower token cost.

### 1.2 What the optimization correctly changed

The four-block model---Scope, Build, Review, Close---is a sensible
operational simplification. It reduces transitions and human
interruptions while retaining the core responsibilities.

The move toward small always-loaded instructions and on-demand
skills/rules is also sound. The harness should load only the guidance
needed for the current task, rather than paying the context cost of the
entire methodology on every issue.

Most importantly, the optimization moved repeatable requirements toward
deterministic enforcement. A script that validates a check result, a
hook that blocks an unsafe transition, or CI that requires a successful
status on the current commit is more dependable than a prompt saying an
agent must remember to do those things.

### 1.3 Why the production repository should remain separate

The repositories have different jobs:

-   **Study/reference repository:** explain the methodology, rationale,
    examples, and reusable learning materials.
-   **Production repository:** provide the tested implementation,
    installation path, supported configuration, compatibility contract,
    and operational evidence.

Combining them would create competing design goals. The separation is
beneficial as long as the production repository links back to the
methodology and identifies which principles it implements.

------------------------------------------------------------------------

## 2. Current strengths

### 2.1 It has become an actual software artifact

The current repository is no longer only a plan describing intended
files and behavior. It contains a production-oriented harness structure,
project configurations, installation/onboarding material, and tests.
That materially changes the maturity of the work.

The installer and project-profile approach are especially important.
They move the project toward repeatable adoption instead of requiring
each repository to reconstruct the harness manually.

### 2.2 The four-block workflow is a good default

1.  **Scope:** establish the problem, constraints, and approved plan.
2.  **Build:** implement against that approved scope.
3.  **Review:** independently inspect the resulting change and evidence.
4.  **Close:** complete the owner-controlled merge/cleanup lifecycle.

This is a good balance between process discipline and operational
efficiency. I would keep it as the default Standard workflow rather than
redesigning it again.

### 2.3 The safety model is more concrete

The revised design introduced controls that should remain central:

-   Explicit blocked states after repeated failed checks.
-   No successful handoff from a blocked build.
-   Review bound to the exact PR head SHA.
-   CI evidence associated with the same commit being reviewed.
-   Cleanup that refuses to discard local work when branch state is
    ambiguous.
-   Named checks with explicit execution results rather than arbitrary
    command rewriting.
-   Fingerprinting that accounts for more than committed files.

These controls address real failure modes. They are not cosmetic
hardening.

### 2.4 The measurement record is candid

The current README reports a history of issue runs and differentiates
configurations rather than presenting a single idealized number. It
reports:

  Measure                                  Reported value
  -------------------------------------- ----------------
  Pre-harness baseline median cost                 \$9.99
  D24 Standard median                              \$6.03
  D25 Standard median                              \$8.32
  Median peak context, baseline                      291k
  Median peak context, D24                           125k
  Median peak context, D25                           145k
  Owner messages, baseline / D24 / D25         11 / 7 / 9

The D25 cost regression is not hidden. The repository attributes it to
expensive review fixes at high context and describes the move to a
forked builder as the D26 response. Reporting regressions, explaining
the hypothesis, and identifying the corrective change is good
engineering practice.

The README also qualifies that baseline and later measurements involve
different projects and issue sizes. That qualification should be
retained wherever these numbers are repeated.

------------------------------------------------------------------------

## 3. Gaps and risks in the current version

### P0 --- Close before describing D26 as deployed

#### 3.1 D26 rollout status must be unambiguous

The implementation status says D25 is installed in BabyBuddyHelper,
InvoiceMe, and ThisIsMatheus, while D26 is built in ProdHarnessConfig
and awaiting reinstall PRs in the adopting projects. A harness
implementation existing in its source repository is not the same as that
implementation being installed and exercised in each target project.

**Recommendations:** - Track D26 as separate states: `implemented`,
`installed`, `smoke-tested`, `used-in-issue-run`, and `validated`. -
Record the exact harness commit/version installed in each project. - Do
not label a run D26 unless the project was using that exact version. -
Keep D26 validation provisional until representative runs complete in
the adopting repositories.

#### 3.2 Establish one authoritative version-to-evidence record

The README describes D26 and the broader run history, while the
optimization plan's status and decision log appear to describe an
earlier snapshot, ending at D24 in its opening status. This may reflect
documents updated at different times, but the relationship is not
sufficiently clear.

This is more than documentation polish. An auditor or future maintainer
needs to know which decisions produced the installed implementation and
which tests support each claim.

**Recommendation:** Create a release/evidence manifest for every
meaningful harness version. Identify: - Harness version and Git
commit. - Decision-log revision. - Installer version. - Supported
runtime/model configuration. - Test suite revision and result. -
Adopting project and installed commit. - Issue runs performed on that
version. - Known limitations and superseded decisions.

Make the README, decision log, and implementation status link to that
manifest rather than maintaining competing summaries.

### P1 --- Resolve before making broad production claims

#### 3.3 Cross-project results are promising, not conclusive

The plan reports two InvoiceMe Standard runs using the forked Sonnet
builder at \$5.16 and \$4.80. These are useful early signals. Earlier
BabyBuddyHelper pilot runs were affected by the intended model
configuration not taking effect and used Opus for the build path.

The data therefore does not yet represent a clean, repeated comparison
of the final D26 configuration across both stacks.

Different technology stacks are a meaningful test because they exercise
different build systems, test infrastructure, repository structures, and
documentation conventions. But two runs in one project do not establish
generalization.

**Recommendations:** - Complete the planned InvoiceMe runs under the
exact final D26 configuration. - Run D26 in BabyBuddyHelper and
ThisIsMatheus after installation. - Label every run with project, stack,
task class, risk tier, harness version, resolved model per role, and
whether it was normal or experimental. - Report results by project and
task class before presenting an aggregate median. - Keep experimental
replay/model-comparison costs separate from normal issue cost.

#### 3.4 Cost claims should distinguish historical results from D26 results

The reported D24 median of \$6.03 is approximately 40% below the \$9.99
baseline. D25's \$8.32 median is approximately 17% below that baseline.
D26 is intended to address the D25 review-fix cost path, but its rollout
is still pending.

The "about 40% less" statement should not be presented as a guaranteed
or current D26 outcome.

**Recommended public wording:**

> Earlier configurations demonstrated cost reductions of up to
> approximately 40% in measured issue runs. Results vary with issue
> complexity and configuration. D26 is undergoing rollout and
> validation.

Internally, report median and distribution, cost by project/task class,
normal versus experimental cost, owner active time, interventions,
rework, and review-fix cost.

#### 3.5 Quality preservation needs a multidimensional scorecard

"No blocking finding left at merge" is useful, but it does not establish
that quality was preserved in every relevant sense. A clean merge can
still contain a missed requirement, an escaped defect, or documentation
drift.

Track separately: 1. Seeded-defect detection rate. 2. Valid red-team
findings by severity. 3. False-positive findings. 4. Blocking findings
fixed before merge. 5. Owner-approved exceptions and rationale. 6.
Post-merge defects and regressions. 7. Requirement/acceptance-criteria
completion. 8. Documentation discrepancies discovered after merge. 9.
Owner intervention and rework.

Do not use a single "quality held" label as a substitute for this
evidence. A successful review is one checkpoint, not proof of
defect-free software.

#### 3.6 The Small tier has only been demonstrated on documentation work

The plan reports three Small-tier runs with a median cost of \$2.91, but
they were documentation-only. A Small code change has not yet
established the actual cost or quality behavior of the tier.

This is an early result, not a basis for generalizing the estimate to
implementation tasks.

**Recommendation:** Run representative Small-tier code changes,
including one behavioral change with objective verification. Measure
whether the reduced workflow creates additional rework or weakens
independent review. Keep high-risk changes out of Small regardless of
apparent line count.

#### 3.7 Small-tier risk boundaries should be explicit

A lightweight tier is valuable, but classification must be based on risk
and uncertainty---not merely diff size.

Changes involving authentication, authorization, privacy, data
integrity, destructive operations, migrations, financial calculations,
external side effects, or security boundaries should escalate to
Standard or a defined high-risk path.

The builder should not be able to silently downgrade a task after
discovering that it is more consequential than initially understood.

#### 3.8 Projects without automated tests need explicit evidence limits

The harness can work in repositories with limited or no test suites, but
a successful build or lint run is not equivalent to functional
correctness.

Require observable acceptance criteria, a named verification method for
each changed behavior, explicit reporting when behavior cannot be
verified, manual/integration verification where justified, and a clear
statement of what CI did and did not establish.

The harness should expose the absence of tests, not imply that workflow
discipline compensates for missing test coverage.

### P2 --- Improve after rollout and safety evidence

#### 3.9 Keep model-routing experiments controlled

The forked Sonnet builder is a reasonable cost hypothesis. Model
comparisons are informative only when other variables are controlled:
same approved plan, baseline commit, tools, permissions, acceptance
criteria, and equivalent review.

If both outputs are compared for quality, both need equivalent
independent review. Otherwise, compare only metrics available for both
and do not infer quality equivalence from cost alone.

#### 3.10 Keep the production harness small

Resist accumulating special-case scripts, hooks, and model-routing rules
for every incident. Each addition should have: - A named failure mode it
prevents. - A test that reproduces that failure mode. - A documented
owner and maintenance cost. - Evidence that it belongs in the shared
harness rather than a project-specific profile.

An overgrown harness can recreate the context and maintenance burden
that the optimization was intended to remove.

#### 3.11 Treat documentation drift as a recurring risk

Path-based stale-documentation detection can identify candidate files,
but it cannot prove that changed behavior is accurately described. Keep
automated candidate detection, but retain an explicit
documentation-impact decision in planning/review. Periodically audit the
README, decision log, installer behavior, and project profiles against
the implementation.

------------------------------------------------------------------------

## 4. Recommended direction

My recommendation is to **stop redesigning the core workflow for now and
concentrate on rollout, evidence, and maintainability**.

The architecture is mature enough to test. The next phase should answer
whether it works reliably in real projects, not introduce another major
optimization before the current one has been validated.

### Phase 1 --- Finish D26 rollout

1.  Merge the D26 reinstall PRs for every adopting project.
2.  Verify installed files/configuration against the intended D26
    commit.
3.  Run installer, smoke, and failure-path checks in each project.
4.  Record exact harness and project commits.
5.  Confirm model routing, permission mode, runtime, and named-check
    behavior in the actual environment.

**Exit condition:** Each target project has a verified D26 installation
and a recorded smoke-test result.

### Phase 2 --- Complete representative cross-project runs

Use a small but deliberate matrix rather than a large volume of
arbitrary issues.

  -----------------------------------------------------------------------
  Project                             Useful task classes
  ----------------------------------- -----------------------------------
  BabyBuddyHelper                     Small behavioral fix; normal
                                      feature or bug fix

  InvoiceMe                           Normal code issue; issue exercising
                                      its distinct stack/build/test
                                      conventions

  ThisIsMatheus                       Representative
                                      repository/configuration task;
                                      normal code issue if applicable
  -----------------------------------------------------------------------

For every run, capture harness version/commit, project commits before
and after, issue type/complexity/risk tier, resolved model and effort
per role, cost breakdown, starting/peak context per block, owner active
time/interventions, check failures/retries, review findings/fixes, and
post-merge regressions/documentation discrepancies.

**Exit condition:** There is enough evidence to describe where D26
works, what it costs, and which project/task classes remain weakly
tested. Do not require an arbitrary large sample before learning
anything, but do not turn a handful of runs into a universal claim.

### Phase 3 --- Validate quality, not just successful completion

Add deliberate failure cases to the harness test suite: - Failed named
check and timeout. - Stale PR head between handoff and review. - CI
result for an older SHA. - Local-only commit during cleanup. - Staged,
unstaged, and untracked changes during cleanup. - Missing or malformed
handoff data. - Documentation-impact omission. - Builder failure
reaching the retry limit. - Windows path/quoting and child-process edge
cases, if Windows is supported.

Use seeded defects or known historical bugs to measure review
sensitivity. Continue post-merge tracking long enough to catch defects
that do not appear during the review window.

**Exit condition:** Safety controls have regression tests, and quality
claims are tied to observed outcomes rather than process completion
alone.

### Phase 4 --- Stabilize and publish a supported contract

Once rollout evidence is satisfactory: - Declare a stable harness
version. - Document supported Claude Code/runtime versions, operating
systems, Node version, model roles, and permission assumptions. - Define
compatibility policy for project profiles and installer upgrades. -
Publish migration/reinstall instructions. - Maintain a changelog and
version-to-evidence manifest. - Define how projects report harness bugs
and how fixes are upgraded.

At this point, prioritize maintainability and adoption over further cost
tuning.

------------------------------------------------------------------------

## 5. What I would not do next

Until D26 has completed rollout and representative validation, I would
avoid: - Another major workflow redesign. - Adding approval gates for
every rare edge case. - Removing independent review to improve cost. -
Expanding model roles without evidence that complexity improves
outcomes. - Optimizing token counts without checking owner time, rework,
and defect detection. - Advertising a single cost-saving percentage as
guaranteed. - Treating zero observed escapes in a small pilot as proof
of a low escape rate.

The project has reached the point where added complexity can become its
own source of failure. Every new mechanism should justify its
maintenance burden.

------------------------------------------------------------------------

## 6. Suggested project success criteria

  -----------------------------------------------------------------------
  Dimension                           Evidence of success
  ----------------------------------- -----------------------------------
  **Correctness and safety**          Unsafe transitions are blocked;
                                      stale SHA/CI evidence is rejected;
                                      cleanup preserves ambiguous local
                                      work; blockers remain visible

  **Quality**                         Requirements are met; independent
                                      review detects meaningful defects;
                                      escaped defects and documentation
                                      drift are tracked

  **Efficiency**                      Lower cost and context than the
                                      original baseline on comparable
                                      tasks, without shifting burden into
                                      owner time or rework

  **Portability**                     The same supported harness can be
                                      installed and operated across
                                      target projects without fragile
                                      project-specific exceptions

  **Maintainability**                 Versioned configuration, tests,
                                      clear compatibility contract,
                                      reproducible installation, and
                                      traceable evidence
  -----------------------------------------------------------------------

No single metric should override the others. A cheaper run that misses a
defect or requires substantial owner repair is not a successful
optimization.

------------------------------------------------------------------------

## 7. Final opinion

The project has made a substantial transition:

-   The original repository established the engineering philosophy.
-   The first optimization plan identified how to reduce overhead.
-   The revised plan translated important principles into enforceable
    controls.
-   `ProdHarnessConfig` is turning those controls into an installable
    and measurable system.

That is real progress. The current repository is more convincing because
it contains implementation and measurement, not simply a persuasive
design document.

The remaining work is primarily validation and operational discipline.
Complete D26 rollout, reconcile the version/evidence record, run
representative issues across the different project stacks, and measure
quality and owner burden alongside cost.

My strongest recommendation is to treat the next milestone as **D26
validation and stabilization**, not D27 optimization. If the harness
passes that phase, freeze the core workflow for a while and let real
adoption expose the next set of problems.

The project should optimize for a dependable engineering system---not
the smallest possible prompt, the fewest approval steps, or the lowest
single-run bill.

------------------------------------------------------------------------

## Sources and scope

This assessment draws on: -
[ProdHarnessConfig](https://github.com/MatheusCastro99/ProdHarnessConfig),
particularly its README, implementation status, and optimization records
as reviewed on 2026-11-11. -
[HarnessConfigAndWorkflow](https://github.com/MatheusCastro99/HarnessConfigAndWorkflow),
as the original methodology/reference repository. - The original and
revised optimization plans supplied in the earlier review process. - The
prior assessment, *Production Harness Optimization Plan --- Findings,
Evidence, and Recommendations*.

The numerical results and implementation status are repository-reported
figures, not an independent reconstruction of every raw session.
Conclusions about sample sufficiency, experiment design, quality
measurement, and recommended direction are analysis of those reported
materials.
