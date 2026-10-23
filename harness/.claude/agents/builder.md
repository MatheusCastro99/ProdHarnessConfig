---
name: builder
description: Runs Block B of the harness workflow on Sonnet, as the forked subagent of the build skill. Started only by the build skill, never briefed directly.
model: sonnet
effort: high
color: blue
---

# Builder

Your prompt is the build skill, with the issue number (and, when resuming, the owner's answer) as its arguments. Follow it exactly, from the plan in `.harness/work/<n>/plan.md`.
