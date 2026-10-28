# R2: Baseline cost per issue before the production harness

Date: 2026-10-21. Script: [scripts/sessions-survey.js](scripts/sessions-survey.js), run on the local session records under `~/.claude/projects/<project>/`.

Each row is one session, priced at list price for the model of each call, with its subagents included. These are list-price equivalents: the owner is on a subscription. Only sessions from the Opus 5.5 era are used, so prices are comparable.

## Code issues: BabyBuddyHelper (.NET MAUI), the production-like baseline

| Session | Issue | Owner turns | Calls (main + subagent) | Context start → peak | Cost |
|---|---|---|---|---|---|
| 928728bf | #38 | 13 | 99 + 23 | 68k → 261k | $7.59 |
| e2e1daa1 | sub-issue 40 (research + decision) | 13 | 127 + 40 | 68k → 300k | $9.66 |
| 84414c64 | #45 | 8 | 106 + 25 | 68k → 282k | $10.32 |
| 0a83f832 | #47 | 6 | 60 + 14 | 69k → 177k | $3.82 |
| 29fafa52 + abc952f3 | #48 | 32 | 212 + 56 | 69k → 409k | $20.21 |
| 46d544f8 | #93 | 11 | 106 + 19 | 72k → 348k | $13.17 |
| 726ebd79 | #94 | 14 | 106 + 11 | 72k → 382k | $11.74 |
| bb6f60f1 | #95 (planning) | 9 | 78 + 12 | 72k → 251k | $6.65 |
| bdd266f8 | #100 | 11 | 124 + 15 | 72k → 369k | $12.46 |
| dbd952b7 | #118 (small bug) | 7 | 53 + 0 | 83k → 144k | $3.08 |

**Median: $9.99 per issue (range $3.08–$20.21). Median peak context: 291k. Starting context: 68–83k, growing over time.**

## Docs issues in the study repo, 12-stage workflow

| Session | Issue | Owner turns | Active time | Calls | Context start → peak | Cost |
|---|---|---|---|---|---|---|
| 2b4fe0ef | #14 | 27 | 101 min | 135 + 15 | 79k → 289k | $10.01 |
| 5f1b6776 | #19 | 19 | 67 min | 142 + 28 | 80k → 316k | $11.59 |
| 77aed23a | #15 | 19 | 73 min | 107 + 27 | 80k → 281k | $9.10 |
| 24c82810 | #26 | 13 | 51 min | 93 + 22 | 81k → 258k | $7.40 |
| 71bcd6fe + d7c9e10b | #27 | 18 | 82 min | 119 + 18 | 81k → 303k | $10.55 |

**Median: $10.01 per issue.** The two medians are nearly the same.

## What the baseline shows

- **Every issue session follows #28's pattern.** It starts at 68–83k, grows to 250–410k, and never shrinks. #28 was not an outlier.
- **The starting context crept up from 62k (Sept) to 83k (Oct).** That matches §5.1's finding that the global setup, not project docs, makes up the start.
- **Cost tracks call count times peak context.** The most expensive issue (#48: 268 calls, 409k peak) is the clearest case.

## Limits

- Issues differ in size; a median over 10 sessions is a coarse baseline.
- "Owner turns" counts typed messages only, not AskUserQuestion answers.
- "Active time" sums gaps under 1h between records, so it is approximate.
- Red-team finding counts were not extracted.
