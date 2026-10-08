# Environment Setup — Plant Load Radar

> **Security:** never commit a real value from this file. `.env*` is gitignored; `.env.example` carries the *names* with blank values and is committed.
> Never paste a real token into a plan, an execution doc, a changelog entry, or a chat transcript. If one leaks, rotate it — don't just delete the message.

Last updated: 2026-10-08

---

## Required variables

Nothing in P0 reads an environment variable — the deterministic core and data layer need no network. The first required variable arrives with the LLM interface in P2. Names are fixed now so `.env.example` and this table agree from day one.

| Variable | Required | Where to get it | Read by | Notes |
|---|---|---|---|---|
| `ANTHROPIC_API_KEY` | From P2 (agents, writer). Not needed for `core/`, the board, or tests. | https://console.anthropic.com/settings/keys — `ASSUMED:` provider (D-08); if the team picks another provider, rename here, in `.env.example`, and in `llm.py` in one session | `llm.py` (P2) | Server-side only. Small pay-per-use budget: set a spend limit in the provider console before the first call. |

## Optional variables

| Variable | Default if unset | What it changes |
|---|---|---|
| `PLR_LLM_MODEL` | Cheapest model that passes the P2 extraction tests (chosen in P2, recorded in an ADR) | Which model the agents call |
| `PLR_DATA_DIR` | `./data` | Where loaders look for datasets and `MANIFEST.md` |

---

## Setup

```bash
# Planned — package.json is created in P0 Task 1; until then these will not work.
npm install
cp .env.example .env   # then fill in ANTHROPIC_API_KEY (needed only from P2)
npm test
```

On Windows PowerShell use `Copy-Item .env.example .env`.

---

## Rules

- **Client-side bundles are public.** Anything inlined into a browser build is readable by anyone who opens devtools. In Next.js, any variable prefixed `NEXT_PUBLIC_` is inlined into the client bundle — so the LLM key must never carry that prefix, and is read only in server code (route handlers, server components, `src/llm/`). A key that must stay secret goes through a server-side route, never into client code — no exceptions, no "it's just a prototype".
- **`.env.example` is the documentation.** Add the variable name there the moment you add the variable, or the next person's setup silently half-works.
- **A missing required variable should fail loudly at startup**, with a message naming the variable and pointing here. Silent fallbacks to a broken state cost hours.
- **Rotate on exposure, not on suspicion of exposure.** If you can't prove a key never left the machine, treat it as leaked.
- **Five people, one key?** Prefer one key per person with its own spend limit, so one teammate's runaway loop doesn't drain the shared budget.

## When a variable changes

Adding, renaming, or removing one means updating, in the same session: this file, `.env.example`, the deploy target's dashboard (if any), and a changelog entry. Miss one and the next environment breaks in a way that looks like a code bug.
