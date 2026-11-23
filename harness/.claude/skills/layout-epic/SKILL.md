---
name: layout-epic
description: Lays out an Epic in GitHub Issues from the project's Roadmap, as the Epic issue and one issue per phase. Started by /route on an Epic issue with no phases yet, or as /layout-epic <epic-issue>.
argument-hint: <epic-issue-number>
---

# Layout: an Epic in GitHub Issues (D27)

Epic: `$ARGUMENTS`. This lays out what to build and in what order. How to build it is each issue's `/scope`.

## 1. Read

- **The Roadmap:** the doc under `harness.json`'s `docs` that holds it. If there isn't one, ask for its path.
- **The Epic issue:** `gh issue view <n> --comments`.
- **The previous Epic's issues,** as the shape to follow: its body format, labels, milestone and sub-issue links.
- **The last Epic close's findings that need code** (its `audit.md`, or the issue comment that holds them). They become phase n.0.

## 2. Ask roadmap questions only

- What to ask: which phases, in what order, what belongs to which, the milestones, and which phases are Small.
- How to ask: each with a recommendation, in one dialog where it can.
- What to leave: implementation questions go in each issue's "Decide while scoping" list, for `/scope`.

## 3. Draft, then create on the owner's yes

1. **Draft** the Epic issue and one issue per phase in `.harness/work/epic-<n>/`, in the previous Epic's format: a Roadmap link, Scope, Done when, Out of scope, and Decide while scoping. Say where a draft differs from the Roadmap.
2. **Show the drafts.** On the owner's yes, create them:
   - the Epic's body from its draft, with `gh issue edit <epic> --body-file …` (the Epic issue already exists);
   - the phases with `gh issue create`, on the milestone with the labels;
   - linked as sub-issues of the Epic: `gh api repos/{owner}/{repo}/issues/<epic>/sub_issues -F sub_issue_id=$(gh api repos/{owner}/{repo}/issues/<phase> --jq .id)` (the issue's id, not its number);
   - with their numbers recorded in `.harness/work/epic-<n>/numbers.txt`.
3. **Don't edit the repo here.** Roadmap changes the answers imply (a new n.0 phase, the issue numbers) go into phase n.0's issue as an item, so the Roadmap catches up at the Epic's start.
4. **End** by naming the first phase's entry point: `/route <first>`.

## Never

- Never create an issue before the owner's yes.
- Never plan implementation here.
