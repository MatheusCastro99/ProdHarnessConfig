# Review of the ChatGPT assessment

Reviewed 2026-10-21 against `OPTIMIZATION_PLAN.md` at `0889287` (639 lines; ChatGPT cites 640, so it saw the current plan), the study repo, the session records behind `research/`, and Anthropic's, Git's and GitHub's docs.

## Overall

- **The strongest of the four.** It found real defects in the plan: a data-loss path, a time-of-check/time-of-use gap, and a false durability claim. It also tied most recommendations to testable acceptance criteria.
- **It cited sources, and every source I checked was real.** That includes both GitHub issues it cites.
- **Calibration:** the "brutally honest" framing shows as **priority inflation**. Five items are labelled P0, but only three would cause harm before a pilot; P0-4 and P0-5 are P1 by its own definition. Several P1s are generic engineering good practice (P1-10) rather than plan-specific defects.
- **It worked without the raw records** and says so explicitly, which is correct conduct. Where it doubts the numbers, I re-checked them against the records.

## Ledger

Verdicts: **V** verified · **P** partly verified · **C** contradicted · **U** unverifiable · **A** already addressed in the plan.

| ID | Claim, in my words | Type | Verdict | Evidence | Triage |
|---|---|---|---|---|---|
| GPT-1 | The cost shares add to 101%; they are rounded | Fact | V | 46 + 37 + 18 = 101; cost.js gives 45.7 / 36.6 / 17.6 | Note only |
| GPT-2 | A 25% cut from $9.99 is $7.49; the $7.2–7.7 estimate straddles it | Fact | V | Arithmetic | **Adopt**: state $7.49 as the cut-off; the estimate is an uncertainty range |
| GPT-3 | Block B starts at ≈ 88k, but the target is ≤ 85k: a contradiction | Fact | P | §8.4's basis is global plus project layer, *before* the skill and plan load, so the two measure different points. The metric is undefined, not wrong. | **Adopt**: define the metric as "context before the first prompt", separate from block starts |
| GPT-4 | Zero escapes in 3 trials leaves a 95% upper bound of ~63% | Fact | V | 1 − 0.05^(1/3) = 0.632 | **Adopt**: call the pilot preliminary |
| GPT-5 | `/close` can `git branch -D` local commits that were never pushed | Defect | V | git docs: `-D` deletes "irrespective of its merged status"; S2 only checks the PR state | **Adopt**: compare the local tip to the PR's `headRefOid`; abort if they differ or the tree is dirty |
| GPT-6 | Review and CI aren't tied to the PR head SHA; Auto-fix can push after the handoff | Defect | V | Desktop docs: Auto-fix is set on the PR in the session that opened it, which is Block B's session. It fixes failing checks and addresses review comments, so a push after the handoff is the expected path. | **Adopt**: the handoff records `prHeadSha`; `review` refuses if the head moved; G2 reports the SHA it reviewed |
| GPT-7 | Clear-on-accept is a critical, untested dependency, and a bug existed | Risk | V | anthropics/claude-code#48951 is real ("doesn't actually clear context", closed). #71061 is real but applies only when a PermissionRequest hook approves the plan, which this plan doesn't use. The **desktop docs don't document the option at all** (fetched today), and the owner works in the desktop app. | **Adopt**: a V0 test on the owner's surface, with a documented fallback (`/clear`, then load the plan file) |
| GPT-8 | The 3-failure cap needs an explicit BLOCKED state | Gap | P | H2 "lets Claude stop and report", but nothing then stops the push, the PR or the handoff | **Adopt**: H2 writes `BLOCKED` to the work dir; the handoff status field and S3 refuse `READY` while it is set. Priority P1, not P0. |
| GPT-9 | Branch protection should also require status checks | Gap | V | GitHub docs list required status checks as a separate control; §6.3 names only PR + no force push | **Adopt** as P1. The owner merges by hand after G2, so this is defence in depth, not a P0. |
| GPT-10 | The handoff is gitignored, so "survives across machines" is false | Defect (our claim) | V | §6.5 gitignores `work/`; D3 says "across days and machines". The plan is wrong. | **Adopt**: correct D3 to same machine, any day. Cross-machine recovery is an owner decision (§ combined F6). |
| GPT-11 | H3's command rewriting rests on best-effort matching; use a named-check runner | Risk | V | Hooks docs: when Claude Code "can't determine which commands the Bash input runs, it runs your hook regardless of the pattern … the `if` filter is best-effort" | **Adopt**: the skills call `node .claude/scripts/check <fast\|full\|id>`. H3 shrinks to a fallback that re-checks the command itself. |
| GPT-12 | Stale-docs matching is heuristic; add a semantic-drift test | Gap | A + P | §6.4 already states the limit, and §5.4 has "Docs likely to go stale". Not present: a seeded semantic-drift test, and an explicit doc instruction for the red-team. | **Adopt** the seeded test in V0 and the red-team instruction |
| GPT-13 | The `.lastpass` fingerprint must cover staged, untracked and config changes | Spec gap | V | §6.2 says "matches the last passing tree" without defining it | **Adopt** as an implementation requirement: hash the index + work tree + untracked files + `harness.json` + script versions |
| GPT-14 | InvoiceMe's checks are weak evidence; report gaps as residual risk | Framing | A + P | D8 already exists. New: reporting "checks not available" | **Adopt**: a handoff line "Not verifiable here" |
| GPT-15 | The owner's MAUI build may duplicate CI | Question | V | BabyBuddyHelper's `build.yml` runs on `pull_request` and builds `net10.0-windows`. The owner's local build is the same target. | **Owner decision**: D9 was the owner's call; the evidence says CI already covers it |
| GPT-16 | Model/runtime versions (Sonnet 5.5 ≥ 2.1.284, Opus 5.5 ≥ 2.1.280) must be checked | Risk | U, moot | Version numbers not checked; the owner runs **2.1.304** (`claude --version`), so the concern is moot today | **Adopt** cheap: V0 records version, surface, resolved model, effort |
| GPT-17 | Project settings can't guarantee the permission mode | Fact | A | The plan already says so (§4 Block B) | **Adopt** small: a documented launch procedure; V0 checks the mode |
| GPT-18 | Auto-fix is an unspecified dependency | Gap | V | It is the desktop app's per-PR feature, absent from §6.5 | **Adopt**: name it as an external dependency, with its end state and how it invalidates the handoff (with GPT-6) |
| GPT-19 | Node.js doesn't remove shell differences; test on Windows and Linux | Practice | P | Generic. Using `execFile`/`spawn` with argument arrays is standard, and the owner is Windows-only today. | **Adapt**: `execFile` with argument arrays; a Windows test matrix now, Linux when CI runs the hooks |
| GPT-20 | A red-team finding count is not a quality metric; calibrate with seeded defects | Gap | V | §8.4 uses "majors ≤ median" with no calibration | **Adopt**: seed 2–3 known defects in V0 and record red-team recall |
| GPT-21 | Keep the V2 experiment's cost separate from production cost | Method | V | D16 doesn't say how the extra run is booked | **Adopt** (trivial) |
| GPT-22 | Risk-scaled workflow profiles | Design | V (strengthened) | Our own data: the new design has a **fixed floor of ≈ $2.4 per issue** (three session-start writes ≈ $1.7, plus red-team and surveyor), against baseline small issues of $3.08 and $3.82 | **Owner decision**: strongest new design point (combined F2) |
| GPT-23 | Measure context before deciding on plugins and connectors | Method | A | §5.1, §8.5 V0, and the D6 trigger already say this | No change |

## What it got wrong or overstated

- **P0-3:** "the setting is not described on the settings page reviewed". True of that page; it is listed in the settings *reference*, which I checked earlier. The underlying risk still stands.
- **Priority inflation:** P0-4 and P0-5 don't meet its own P0 definition ("loss of work, false approval, or a gap in a core safety guarantee") given that the owner merges by hand after G2.
