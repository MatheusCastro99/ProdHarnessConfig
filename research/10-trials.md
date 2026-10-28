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
| #133 | BabyBuddyHelper | Standard | T1 (nothing to cut); T4 and T5 skipped, as the brief says; T6 and T7 don't apply | none (T1 is a plan rule) | `red-team` 1 low, deferred to #150; `reviewOnReady` 0 | ≈ 7 | $6.03 | A pure move: 25 files, 70 changed. See Runs |
| #150 | BabyBuddyHelper | Small | T1 (nothing to cut); T4, T5, T6 and T7 don't apply | none | `red-team` 2 (7, 5), both fixed, 1 adjacent declined; `reviewOnReady` 0 | ≈ 6 | $3.83 | The fork called the run Standard: one extra owner turn. See Runs |
| #69 | InvoiceMe | Standard | T1; **T4 fired**; T5 skipped, as the review says | red-team first run $0.61 with the T4 lens | `red-team T4` 2 (7, 5), both fixed; `red-team` 2 out of scope, now #144 and #145 | ≈ 7 | $5.36 | The first T4 run. See Runs |
| #137 | InvoiceMe | Standard | T1; **T4 fired**; **T6 fired** (early: a client sub-phase); T5 skipped; T7 skipped, as the plan says | UI check $0.54 (builder); red-team first run $0.82 with the T4 lens | `red-team T4` 1 (6), fixed; `red-team` 1 (6) left to the owner, done by them; 1 adjacent (2), fixed | ≈ 7 | $6.26 | Server, client and docs together. See Runs |
| #138 | InvoiceMe | Standard | T1; **T4 fired**; **T6 fired**; T5 skipped; **T7 not planned, with no reason given** | UI check $0.77 (builder); red-team first run $0.78 with the T4 lens | `red-team T4` 1 (6), fixed; `red-team` 3 adjacent, declined; re-review 1 (4), left | ≈ 7 | $6.43 | A new date picker on a UI sub-phase, without `frontend-design`. See Runs |
| #139 | InvoiceMe | Standard (asked as Small; `scope` pushed back) | T1; **T4 fired, 0 findings**; **T6 fired** (browser, not the plan's `UIAutomationClient`); T5 skipped; T7 skipped with a reason | UI check $0.69 (builder); red-team first run $0.67 with the T4 lens | `red-team` 3 (7, 7, 5), all fixed; 2 adjacent: 1 now #149, 1 declined | ≈ 9 | $5.99 | No surveyor ran. "continue 139" didn't start the build: one extra owner turn. See Runs |
| #149 | InvoiceMe | Small (kept after 5 G1 decisions) | T1; **T4 fired**; **T6 fired, in the Opus main session** on the owner's dev database; T5 skipped; T7 not mentioned | UI checks $2.91 (main session, Opus); red-team first run $0.75 with the T4 lens | `red-team T4` 1 (9), fixed; `red-team` 2 (7, 6), fixed; 2 declined, then #151 | ≈ 8 | $7.80 | The dearest run so far, and the first over 200k context (221k). The tier slip recurred. See Runs |
| #151 | InvoiceMe | Small | T1; **T4 fired** (1 low, declined); **T6 fired, in the Opus main session**, writing to the owner's dev database and undoing it; T5 skipped; T7 not mentioned | UI check $1.85 (main session, Opus); red-team $0.28 | `red-team T4` 1 (low), declined; `red-team` 1 (low) and `scope` 2, to backlog #153 | ≈ 5 | $4.88 | A 5-line diff. The UI check was 38% of the cost. See Runs |

## Batch comparison

The eight issues, all run under D23 and D24 on harness `51aa524`, against the configuration before them. All prices are list prices from the transcripts.

| | Before D23/D24 | #133 BBH | #150 BBH | #69 IM | #137 IM | #138 IM | #139 IM | #149 IM | #151 IM |
|---|---|---|---|---|---|---|---|---|---|
| Tier | Standard: #72 $5.16, #73 $4.80. Small: #134 $2.23, #68 $2.91, #120 $3.93 | Standard | Small | Standard | Standard | Standard | Standard | Small | Small |
| Diff | #72, #73: about 20–25 changed files | 70 files, +294 / −184, a pure move | 20 files, +34 / −23, a pure move | 15 files, +259 / −41 | 18 files, +243 / −82, server, client and docs (plus the owner's 1-line ADR edit) | 15 files, +199 / −61, server, client and docs | 15 files, +146 / −36, server, client and docs | 6 files, +75 / −32, client and docs | 3 files, +3 / −2, client and docs |
| Planning (A, with the surveyor) | $1.36, $1.61 | $1.69 | $1.12 (no surveyor) | $1.68 | $1.66 | $1.84 | $1.30 (no surveyor) | $1.17 (no surveyor, 2 G1 rounds) | $1.12 (no surveyor) |
| Build: main session + builder | $0.56 + $1.05, $0.52 + $0.73 | $0.46 + $1.53 | $0.25 + $0.59 | $0.45 + $0.82 | $0.47 + $1.85 (UI check $0.54 of it) | $0.49 + $1.88 (UI check $0.77 of it) | $0.47 + $1.78 (UI check $0.69 of it) | $0.21 + $0.64 | $0.09 + $0.37 |
| UI check in the main session (Opus) | — | — | — | — | — | — | — | $2.48 + $0.43 re-check | $1.85 |
| Red-team runs | $0.93 (2 runs), $0.71 (1 run) | $1.18 (1 run) | $0.41 + $0.29 re-review | $0.61 + $0.22 re-review | $0.82 + $0.11 re-review | $0.78 + $0.15 re-review | $0.67 + $0.14 re-review | $0.75 + $0.24 re-review | $0.28 (1 run) |
| Review + fixes + close, main session | $1.27, $1.24 | $1.17 | $1.17 | $1.58 | $1.35 | $1.28 | $1.62 (with opening #149) | $2.07 (with opening #151) | $1.17 (with opening #153) |
| **Total** | **$5.16, $4.80** / **$2.23, $2.91, $3.93** | **$6.03** | **$3.83** | **$5.36** | **$6.26** | **$6.43** | **$5.99** | **$7.80** | **$4.88** |
| G2 fix round | #72: 1; #73: none | none | 1 (2 doc lines) | 1 (2 code fixes) | 1 (2 doc lines) | 1 (1 doc line) | 1 (2 doc lines, 1 code fix) | 1 (2 code fixes, 1 doc fix) | none |
| Owner turns | ≈ 7–8 / ≈ 4–5 | ≈ 7 | ≈ 6 (5 without the tier slip) | ≈ 7 | ≈ 7 | ≈ 7 | ≈ 9 (7 without the build prompt and the follow-up question) | ≈ 8 (7 without the tier slip) | ≈ 5 |
| Peak context | 126k, 123k / 125k | 136k (builder) | 150k (one session) | 129k | 172k (builder, after the UI check) | 167k (builder, after the UI check) | 158k (builder, after the UI check) | **221k** (one session) | 189k (one session) |

**Reading it:**
- **Standard runs cost about the same as before, on harder or larger work.**
  - #69 cost $5.36 against $4.80–5.16. That included a G2 fix round with a re-review ($0.94), and #73 had no fix round.
  - #133 cost $6.03 on a diff three times the size of #72's or #73's.
  - #137 cost $6.26, #138 $6.43 and #139 $5.99, the three most after #133, and the reason is visible: all three ran a UI check (T6, $0.54, $0.77 and $0.69 in the builder) and all three touched server, client and docs at once. Without their UI checks they would have cost $5.72, $5.66 and $5.30. #137's red-team ($0.82) did more than read: it ran the real `server.js` against a database holding a duplicate.
  - T4's first runs ($0.61, $0.82, $0.78, $0.67) average $0.72, against $0.71 for #73's single run.
- **#150 was the second most expensive Small run so far, after #120 ($3.93), for two reasons.**
  - It had a fix round with a re-review: $0.62.
  - The single session grew to 150k, so every call after G1 read 125–150k tokens at Opus rates.
  - Its build ($0.84 in all) was in line with #134's ($0.79).
- **Small broke on InvoiceMe: #149 cost $7.80 and #151 $4.88, for diffs of 107 and 5 lines.** #149 is the dearest run under the harness, above the Standard ceiling of $7.49, and the first over 200k context. The cause is one thing: on Small, `scope` planned the UI check for the main session ("driven by the main session from the build's `MAIN SESSION:` line"), so it ran on Opus at 120–220k context. The UI checks cost $2.91 and $1.85, 37% and 38% of each run; the builders' checks on #137–#139 cost $0.54–0.77 on Sonnet. Without them, #149 would have cost $4.89 and #151 $3.03, in the range of the earlier Small runs. Small's single long session (D18) multiplies the cost of anything heavy after G1, and a browser check is heavy.
- **Planning cost (T1's rule):** the Schema epic's median is now $1.67 (#69 $1.68, #137 $1.66, #138 $1.84, #139 $1.30), against the baseline median of $1.49. That's $0.18 more, under the $0.20 limit. #138's planning included two time-zone experiments in Node and 3 G1 decisions. #139's was the cheapest, without a surveyor (see its findings). #140 and #141 decide it. #133's $1.69 is BabyBuddyHelper and outside the rule.
- **T4 has met the first half of its keep rule:** 5 fix-worthy findings over 6 issues, all fixed, the highest of them #149's (score 9). On #139 the lens ran and reported no silent failures, naming the three paths it checked; on #151 it found one low race, declined. Its cost half holds: the red-team's first Standard runs average $0.72, 1% above #73's $0.71. #140 is the last Schema issue the rule counts.
- **T6 has run five times, all early,** on client sub-phases before the UI epic, and no run had owner UI adjustments after G2. But it ran two ways:
  - **On Standard (#137–#139), in the builder:** Sonnet, a throwaway in-memory database, $0.54–0.77 (median $0.69), builder peaks of 158–172k.
  - **On Small (#149, #151), in the Opus main session:** the owner's local dev database, $1.85–2.91. #149's check wrote nothing. #151's plan, approved at G1, edited a customer's email and put it back; the save also rewrote that customer's phone to the new 10-digit form, which the G2 report told the owner. `build`'s step 3 says never to change the owner's real data while driving the app, and the Standard builders' throwaway database shows it can be done.
  - The pane failed to draw the PDF on #137 and #138, and the table on #138. On #139 the plan asked for `UIAutomationClient`, copied from `scope`'s rule, and the builder used the browser instead.
- **T7 has not run yet.** #137's and #139's plans skipped it with a reason ("nothing visual is redesigned"). #138, #149 and #151 changed UI sub-phases, and their plans don't mention `frontend-design` at all, though `scope` says to plan the design with it. Proposal 4 covers it.
- **T5 hasn't fired yet.** It waits for the auth epic.
- **The surveyor (D23):** the four planning sessions that read the code themselves (#150, #139, #149, #151) cost $1.12–1.30; the four with a surveyor cost $1.66–1.84. `scope`'s step 3 allows reading directly "when the issue names only a few files", on either tier, so the split follows the issues' size, and the cheaper ones were also the smaller issues. That's not evidence against the surveyor yet, but the meta-analysis should compare the main session's planning cost with and without it on issues of the same size.

## Runs

### BabyBuddyHelper #133 Core feature subfolders (Standard), PR #149

The first issue run under D23 and D24 (harness `51aa524`). It was a refactor:
- 25 files in `Core/Interfaces`, `Models` and `Services` moved into `Baby`, `TaskList`, `Vaccine` and `Cub` subfolders, with namespaces following the folders.
- About 41 other files had their `using` lines rewritten.
- ADR-015 was amended.

It was mechanical, but it is the largest diff under the harness so far: 70 files, +294 / −184, in 3 commits.

| Block | Transcript | Model | Calls | Context: first → peak | Time | Cost |
|---|---|---|---|---|---|---|
| A `/scope` | 7b088392 | Opus 5.5 | 21, plus 8 surveyor (Sonnet, peak 43k, $0.25) | 77k → 121k | 10 min | $1.69 |
| B `build`: the main session | 150d760d | Opus 5.5 | 9 | 74k → 85k | 17 min | $0.46 |
| B `build`: the forked builder | 150d760d/subagents | Sonnet 5.5 | 50 | 58k → 136k | (same) | $1.53 |
| C `/review` to G2 | 71772a35 | Opus 5.5 | plus 31 red-team (Opus, peak 89k, $1.18) | 76k → 93k | 7 min | $1.81 |
| C: mark ready, CI reviewer, merge note | 71772a35 | Opus 5.5 | | | 5 min | $0.27 |
| C `/close` | 71772a35 | Opus 5.5 | 27 main calls across all of C | → 104k | 1 min | $0.26 |
| **Total** | | | | | ≈ 45 min | **$6.03** |

**Against the targets:**
- **Cost:** $6.03. That is under §8.4's $7.49 and above #72 ($5.16) and #73 ($4.80), on a diff about three times their size.
- **Context:** the peak was 136k, in the builder, under 200k. Each session started at 74–77k before the first prompt.
- **Owner turns:** ≈ 7, the desktop floor. They were `/scope`, the G1 answers (4 decisions in one prompt), the G1 accept, "continue 133", `/review`, one G2 reply and `/close`.
- **Quality:**
  - The red-team approved with one low finding: the subfolder rule isn't in CLAUDE.md's placement rule. The owner deferred it to follow-up #150.
  - The CI reviewer had no comments, and there was no fix round.
  - Escapes are tracked to 2026-11-24.

**Findings:**
1. **The cost went where a mechanical issue should put it.**
   - Opus planned the issue, including 4 real G1 decisions. One of them was a trap: a `Task` namespace would hide .NET's `Task` type (CS0118).
   - Opus also reviewed. The red-team checked the imports of all 97 `.cs` files with its own script.
   - Sonnet did the volume. The builder wrote a throwaway script for the `git mv`, namespace and `using` rewrites instead of making 66 edits by hand.

   Standard was the right tier: the size was mechanical, but the 4 decisions and the ADR change were not.
2. **D23 held.** The surveyor ran only in Block A, and the builder did its own reading without a subagent. The handoff was complete, so the review didn't need the `git log --stat` fallback.
3. **The trials had almost nothing to do, and that is correct.**
   - **T1:** its ladder has little to say about a pure move. The plan's Rejected approaches still named the churn it skipped: file-scoped namespaces and `global using` lines.
   - **T4 and T5:** the review's brief skipped both, with the reason "No error-handling or security surface is touched", as the conditions require.
   - **T6 and T7:** there was no UI change, and T7 is InvoiceMe only.

   So #133 says nothing about the trials' value. It only shows that the conditional trials stay off when they should.
4. **Two small things, with no change needed yet:**
   - **Order of steps:** Block B's main session read the work folder, the issue and `scope`'s SKILL.md before invoking `build`, though the plan's step 0 says to invoke it first. This cost about $0.10. Watch for it on the next issue.
   - **A missed BOM:** the builder's script missed the BOM in two model files, which the plan had named. The namespace check caught it. Sub-phase 1 was already committed, so the builder reset its own uncommitted sub-phase (`git reset --hard HEAD`) and ran the fixed script again. That was safe here, and the plan's note did its job.

### BabyBuddyHelper #150 Mirror the Core feature subfolders in the test project (Small), PR #151

The follow-up from #133. 17 test files moved into feature subfolders, plus a new `Remote/` folder. Both standing rules got the owner's wording. The tier was asked at G1 together with 3 other decisions, and the owner chose Small. Everything ran in one desktop session, d4e9e1b0, over 36 minutes.

| Part | Model | Calls | Context peak | Cost |
|---|---|---|---|---|
| Plan mode to the G1 accept | Opus 5.5 | 16 | 117k | $1.12 |
| Build: the main session around the fork | Opus 5.5 | 6 | 125k | $0.25 |
| Build: the forked `builder` | Sonnet 5.5 | 14 | 87k | $0.59 |
| Review to G2: main session | Opus 5.5 | 7 | 136k | $0.36 |
| Review to G2: red-team | Opus 5.5 | 10 | 44k | $0.41 |
| Fix round: main session | Opus 5.5 | 8 | 143k | $0.33 |
| Fix round: red-team re-review (resumed with SendMessage) | Opus 5.5 | 3 | 49k | $0.29 |
| Mark ready, CI reviewer, merge note | Opus 5.5 | 8 | 147k | $0.30 |
| `/close` | Opus 5.5 | 4 | 150k | $0.18 |
| **Total** | | 76 | | **$3.83** |

**Against the targets:**
- **Cost:** $3.83, against the Small median of $2.91 (#134, #68, #120). See the batch comparison.
- **Context:** the peak was 150k, under 200k. The session started at 77k.
- **Owner turns:** ≈ 6, met against Small's ≤ 6. They were `/scope`, the G1 answers, the G1 accept, "Run /review 150 in this session", the G2 reply and `/close`. The fourth one shouldn't have been needed (finding 1).
- **Quality:** the red-team found 2 doc gaps (scores 7 and 5), both fixed in one commit, and one adjacent note the owner declined. The narrow re-review found nothing new, and the CI reviewer had no comments. Escapes are tracked to 2026-11-24.

**Findings:**
1. **The fork ignored the plan's tier.** The plan's first line and its Scope both say `Tier: Small`, and the builder printed the plan before starting. Its reply still followed `build`'s Standard instruction: "start Block C in a fresh session … then `/review 150`". It left out the Small line, `MAIN SESSION: run the review skill … (Small tier, this session)`. The main session saw the mismatch and asked the owner, which cost one owner turn. This is D22's hand-back failing on the model's side, not in the design. A fix is proposed below.
2. **A resumed red-team is not cheaper than a fresh one.** The re-review resumed the first red-team with SendMessage more than 5 minutes later, so its 44k context was written to the cache again: $0.29 for 3 calls. #69's fresh, narrow re-review cost $0.22. No change needed.
3. **The single session's long tail.** Everything after G1 ran at 125–150k context on Opus, and the main session cost $1.42 there across 33 calls. That is the known cost of Small (D18), and it was still cheaper than a second session's start plus an owner turn. No change.

### InvoiceMe #69 API returns 500 for client errors (Standard), PR #143

The first issue of the Schema epic (#136), and the first with T4's conditions. It made the validators and the tax controller reject wrong types instead of throwing. `errorMiddleware` now maps Mongoose cast and validation errors to 400 and duplicate keys to 409, and stops leaking messages on a 500. A disallowed CORS origin answers 403. 11 `test.failing` markers were flipped. Three commits came from the build and two from G2 fixes. The diff is 15 files, +259 / −41.

| Block | Transcript | Model | Calls | Context: first → peak | Cost |
|---|---|---|---|---|---|
| A `/scope` | 5215caf8 | Opus 5.5 | 17, plus 10 surveyor (Sonnet, peak 48k, $0.25) | 76k → 129k | $1.68 |
| B `build`: the main session | cbbdf19f | Opus 5.5 | 9 | 74k → 84k | $0.45 |
| B `build`: the forked builder | cbbdf19f/subagents | Sonnet 5.5 | 45 | 58k → 114k | $0.82 |
| C `/review` to G2 | 61e37daf | Opus 5.5 | 9, plus 15 red-team (Opus, peak 52k, $0.61) | 76k → 94k | $1.22 |
| C: the G2 fixes and a narrow re-review | 61e37daf | Opus 5.5 | 18, plus 8 red-team ($0.22) | → 115k | $0.94 |
| C `/close` | 61e37daf | Opus 5.5 | 6 | → 121k | $0.25 |
| **Total** | | | | | **$5.36** |

The epic planning session before it (bfdc4df0, which split epic #136 into its issues) isn't part of #69 and isn't counted.

**Against the targets:**
- **Cost:** $5.36, under $7.49.
- **Context:** the peak was 129k, and each session started at 74–76k.
- **Owner turns:** ≈ 7, the desktop floor. They were `/scope`, the G1 answers (3 decisions, each the recommended option), the G1 accept, "continue 69", `/review`, the G2 reply and `/close`.
- **Quality:** the red-team approved with 2 findings, both tagged `red-team T4`, scored 7 and 5, and both fixed at G2. It also found 2 out-of-scope issues in code this PR didn't change, which became #144 and #145. The owner accepted the open email-limit gap under the pending ADR-003. InvoiceMe has no CI reviewer configured. Escapes are tracked to 2026-11-24.

**Findings:**
1. **T4 earned its place on its first run.**
   - **Finding 1:** Express's URI decode failure sets only `err.status`, so it still answered 500, now with the generic message. It was fixed with `err.statusCode || err.status || 500`.
   - **Finding 2:** the refused CORS origin was no longer logged anywhere. It's now logged on the server only.

   Both are "an error that doesn't say what went wrong", the lens's own wording.

   **Caveat for attribution:** Opus wrote the brief, and it added a pointed hint to the lens: "body-parser's `status` vs `statusCode`". So finding 1 is credited to the T4 lens as briefed, not to its wording alone. That's how the trial runs in practice, and it should be counted that way.
2. **T1 left visible marks in the plan.** The plan rejected a per-route `isValidObjectId` middleware (it would duplicate the `CastError` mapping) and a test-only model for E11000 (a unit test is enough until #137). It also named 3 gaps it left alone. The red-team found no missing or excess code. A2, `calculateTax`'s `parseFloat`, was in code the plan didn't name; it isn't traceable to a T1 skip.
3. **T5 was skipped correctly and said why.** The review noted that the CORS change alters only the status a refused origin gets, not which origins are allowed.
4. **Block B's main session read before invoking `build` again:** the work folder, `gate.json` and the issue, about $0.05–0.10. This is the second Standard run in a row (#133). After `/clear`, "continue <n>" gives the main session nothing but the number, so it looks for the plan before it finds step 0. The cost is small; a one-line fix is noted below.

### InvoiceMe #137 Customer integrity: normalized phone numbers and a capped page size (Standard), PR #146

The second issue of the Schema epic. It also closed #144. The customer's `phoneNumber` is now stored as 10 digits, with a model setter, controller normalization and a `unique` index. `server.js` builds the index before listening and exits if it can't. The customer list caps `limit` at 100, and an invalid `page` or `limit` falls back to the default. On the client, the phone check now uses the server's pattern, and every display site formats the number through a new `phone.js`. The 3 `#70` markers in `customers.test.js` were flipped. Three commits came from the build and one from G2 fixes; the owner added a fifth, a one-line ADR-003 edit. The harness's diff is 18 files, +243 / −82.

| Block | Transcript | Model | Calls | Context: first → peak | Time | Cost |
|---|---|---|---|---|---|---|
| A `/scope` | c053df86 | Opus 5.5 | 16, plus 11 surveyor (Sonnet, $0.27) | 76k → 124k | 10 min | $1.66 |
| B `build`: the main session | 46afb955 | Opus 5.5 | 9 | 74k → 86k | 13 min | $0.47 |
| B `build`: the forked builder | 46afb955/subagents | Sonnet 5.5 | 79, of which 25 for the UI check ($0.54) | 58k → 172k | (same) | $1.85 |
| C `/review` to G2 | 2cd3c633 | Opus 5.5 | 10, plus 15 red-team (Opus, $0.82) | 76k → 94k | 5 min | $1.45 |
| C: the G2 fixes and a narrow re-review | 2cd3c633 | Opus 5.5 | 8, plus 4 red-team ($0.11) | → 103k | 2 min | $0.39 |
| C: mark ready, merge note | 2cd3c633 | Opus 5.5 | 5 | → 105k | 1 min | $0.15 |
| C `/close` | 2cd3c633 | Opus 5.5 | 7 | → 113k | 1 min | $0.29 |
| **Total** | | | | | ≈ 35 min | **$6.26** |

**Against the targets:**
- **Cost:** $6.26, under $7.49.
- **Context:** the builder peaked at 172k, under 200k but the closest yet. The screenshots added about 25k. The main sessions stayed at 124k or below.
- **Owner turns:** ≈ 7, the desktop floor. They were `/scope`, the G1 answers (3 decisions in one prompt), the G1 accept, "continue 137", `/review`, the G2 reply and `/close`.
- **Quality:** the red-team approved with 3 non-blocking findings. Two were fixed at G2 in one commit, and the owner made the third themself before merging (ADR text is theirs, agreement 9). The narrow re-review found nothing new. InvoiceMe has no CI reviewer configured. Escapes are tracked to 2026-11-24.

**Findings:**
1. **T4 found one more real gap, and its lens drove a check the handoff had skipped.**
   - **Finding 2, `red-team T4`, score 6:** the API reference said a phone in any format matches another customer's. That holds only for rows saved from v1.23 on, so against the owner's real data a duplicate could still be created without an error until #141. It was fixed with one clause. It is a doc finding, but it is the lens's "success returned on failure" case, and it could happen today.
   - The brief's T4 paragraph named the start-up error path. The red-team ran the real `server.js` against a database with an exact duplicate, and confirmed it logs the cause and exits with code 1 without listening. The handoff hadn't run that path. That counts as coverage, not as a finding.
   - **Caveat for attribution, as on #69:** Opus wrote the brief, and it listed specific suspects under the lens (setter behaviour on update paths, non-string phones). Finding 2 wasn't one of them.
2. **T6's first run on a web app settled the open "how".** The builder drove the app in Claude's built-in browser, against a throwaway in-memory MongoDB, never the owner's `.env`. It saved 3 screenshots to `.harness/work/137/ui/` and listed them under the handoff's Checks. Two limits: the PDF viewer rendered blank, so the PDF line was checked through the component tree; and the method is recorded only in this handoff, not yet in InvoiceMe's `ux-design` skill, as the register's open note asks. A change is proposed below.
3. **T1 left marks again.** The plan rejected a typed-plus-normalized field and a 400 for a bad `limit`, both by owner decision, and named 4 gaps it left alone (old rows, the invoice's phone copy, pagination UI, the 409 toast). The red-team found no missing or excess code.
4. **T7 stayed off for a stated reason.** The plan said the change alters text formats, not styles, so `frontend-design` had nothing to plan. The builder used the project's own `ux-design` skill for the hint's wording instead; that skill isn't a trial.
5. **Block B's main session read before invoking `build` for the third Standard run in a row:** the work folder and the issue twice, about $0.09 above the session's unavoidable first cache write. This supports proposal 2 below.

### InvoiceMe #138 Date of service as a calendar date (Standard), PR #147

The third issue of the Schema epic, ADR-013's first half. The API's `dateOfService` is now a required `Date` stored at UTC midnight. A new validator accepts only a real calendar date written `YYYY-MM-DD`, and a `toJSON` transform answers that form on every path, whatever the server's time zone. The invoice page enters the date with MUI's `DatePicker`, which was already installed. The table, its month filter and the PDF show `MM/DD/YYYY` from the string, with no time-zone shift, through a new `date.js` that mirrors the server's rule. One `#70` marker was flipped. Two commits came from the build and one from G2. The diff is 15 files, +199 / −61.

| Block | Transcript | Model | Calls | Context: first → peak | Time | Cost |
|---|---|---|---|---|---|---|
| A `/scope` | 7b943934 | Opus 5.5 | 21, plus 8 surveyor (Sonnet, $0.22) | 76k → 129k | 10 min | $1.84 |
| B `build`: the main session | c8aab726 | Opus 5.5 | 10 | 74k → 87k | 15 min | $0.49 |
| B `build`: the forked builder | c8aab726/subagents | Sonnet 5.5 | 86, of which 39 for the UI check ($0.77) | → 167k | (same) | $1.88 |
| C `/review` to G2 | def6aecf | Opus 5.5 | 9, plus 12 red-team (Opus, $0.78) | 76k → 94k | 5 min | $1.34 |
| C: the G2 fix and a narrow re-review | def6aecf | Opus 5.5 | 6, plus 7 red-team ($0.15) | → 102k | 2 min | $0.42 |
| C: mark ready, merge note | def6aecf | Opus 5.5 | 4 | → 104k | 1 min | $0.14 |
| C `/close` | def6aecf | Opus 5.5 | 8 | → 113k | 1 min | $0.32 |
| **Total** | | | | | ≈ 35 min | **$6.43** |

**Against the targets:**
- **Cost:** $6.43, under $7.49.
- **Context:** the builder peaked at 167k after the UI check; the main sessions stayed at 129k or below.
- **Owner turns:** ≈ 7, the desktop floor. They were `/scope`, the G1 answers (3 decisions), the G1 accept, "continue 138", `/review`, "Fix 1, keep ADR" and `/close`.
- **Quality:** the red-team approved with one fix-worthy finding, fixed in one line, and three adjacent findings in older code, which the owner declined for this PR. The narrow re-review found a stale code comment (priority 4) and left it, under the one-re-review rule. InvoiceMe has no CI reviewer configured. Escapes are tracked to 2026-11-24.

**Findings:**
1. **T4 found its fourth fix-worthy gap, but the brief pointed at it.** Finding 1, `red-team T4`, score 6: the API reference said an old non-date row "still lists" without saying its answer leaves out `dateOfService`. That's "success returned on failure" again, in the docs. **Caveat for attribution:** the brief told the red-team to check "the handoff's claim that Mongoose omits an uncastable stored value", so the handoff found the behaviour and the lens judged it. It is credited to T4 as briefed, the same as on #69 and #137.
2. **T7 didn't run where its rule says it should.** Sub-phase 2 replaced a text input with a `DatePicker`, a new control on the invoice page. `scope` says a UI sub-phase plans its design with `frontend-design` when the project has one. The plan doesn't name it, and neither the plan nor the builder gives a reason. #137's plan said why it was skipping T7; #138's said nothing. The picker copies the pattern `TableInvoice.jsx` already uses, and the owner made no UI adjustments, so nothing went wrong this time. But the trial can't be judged on runs where it is silently left out. A change is proposed below.
3. **T6 ran a second time, with the same blind spot.** The builder checked the page in the browser against a throwaway in-memory database and saved 2 screenshots. The pane drew neither the PDF nor the table, and the browser ran only in New York's time zone, so a zone ahead of UTC was checked by a Node script, not on screen. The handoff and G2 both said so, and G2 asked the owner to look at the PDF and table locally. This check cost $0.77, 41% of the builder.
4. **Two adjacent findings are real but not tracked.** A1: a failed save on the PDF page shows axios's generic message instead of the server's errors, which matters once #139 adds a 409. A2: blurring the invoice-number field crashes when no invoice exists yet, which hits a new user on their first invoice. The owner declined both for this PR, and neither is an issue yet. G2 suggested #139 for both. (Both were done in #139.)
5. **Block B's main session read before invoking `build` for the fourth Standard run in a row:** the work folder, `gate.json`, the issue and `build`'s own SKILL.md, about $0.12 above the first cache write. Proposal 2 below covers it.

### InvoiceMe #139 Unique invoice numbers (Standard), PR #148

The fourth issue of the Schema epic, and the last of #70's three: #70 closed with it. The API's `invoiceNumber` is now required, trimmed and unique, through a partial index that skips old rows without a number. The server builds it before listening. A duplicate answers 409 `DUPLICATE_RECORD`, and a blank number 400. The invoice page blocks a blank or duplicate number and warns about a gap or a lower number. The PDF page shows the API's message when a save fails. The last `#70` marker was flipped. #139 also fixed both of #138's untracked adjacent findings: the PDF page's generic error and the crash with no invoices. Two commits came from the build and two from G2. The diff is 15 files, +146 / −36.

| Block | Transcript | Model | Calls | Context: first → peak | Time | Cost |
|---|---|---|---|---|---|---|
| A `/scope` | 9e34fb42 | Opus 5.5 | 17, no surveyor | 77k → 125k | 8 min | $1.30 |
| B: "continue 139", answered without building | 8b0e861e | Opus 5.5 | 3 | 74k → 80k | 1 min | $0.28 |
| B `build`: the main session | 8b0e861e | Opus 5.5 | 7 | → 84k | 10 min | $0.18 |
| B `build`: the forked builder | 8b0e861e/subagents | Sonnet 5.5 | 84, of which 36 for the UI check ($0.69) | 58k → 158k | (same) | $1.78 |
| C `/review` to G2 | 191f2da5 | Opus 5.5 | 9, plus 11 red-team (Opus, $0.67) | 76k → 95k | 5 min | $1.28 |
| C: the G2 fixes, a narrow re-review, mark ready | 191f2da5 | Opus 5.5 | 15, plus 5 red-team ($0.14) | → 109k | 3 min | $0.69 |
| C: opening follow-up #149 | 191f2da5 | Opus 5.5 | 5 | → 112k | 1 min | $0.17 |
| C `/close` | 191f2da5 | Opus 5.5 | 7 | → 121k | 1 min | $0.29 |
| **Total** | | | | | ≈ 31 min | **$5.99** |

**Against the targets:**
- **Cost:** $5.99, under $7.49.
- **Context:** the builder peaked at 158k after the UI check; the main sessions stayed at 125k or below.
- **Owner turns:** ≈ 9, two above the desktop floor. They were `/scope 139 small`, the G1 answers (4 decisions, the tier among them), the G1 accept, "continue 139", "Yes, start build", `/review`, "Apply 1–3", "Open the issue" and `/close`. The fifth shouldn't have been needed (finding 1). The eighth answered a question the G2 report had already asked; the owner's "Apply 1–3" didn't answer it, so the session asked again.
- **Quality:** the red-team approved with 3 fix-worthy findings (7, 7, 5). All were fixed in two commits, and the narrow re-review found nothing new. Of the two adjacent findings, one became #149 and the owner declined the other. InvoiceMe has no CI reviewer configured. Escapes are tracked to 2026-11-24.

**Findings:**
1. **"continue 139" didn't start the build: the step-order slip got worse.** On #133, #69, #137 and #138 the main session read files first and then invoked `build`. On #139 it read the plan, summarized it, and stopped: "I haven't started the build because it only runs when you say so." The owner had to reply "Yes, start build". That cost one owner turn plus $0.28, and the plan's step 0 says to invoke `build` first. Proposal 2 below is now worth doing, not optional.
2. **`scope` refused the wrong tier, as it should.** The owner asked for Small. Before planning, `scope` asked about the tier with the reason: "it changes the schema (a unique index), the public interface (a new 409 answer) and both the API and the frontend". The owner chose Standard. This is the tier rule working at G1.
3. **No surveyor, and the cheapest Schema planning.** `scope` read the code itself in 8 commands, as its step 3 allows when an issue names only a few files, and it didn't run a surveyor after the tier changed. Planning cost $1.30, against $1.66–1.84 with a surveyor. The plan was complete: the red-team's findings were 2 doc lines and 1 trim the builder had already raised. #139 was also the smallest diff of the Schema issues so far, so this is one data point, not a result. It goes to the meta-analysis.
4. **T4's lens ran and found nothing, and said what it checked.** The G2 report lists three error paths the lens cleared: the save toast's fallback on a network error, a failed list load on the invoice page, and the index build failing at start-up. A zero with its evidence is the right output, and T4's count stays at 4 over 4 issues.
5. **T6's plan and `scope`'s rule disagree with practice.** The plan copied `scope`'s wording, "PowerShell `UIAutomationClient` with window screenshots", which fits BabyBuddyHelper's WPF app. The builder drove the browser pane instead, as on #137 and #138, and the handoff listed it as a deviation. It saved 4 screenshots; the lower-number and blank cases were checked from the page's contents. Proposal 3 below now needs a harness change too.
6. **T7 was skipped with a reason.** The plan says `frontend-design` "isn't needed because nothing visual is redesigned". #138's silent skip didn't recur.
7. **The docs gate worked in the fix round.** The first fix commit was blocked until `README.md` and `API_DOCUMENTATION.md` were updated or acknowledged. The session acknowledged both with reasons and committed.

### InvoiceMe #149 Editing an invoice after a failed save starts from an empty form (Small), PR #150

The follow-up from #139's G2. "Edit Invoice" on the PDF page now carries the invoice back to the invoice page in router state, and the page fills itself from it. It selects the customer by `_id`, or by phone for a stored invoice, then reloads the customer's current record and asks the server for the rate and total again. Picking another company after a subtotal now recomputes the total. One commit came from the build and two from G2. The diff is 6 files, +75 / −32. Everything ran in one desktop session, 877b2635, over 40 minutes.

| Part | Model | Calls | Context peak | Cost |
|---|---|---|---|---|
| Plan mode to the G1 accept (2 rounds of questions, 5 decisions) | Opus 5.5 | 17 | 118k | $1.17 |
| Build: the main session around the fork | Opus 5.5 | 5 | 126k | $0.21 |
| Build: the forked `builder` | Sonnet 5.5 | 24 | | $0.64 |
| The plan's browser check, in the main session | Opus 5.5 | 55 | 177k | $2.48 |
| Review to G2: main session | Opus 5.5 | 7 | 188k | $0.44 |
| Review to G2: red-team | Opus 5.5 | 12 | | $0.75 |
| Fix round: main session, with a browser re-check ($0.43) | Opus 5.5 | 22 | 210k | $1.26 |
| Fix round: red-team re-review | Opus 5.5 | 5 | | $0.24 |
| Opening follow-up #151 | Opus 5.5 | 4 | 214k | $0.24 |
| `/close` | Opus 5.5 | 6 | **221k** | $0.36 |
| **Total** | | 157 | | **$7.80** |

**Against the targets:**
- **Cost:** $7.80, against the Small median of $3.37 (#134, #68, #120, #150), and above Standard's $7.49. Without the two browser checks it would have been $4.89.
- **Context:** **221k, over the 200k limit**, the first run to cross it. The session passed 177k during the browser check and never came back down.
- **Owner turns:** ≈ 8, against Small's ≤ 6. They were `/scope 149 small`, two rounds of G1 answers, the G1 accept, "Review here", "As recommended", "Create one follow-up Issue for Leftovers #2 and #3" and `/close`. The fifth shouldn't have been needed (finding 3).
- **Quality:** the red-team approved with 3 fix-worthy findings: a T4 silent failure scored 9, a `DataFlow.md` error (7) and a profile link gap that left one criterion half met (6). All were fixed, the narrow re-review found nothing new, and two low findings became #151. Escapes are tracked to 2026-11-24.

**Findings:**
1. **The owner kept Small, and `scope` didn't revisit it.** `scope` checks the tier at step 2, before the decisions. #149 met the written criteria (one sub-phase, no schema or interface change), so it raised nothing. Then G1 took two rounds and 5 decisions, and the plan added a stale-total fix and a browser check of 5 steps. Nothing in `scope` checks the tier again after the decisions, and the criteria don't count a UI check, though on Small it is the dearest step. Contrast #139, where `scope` pushed back before planning.
2. **The UI check ran in the Opus main session, and that is most of the cost.** The plan routed it there: "driven by the main session from the build's `MAIN SESSION:` line". The builder said it had "no app tools", and asked the main session to run it. That isn't true: on #137–#139 the builder drove the same browser pane. The likely source is CLAUDE.md's line "the fork can't reach the app's tools", which means the PR tools (`build` says "the app's PR tools"). The check ran 55 calls at 126–177k on Opus ($2.48), and the G2 re-check another $0.43. It also ran on the owner's local dev database instead of a throwaway one. It wrote nothing, and it said so.
3. **The tier slip recurred.** The builder's reply ended with Standard's line: "start Block C in a fresh session with `claude --model opus`, then `/review 149`". The plan's first line says `Tier: Small`. The main session ran the browser check and then stopped, and the owner had to say "Review here". This is the second time (#150 was the first). Proposal 1 below covers it.
4. **T4's best finding yet.** Finding 1, `red-team T4`, score 9: when the server refuses the tax rate (a customer without a state, or a code like "DC"), the page silently drops the chosen company and leaves the previous company's rate and total on screen. None of the owner's customers hits it today; any customer saved without a state would. It was fixed in three lines. The brief's T4 paragraph didn't name this path.
5. **T7 wasn't mentioned.** The plan changes the invoice page's behaviour, not its look, so `frontend-design` probably had nothing to do. But the plan doesn't say so, as on #138.

### InvoiceMe #151 Stored invoices on a profile show current customer details, and clearing the company keeps the old total (Small), PR #152

The follow-up from #149's G2, run on Small to collect Small metrics. A profile's PDF link now sends the invoice's stored customer fields, as the home list does, and choosing "Select Company" again clears the total. The diff is 3 files, +3 / −2, in one commit. Everything ran in one desktop session, df909e08, over 21 minutes.

| Part | Model | Calls | Context peak | Cost |
|---|---|---|---|---|
| Plan mode to the G1 accept | Opus 5.5 | 16 | 116k | $1.12 |
| Build: the main session around the fork | Opus 5.5 | 2 | 120k | $0.09 |
| Build: the forked `builder` | Sonnet 5.5 | 16 | | $0.37 |
| The plan's browser check, in the main session | Opus 5.5 | 42 | 162k | $1.85 |
| Review to G2: main session | Opus 5.5 | 7 | 173k | $0.41 |
| Review to G2: red-team | Opus 5.5 | 5 | | $0.28 |
| Mark ready, open backlog issue #153, memory | Opus 5.5 | 8 | 185k | $0.49 |
| `/close` | Opus 5.5 | 5 | 189k | $0.27 |
| **Total** | | 101 | | **$4.88** |

**Against the targets:**
- **Cost:** $4.88, the dearest Small run but #149, for the smallest diff under the harness. Without the browser check it would have been $3.03.
- **Context:** 189k, under 200k but close.
- **Owner turns:** ≈ 5, met. They were `/scope 151 small`, the G1 answers, the G1 accept, "Mark it ready and open a Backlog Issue linked to the Epic" and `/close`.
- **Quality:** the red-team approved with no findings in the PR. The G2 report listed 4 problems that were already in the code (1 from the T4 lens, 1 more from the red-team, and 2 that `scope` had found itself), and the owner sent them to a new backlog issue, #153. There was no fix round. Escapes are tracked to 2026-11-24.

**Findings:**
1. **A 5-line fix with a $1.85 browser check.** The plan's check had 7 steps (a–g), run by the main session on Opus at 120–162k. The red-team, by contrast, cost $0.28. The check is worth having for a UI change, but on Small it runs at the session's dearest rate, and no rule scales the check to the size of the change.
2. **The check wrote to the owner's data, as the plan said it would.** Steps (a) and (f) changed a customer's email in the local dev database and put it back; the plan said so, and the owner approved it at G1. But the save also rewrote that customer's phone from `(123) 456-7899` to `1234567899`, #137's normalization on update, so the undo wasn't complete. The G2 report said so. `build` says "never change the owner's real data while driving the app", and the Standard builders used a throwaway in-memory database for this. `scope`'s plan rule doesn't say it, so the plan could propose it and the owner could approve it.
3. **The tier hand-back half-worked.** The builder ended with Standard's line, then added "This is the Small tier, so the main session may run the review instead." The main session ran the review without asking. No owner turn was lost, but the fork's reply still led with the wrong tier.
4. **The review asked before marking ready,** because 4 follow-ups needed a decision. The owner answered both in one turn, and set a new practice: pre-existing bugs found during epic work go to a backlog issue (#153) linked to the epic.

### Proposed changes from this batch (not made)

[research/11](11-meta-analysis.md) §9 ranks these with the rest of the evidence, as C1–C9. D25 (2026-10-28) made them: 1 as C2, 2 as C3, 3 as C1 (the harness half; InvoiceMe's half is C9, at rollout), 4 as C4, 5 as C1, and item 6 as C5.

1. **Tier hand-back (from #150, #149 and #151), worth doing.** The slip has now happened on all 3 Small runs under D24: in full on #150 and #149, half on #151. Make the tier the plan's, read by both sides:
   - **`build`, step 6:** "Take the tier from the plan's first line (`Tier: Small` or `Tier: Standard`) and end with that tier's line."
   - **The Small path in `scope` and CLAUDE.md:** "When the forked build returns on the Small tier, run `review` in this session. The approved plan's tier decides, not the fork's reply."

   Either fix alone would have saved #150's extra turn; together they cover a slip on either side. A test can check that both lines exist.
2. **"continue <n>" (from #133, #69, #137, #138 and #139), worth doing.** Add to CLAUDE.md's workflow: "After G1, 'continue <n>' means invoke `build` for <n> at once; the fork reads the plan." This saves about $0.05–0.12 per Standard issue, and on #139 it would have saved an owner turn.
3. **T6's web-app method (from #137), in InvoiceMe's `ux-design` skill.** Record what #137 did: the built-in browser, a throwaway in-memory MongoDB, never the real `.env`, screenshots under `.harness/work/<n>/ui/`, and the PDF viewer's blank render (check the PDF through the component tree). This closes the register's open note on T6. It is an InvoiceMe change, made through an issue there. Add #138's limit too: the pane may not draw the table, and it runs in one time zone. In the harness, `scope`'s UI rule (T6) should name the browser pane for a web app, and `UIAutomationClient` only for a desktop app, so the plan stops prescribing a method the builder won't use (#139).
4. **T7 named on every UI sub-phase (from #138, #149 and #151).** In `scope`'s UI rule: "Each UI sub-phase says `frontend-design: used for <what>` or `frontend-design: not needed, because <why>`." The plan check (`handoff-check --plan`) could require the line when a sub-phase lists a `.jsx` file, and a test can check both. Without it T7 can be left out silently, and the trial can't be judged.
5. **The UI check runs in the builder on both tiers, on throwaway data (from #149 and #151), worth doing.** The largest cost found in this batch: $4.76 over two Small runs.
   - **CLAUDE.md:** "the fork can't reach the app's tools" becomes "the fork can't reach the app's PR tools". The builder can drive the browser pane, as #137–#139 show.
   - **`scope`'s UI rule:** the builder runs the UI check, on either tier, against a throwaway database, never the owner's. A plan never proposes writing to the owner's data, even to undo it.
   - A test can check both lines.
6. **Tier, for the meta-analysis (from #149).** Two questions, not yet proposals:
   - Should `scope` check the tier again after the G1 decisions, when they add work (a second fix, a UI check, more than 3 decisions)?
   - Should a UI check count against Small? With proposal 5 it moves to Sonnet, so maybe not.
