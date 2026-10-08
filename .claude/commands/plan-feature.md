---
description: Write the plan + execution doc pair required before building
argument-hint: [what you want to build]
allowed-tools: Read, Write, Glob, Grep, Bash
---

Produce the plan/execution pair CLAUDE.md requires before any non-trivial implementation, for: $ARGUMENTS

First read `refdocs/STATUS.md`, the PRD, `refdocs/changelog/DECISIONS.md`, and the code this would touch. Check whether an existing plan already covers it — if so, say so instead of writing a duplicate. Check it against the PRD's §5 Non-Goals and CLAUDE.md's hard constraints; if it needs one bent, say so and propose the ADR instead of writing around it.

Write two files, matching the structure of `refdocs/plans/2026-10-08-p0-foundation.md` and `refdocs/execution/2026-10-08-p0-foundation.md`:
- `refdocs/plans/YYYY-MM-DD-<slug>.md` — what and why: scope in/out with reasons, approach, a risk table with honest confidence levels, and a definition of done phrased as observable facts.
- `refdocs/execution/YYYY-MM-DD-<slug>.md` — how and in what order: numbered tasks, each naming the files it touches and carrying its own **Verify** step with a real command and expected result. Mark which tasks can run in parallel across the 5-person team.

Where a task depends on an external library's behavior, its first step is "read the actual docs/types/source" — do not encode an API you're recalling from memory.

Add rows to the index tables in both README files. Do not implement anything. Return both paths and the task order.
