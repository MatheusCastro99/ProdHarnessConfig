# R1: Caching and context mechanics, and what #28 actually cost

Date: 2026-10-21. Sources were fetched that day; Claude Code docs change often, so recheck before relying on a version-specific detail.

## Verified facts

### Prompt caching (API)

Source: [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching), [Pricing](https://platform.claude.com/docs/en/about-claude/pricing).

- The cache is a prefix over `tools` → `system` → `messages`. A hit needs an identical prefix; a change at one level invalidates that level and everything after it.
- TTL: 5 minutes by default, refreshed free on every hit. 1 hour is optional.
- Price multipliers on base input: 5m write 1.25×, 1h write 2×, read 0.1× — except **Opus 5.5 and Sonnet 5.5, where reads are 0.05×**.
- Opus 5.5: input $4, 5m write $5, 1h write $8, read $0.20, output $20 per MTok. Sonnet 5.5: $2 / $2.50 / $4 / $0.10 / $10. Haiku 5.5 (≤100k prompt): $0.10 / $0.125 / $0.20 / $0.01 / $0.50.
- 1M context at standard per-token price on 4.6+ models (not Haiku 5.5). No long-context surcharge.
- Thinking is billed as output; it can't be turned off on Opus 5.5 / Sonnet 5.5 / Haiku 5.5.
- API rate limits: cache hits are not deducted from the rate limit. **How subscription plan limits weigh cache reads is not documented on the pages read.**

### How Claude Code uses the cache

Source: [How Claude Code uses prompt caching](https://code.claude.com/docs/en/prompt-caching).

- Request layers: system prompt + tool definitions → project context (CLAUDE.md, auto memory, unscoped rules) → conversation. Quote: "There is no per-file or per-segment caching."
- **Editing a repo file does not invalidate the cache.** Reads append to the conversation; an edit appends a system-reminder; Claude re-reads if needed.
- **Editing CLAUDE.md mid-session does not invalidate the cache and does not apply** until `/clear`, `/compact` or restart. Nested CLAUDE.md files and `paths:` rules load on demand and become conversation history.
- Things that do invalidate: switching model (including `opusplan` toggles and skills whose frontmatter names another model), changing effort (except on the 5.5 models via API/subscription), turning on fast mode, MCP changes when tool search is off, enabling or disabling a plugin that provides MCP servers, denying a whole tool when tool search is off, compaction (resets the conversation layer), image eviction, and a Claude Code upgrade.
- Things that keep the cache: plan mode, permission-mode changes, output style, skills and commands (appended as messages), `/recap`, `/rewind`, spawning a subagent.
- TTL per request: **on a subscription within plan usage the main conversation gets 1h; subagents, compaction and other side requests get 5m.** API key or usage credits: 5m everywhere. Override with `promptCacheTtl` / `subagentPromptCacheTtl` (or `CLAUDE_CODE_PROMPT_CACHE_TTL` / `CLAUDE_CODE_SUBAGENT_PROMPT_CACHE_TTL`).
- A subagent builds its own cache from scratch; a fork reads the parent's. A resumed subagent can read its earlier cache.
- `/compact` sends one summarization request over the whole history (cheap while warm, full price when cold). `/clear` costs nothing.
- Cache scope is effectively machine + directory; parallel sessions in the same directory share a prefix.

### Context loading

Source: [Memory](https://code.claude.com/docs/en/memory), [Costs](https://code.claude.com/docs/en/costs), [Subagents](https://code.claude.com/docs/en/sub-agents).

- CLAUDE.md files above the working directory load at launch; subdirectory ones load on demand. **`@imports` load in full at launch** — they organize, they don't save context.
- `.claude/rules/*.md` without `paths:` load at launch; with `paths:` they load only when Claude touches matching files.
- Skills load on invocation. The docs say to move workflow-specific instructions out of CLAUDE.md into skills and keep CLAUDE.md under 200 lines.
- Auto memory: the first 200 lines / 25KB of `MEMORY.md` load at start; topic files load on demand.
- Project-root CLAUDE.md is re-read from disk after `/compact`.
- Subagent startup: its own system prompt, the task message, the full CLAUDE.md hierarchy (Explore/Plan skip it; `omitClaudeMd: true` opts out), and a git status snapshot. It gets no parent history. Only its summary returns to the parent.
- Subagent model: per-call parameter → `model` frontmatter → `CLAUDE_CODE_SUBAGENT_MODEL` → inherit the parent's.
- Officially recommended levers: `/clear` between tasks, Sonnet by default, Haiku for simple subagents, verbose operations in subagents, hooks that filter output before Claude sees it, skills instead of CLAUDE.md bulk, plan mode, specific prompts.
- `/usage` shows a `Prompt cache (main)` line with hit rate, misses and their likely cause. On plans it also shows per-skill, subagent and MCP attribution with fix recommendations.

## #28 recomputed by token type

Script: [scripts/cost.js](scripts/cost.js). It deduplicates streamed lines by message id and prices every call at list price for its model, splitting 5m from 1h writes. Input: both #28 session records and their subagent transcripts. Total tokens come to 35.07M against #28's reported 34.6M; the difference is the stopped first session plus deduplication.

The run was on a subscription, so these are list-price equivalents for comparison, not a bill.

| Part | Calls | Tokens | Input | Cache writes | Cache reads | Output | Cost |
|---|---|---|---|---|---|---|---|
| Main session (Opus 5.5) | 142 | 31.8M | ~0 | 0.48M (1h) · $3.86 | 31.2M · $6.24 | 0.11M · $2.25 | **$12.35** |
| red-team ×2 (Opus 5.5, inherited) | 30 | 1.6M | ~0 | 0.13M (5m) · $0.66 | 1.5M · $0.30 | $0.03 | $0.99 |
| surveyor ×4 (Sonnet 5.5) | 35 | 1.2M | ~0 | 0.21M (5m) · $0.53 | 1.0M · $0.10 | $0.27 | $0.90 |
| Stopped first session | 5 | 0.4M | | $0.32 | $0.08 | $0.04 | $0.44 |
| **All** | **212** | **35.1M** | | **$5.38 (37%)** | **$6.71 (46%)** | **$2.59 (18%)** | **$14.68** |

What changes once the tokens are weighted by price:

1. **"98% cache reads" is 46% of the cost.** Writes are 2.5% of tokens but 37% of cost; output is 0.4% of tokens but 18% of cost. Raw token totals overstate reads by about 2×.
2. **Day 2 (about 13 minutes: PR, merge from `master`, close) cost $5.77 — 39% of the run.** It made 51 main calls at a context of 220–320k. Its first call was the overnight resume: one $1.77 call, writing 219k at the 1h rate. That one call is 12% of all main-session cost.
3. **Read cost per call scales with context**: about $0.017 at the starting 84k, $0.064 at the 320k peak. The mean context was 218k over 147 calls. Starting smaller and staying smaller is the biggest lever on reads.
4. **Subagents are cheap but write-heavy.** They cost $1.89 in total (13%), and 55–83% of each run's cost is its first cache write (5m TTL, own prefix). Short subagents pay mostly for the fixed startup.
5. **The red-team ran on Opus by inheritance.** Its definition doesn't set a model.

An estimate, not a measurement: running day 2 in a fresh session with a ~40k handoff, instead of resuming a 220k context, would have cost roughly $1 instead of $5.77. That works out as 51 calls × 40k × $0.20/MTok for reads plus a small first write. A real run is needed to confirm it.

## The blueprint's §1 against these facts

| Claim in the blueprint | Verdict | Why |
|---|---|---|
| Static files listed in AI_CONTEXT "remain pinned in Anthropic's cache, saving ~90%" | **Wrong mechanism** | No per-file caching. A file read becomes part of the conversation prefix; it's cached because everything is. The 5.5-model read discount is 95% and was already in effect. |
| "When a file changes, everything following it must be re-cached" | **False for repo files** | Edits append a reminder and never rewrite history. Mid-session CLAUDE.md edits don't even apply. |
| Separate static from volatile context | **True only at the project-context layer, and minor** | That layer rebuilds once per session or `/clear`/`/compact`, not per edit. |
| Read files in chunks with `sed`/`awk` | **Neutral** | Read with offset/limit does the same. What matters is how many tokens enter the context, not which tool brings them in. |

The intent of §1 — make sessions cheaper — is right. The levers the evidence supports are:

1. **Smaller starting context.** CLAUDE.md under 200 lines; workflow stages as skills; `paths:` rules; no "read all `Context/*` first" rule.
2. **Keep it small.** Delegate reading to subagents that return summaries, and filter test and log output with hooks.
3. **Session boundaries at block ends.** Use `/clear` or a new session with a handoff file, and never resume a large context after the TTL has expired.
4. **Model per role.** Sonnet or Haiku for survey and check subagents; decide on purpose whether red-team needs Opus.
5. **Fewer calls.** Batch work and use fewer owner round-trips — O8 and O9 point the same way.
6. **Keep the cache stable mid-task.** No model switches (beware `opusplan`), and no MCP or plugin toggles.

## Open questions

- How do subscription usage limits weigh cache reads and writes? Not documented on the pages read. `/usage` attribution on the owner's plan is the practical way to observe it.
- Is a 1h TTL worth it for subagents in this workflow? Each subagent here was short, so probably not. The data in the table above suggests the default 5m is right.
- #16's session records are not in the study repo, so #16 can't be recomputed by token type.
