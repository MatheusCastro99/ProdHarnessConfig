# Trials: third-party skills (D24)

Status: **started 2026-10-27, all trials on at once** (ProdHarnessConfig#2). This is the register: what each trial is, where it fires, what it's judged on, and a log row per issue. Costs come from `research/scripts/cost.js` on the session transcripts at list price; the transcripts stay out of git.

## Policy (D24)

- **No third-party process frameworks** (Superpowers, GSD). The harness's skills are the process.
- **Third-party skills come in vendored and pinned:** copied under `projects/<p>/vendor/skills/<name>/`, unmodified, with their license, and listed in `install.json`'s `vendoredSkills` with source, commit and license. The installer installs them and tracks them in the manifest, so a local edit is flagged. The whole skill is read before it's vendored.
- **No third-party hooks, scripts or binaries.** An idea taken from a third-party skill is rewritten in our own words in our own skills, with its source named here.
- **Each trial is measured and kept only if it pays,** by the rule written below before any data came in.

## Why all at once

The owner's call (2026-10-27): the trials would end up together in the final configuration, so testing them one by one would measure a configuration we'll never run. Most trials fire on different kinds of issue anyway (T5 on auth, T6 and T7 on UI), so attribution comes from three rules:

1. Each G2 finding names its **Source**: `red-team`, `red-team T4`, `security-review T5`, `PR comment` or `reviewOnReady`.
2. Each trial's own step is priced separately from the transcripts.
3. The log below records which trials fired on each issue.

**Baseline:** the pilot's issues under the configuration before D23 and D24. Standard #72 ($5.16) and #73 ($4.80); Small #134 ($2.23), #68 ($2.91) and #120 ($3.93). D23 (surveyor in Block A only) lands at the same time, so a cost change can't be credited to a trial alone.

## The trials

| ID | What | Taken from | Where it fires | Judged on | Keep rule (set 2026-10-27) |
|---|---|---|---|---|---|
| **T1** | The smallest complete change: not needed → already in the codebase → standard library or platform → installed dependency → new code. Never cut validation, error handling, security or accessibility. | Ponytail's rules ([DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) @ `09c434a`, MIT), rewritten | `scope`'s plan rules; every issue with code | Diff size (`git diff --shortstat`), planning cost, red-team findings about missing or excess code, escapes | Kept unless a blocking finding or an escape traces to something T1 skipped, or median planning cost rises by more than $0.20 against #72 and #73 ($1.36, $1.61), over the Schema epic |
| **T4** | An error-handling lens in the red-team brief: empty or broad catches, errors logged and ignored, success or a default returned on failure, errors that don't tell the user what went wrong | `pr-review-toolkit`'s `silent-failure-hunter` ([anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) @ `41f619d`, Apache-2.0), rewritten | `review`'s red-team brief, when the change touches error handling, validation or fallbacks. First: #69 | Fix-worthy findings tagged `red-team T4`; red-team cost per run | Kept if at least one fix-worthy T4 finding over the Schema epic (#69, #70, money in cents), and red-team cost per run rises no more than 25% |
| **T5** | The built-in `security-review` skill as a second pass | Claude Code (built-in) | `review`, when the issue touches auth, sessions, secrets, permissions or access to user data. First: the Authentication epic | Findings tagged `security-review T5` that the red-team didn't also report; the pass's cost | Kept if it finds at least one real issue (fixed, or accepted by the owner) the red-team missed over the auth epic; otherwise dropped if it costs more than $0.50 per issue |
| **T6** | The UI check: the app driven through the platform's built-in UI automation (on Windows, PowerShell `UIAutomationClient`), plus window screenshots under `.harness/work/<n>/ui/`, listed in the handoff | BabyBuddyHelper's own practice (since #93) | `scope` plans it for each UI sub-phase; `build` runs it. First: the UI overhaul epic | Rounds of owner UI adjustments after G2 (baseline #96: 2), owner turns at G2, the check's cost | Kept if the median after G2 is at most 1 round of owner UI adjustments over the UI epic |
| **T7** | `frontend-design`, vendored unmodified | [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official/tree/41f619d61b999adec1a1c8deb97d1a5b6ac35bb6/plugins/frontend-design/skills/frontend-design) @ `41f619d`, Apache-2.0 | InvoiceMe only: `scope` plans the design with it, `build` follows it, on UI sub-phases. The issue and `UI_Guidelines` are its brief | G2 UI findings, owner design rejections, conflicts with `UI_Guidelines` | Kept if no conflict with the UI guidelines stays unresolved, and owner adjustment rounds aren't above T6's median |

**Open on T6:** BabyBuddyHelper's how-to (DPI awareness, maximizing, contact sheets for animation, read-only on the owner's database) lives in its memory. InvoiceMe is a web app, so its first UI issue has to settle how the check drives a browser window, against test data only, and record it in the project's `ux-design` skill.

## Considered and not trialled

| Skill | Why not |
|---|---|
| Superpowers, GSD | Process frameworks that duplicate `scope` / `build` / `review` and would compete with CLAUDE.md. Superpowers' "reproduce first" is already InvoiceMe's practice (#69 and #70's `test.failing` markers) |
| Caveman | Output prose was about 18% of cost in #28, code is left uncompressed, and thinking isn't affected; independent tests found 1–3% off the bill. Our prose is the product: plans, handoffs, G2 reports, issue comments |
| Graphify | Our repos are small (#73's survey read the whole API in 17k tokens, $0.29); a generated graph goes stale, and it needs Python |
| Impeccable (as T7) | Its setup runs a launcher that downloads a binary on first run, and its skill folder ships about 2 MB of scripts. That breaks the policy. `frontend-design` took its place |
| `security-guidance` plugin | Needs Python (not installed), and runs an Opus review at every turn's end and every commit |
| Trail of Bits `dimensional-analysis`, `property-based-testing`; Playwright CLI | Proposed, not approved for this round. Trail of Bits' skills are CC-BY-SA-4.0, so a vendored copy would need the same license |

## Log

One row per issue run under D24. Trial cost is the trial's own step, priced from the transcript.

| Issue | Repo | Tier | Trials fired | Trial cost | Findings by source | Owner turns | Cost | Notes |
|---|---|---|---|---|---|---|---|---|
