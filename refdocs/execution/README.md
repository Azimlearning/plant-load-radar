# Execution Plans

> **MANDATORY:** Every plan in `refdocs/plans/` that moves to implementation must have a matching execution document here.
> An execution plan covers **how** and **in what order** — ordered tasks, file paths, commands, and a Verify step per task.
> Do not start coding a feature that has no execution doc. Write one first.

## Naming convention

`YYYY-MM-DD-<slug>.md` — **identical filename to its companion plan** in `refdocs/plans/`. Same date, same slug.

## Required sections in every execution plan

1. **Companion plan** — link to the plan doc, at the top
2. **Before starting** — preconditions, env vars, what must already be green
3. **Tasks** — ordered and self-contained, each with:
   - the files it creates or modifies
   - the exact steps or commands
   - a **Verify** step: a real command and its expected result
4. **Wrap-up** — the STATUS / changelog / ADR checklist

**A task is done when its Verify passes** — not when the code compiles. That distinction is the entire value of this folder.

## Keeping these honest

If reality diverges from the doc mid-build, **edit the doc** and note it in the changelog's Deviations line. A plan that changed silently is a plan nobody trusts next time. Stale docs are worse than no docs.

## Index

| File | Companion plan | Status |
|---|---|---|
| [2026-10-08-p0-foundation.md](2026-10-08-p0-foundation.md) | [../plans/2026-10-08-p0-foundation.md](../plans/2026-10-08-p0-foundation.md) | Done |
| [2026-10-08-p1-board.md](2026-10-08-p1-board.md) | [../plans/2026-10-08-p1-board.md](../plans/2026-10-08-p1-board.md) | Done |
| [2026-10-08-p2-capture.md](2026-10-08-p2-capture.md) | [../plans/2026-10-08-p2-capture.md](../plans/2026-10-08-p2-capture.md) | Offline path done (Tasks 5-6 deferred) |
| [2026-10-08-p3-decide.md](2026-10-08-p3-decide.md) | [../plans/2026-10-08-p3-decide.md](../plans/2026-10-08-p3-decide.md) | Done |
| [2026-10-09-p4-ui-and-deploy.md](2026-10-09-p4-ui-and-deploy.md) | [../plans/2026-10-09-p4-ui-and-deploy.md](../plans/2026-10-09-p4-ui-and-deploy.md) | Done (deploy not performed) |
| [2026-10-08-p2b-value.md](2026-10-08-p2b-value.md) | [../plans/2026-10-08-p2b-value.md](../plans/2026-10-08-p2b-value.md) | Tasks 1-2 done; Task 3 (review) done; carrying-rate split open |
