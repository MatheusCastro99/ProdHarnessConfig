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

## Batch comparison

The five issues so far, all run under D23 and D24 on harness `51aa524`, against the configuration before them. All prices are list prices from the transcripts.

| | Before D23/D24 | #133 BBH | #150 BBH | #69 IM | #137 IM | #138 IM |
|---|---|---|---|---|---|---|
| Tier | Standard: #72 $5.16, #73 $4.80. Small: #134 $2.23, #68 $2.91, #120 $3.93 | Standard | Small | Standard | Standard | Standard |
| Diff | #72, #73: about 20–25 changed files | 70 files, +294 / −184, a pure move | 20 files, +34 / −23, a pure move | 15 files, +259 / −41 | 18 files, +243 / −82, server, client and docs (plus the owner's 1-line ADR edit) | 15 files, +199 / −61, server, client and docs |
| Planning (A, with the surveyor) | $1.36, $1.61 | $1.69 | $1.12 (no surveyor) | $1.68 | $1.66 | $1.84 |
| Build: main session + builder | $0.56 + $1.05, $0.52 + $0.73 | $0.46 + $1.53 | $0.25 + $0.59 | $0.45 + $0.82 | $0.47 + $1.85 (UI check $0.54 of it) | $0.49 + $1.88 (UI check $0.77 of it) |
| Red-team runs | $0.93 (2 runs), $0.71 (1 run) | $1.18 (1 run) | $0.41 + $0.29 re-review | $0.61 + $0.22 re-review | $0.82 + $0.11 re-review | $0.78 + $0.15 re-review |
| Review + fixes + close, main session | $1.27, $1.24 | $1.17 | $1.17 | $1.58 | $1.35 | $1.28 |
| **Total** | **$5.16, $4.80** / **$2.23, $2.91, $3.93** | **$6.03** | **$3.83** | **$5.36** | **$6.26** | **$6.43** |
| G2 fix round | #72: 1; #73: none | none | 1 (2 doc lines) | 1 (2 code fixes) | 1 (2 doc lines) | 1 (1 doc line) |
| Owner turns | ≈ 7–8 / ≈ 4–5 | ≈ 7 | ≈ 6 (5 without the tier slip) | ≈ 7 | ≈ 7 | ≈ 7 |
| Peak context | 126k, 123k / 125k | 136k (builder) | 150k (one session) | 129k | 172k (builder, after the UI check) | 167k (builder, after the UI check) |

**Reading it:**
- **Standard runs cost about the same as before, on harder or larger work.**
  - #69 cost $5.36 against $4.80–5.16. That included a G2 fix round with a re-review ($0.94), and #73 had no fix round.
  - #133 cost $6.03 on a diff three times the size of #72's or #73's.
  - #137 cost $6.26 and #138 $6.43, the two most so far, and the reason is visible: both ran a UI check (T6, $0.54 and $0.77 in the builder) and both touched server, client and docs at once. Without their UI checks they would have cost $5.72 and $5.66. #137's red-team ($0.82) did more than read: it ran the real `server.js` against a database holding a duplicate.
  - T4's first runs ($0.61, $0.82, $0.78) average $0.74, against $0.71 for #73's single run.
- **#150 was the second most expensive Small run so far, after #120 ($3.93), for two reasons.**
  - It had a fix round with a re-review: $0.62.
  - The single session grew to 150k, so every call after G1 read 125–150k tokens at Opus rates.
  - Its build ($0.84 in all) was in line with #134's ($0.79).
- **Planning cost (T1's rule):** the Schema epic's median is now $1.68 (#69 $1.68, #137 $1.66, #138 $1.84), against the baseline median of $1.49. That's $0.19 more, under the $0.20 limit by a cent. #138's planning included two time-zone experiments in Node and 3 G1 decisions. #139–#141 decide it. #133's $1.69 is BabyBuddyHelper and outside the rule.
- **T4 has met the first half of its keep rule:** 4 fix-worthy findings over 3 issues, all fixed. Its cost half holds: the red-team's first runs average $0.74, 4% above #73's $0.71. Keep counting over #139–#140, as the rule says.
- **T6 has run twice, both early,** on client sub-phases before the UI epic. Both checks worked against a throwaway in-memory database, and neither run had owner UI adjustments after G2. They cost $0.54 and $0.77 and took the builder to 172k and 167k, the two highest peaks so far. Both times the pane failed to draw the PDF, and #138's also missed the table.
- **T7 has not run yet, and on #138 it should have been considered.** #137's plan skipped it with a reason. #138 added a new control, a date picker, on a UI sub-phase, and the plan doesn't mention `frontend-design` at all, though `scope` says to plan the design with it. See #138's findings.
- **T5 hasn't fired yet.** It waits for the auth epic.

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
4. **Two adjacent findings are real but not tracked.** A1: a failed save on the PDF page shows axios's generic message instead of the server's errors, which matters once #139 adds a 409. A2: blurring the invoice-number field crashes when no invoice exists yet, which hits a new user on their first invoice. The owner declined both for this PR, and neither is an issue yet. G2 suggested #139 for both.
5. **Block B's main session read before invoking `build` for the fourth Standard run in a row:** the work folder, `gate.json`, the issue and `build`'s own SKILL.md, about $0.12 above the first cache write. Proposal 2 below covers it.

### Proposed changes from this batch (not made)

1. **Tier hand-back (from #150), worth doing.** Make the tier the plan's, read by both sides:
   - **`build`, step 6:** "Take the tier from the plan's first line (`Tier: Small` or `Tier: Standard`) and end with that tier's line."
   - **The Small path in `scope` and CLAUDE.md:** "When the forked build returns on the Small tier, run `review` in this session. The approved plan's tier decides, not the fork's reply."

   Either fix alone would have saved #150's extra turn; together they cover a slip on either side. A test can check that both lines exist.
2. **"continue <n>" (from #133, #69, #137 and #138), optional.** Add to CLAUDE.md's workflow: "After G1, 'continue <n>' means invoke `build` for <n> at once; the fork reads the plan." This saves about $0.05–0.10 per Standard issue.
3. **T6's web-app method (from #137), in InvoiceMe's `ux-design` skill.** Record what #137 did: the built-in browser, a throwaway in-memory MongoDB, never the real `.env`, screenshots under `.harness/work/<n>/ui/`, and the PDF viewer's blank render (check the PDF through the component tree). This closes the register's open note on T6. It is an InvoiceMe change, made through an issue there. Add #138's limit too: the pane may not draw the table, and it runs in one time zone.
4. **T7 named on every UI sub-phase (from #138).** In `scope`'s UI rule: "Each UI sub-phase says `frontend-design: used for <what>` or `frontend-design: not needed, because <why>`." The plan check (`handoff-check --plan`) could require the line when a sub-phase lists a `.jsx` file, and a test can check both. Without it T7 can be left out silently, and the trial can't be judged.
