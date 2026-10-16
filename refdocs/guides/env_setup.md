# Environment Setup — Plant Load Radar

> **Security:** never commit a real value from this file. `.env*` is gitignored; `.env.example` carries the *names* with blank values and is committed.
> Never paste a real token into a plan, an execution doc, a changelog entry, or a chat transcript. If one leaks, rotate it — don't just delete the message.

Last updated: 2026-10-08

---

## Required variables

Nothing in P0 reads an environment variable — the deterministic core and data layer need no network. The first required variable arrives with the LLM interface in P2. Names are fixed now so `.env.example` and this table agree from day one.

| Variable | Required | Where to get it | Read by | Notes |
|---|---|---|---|---|
| `ANTHROPIC_API_KEY` | Only to switch the model layer on (`PLR_LLM_MODE=live`). Not needed for `core/`, the board, the rules reader, the templates or tests. | https://console.anthropic.com/settings/keys — `ASSUMED:` provider (D-08); if the team picks another provider, rename here, in `.env.example`, and in `llm.py` in one session | `src/llm/anthropic.ts` (server only) | Server-side only. Put it in the host's environment variables (Vercel: Project Settings, Environment Variables) or in a local `.env`; never in chat, git or a `NEXT_PUBLIC_*` variable. Small pay-per-use budget: set a spend limit in the provider console before the first call. |

## Optional variables

| Variable | Default if unset | What it changes |
|---|---|---|
| `PLR_LLM_MODE` | `off` | `off` (rules reader and templates only), `live` (call the model; needs `ANTHROPIC_API_KEY`), `record` (live, and save each answer to the recordings file), `replay` (play saved answers, no key, no cost). Anything else means `off`. |
| `PLR_LLM_MODEL` | `claude-haiku-5-5` (the cheapest current model; CLAUDE.md rule 8, ADR D-21) | Which model the readers and the writer call. Raise it only if `scripts/eval-llm.ts model` shows the cheaper one is not good enough |
| `PLR_LLM_MAX_CALLS` | `60` | The most model calls one server run may make: the cost brake. At the cap the app falls back to the rules reader and the templates |
| `PLR_LLM_RECORDINGS` | `.llm/recordings.json` (gitignored) | Where `record` saves and `replay` reads model answers. They are model output; committing them needs a manifest row and an ADR |
| `PLR_DATA_DIR` | `./data` | Where loaders look for datasets and `MANIFEST.md` |
| `PLR_LEDGER_MODE` | Optional. `file` or `cookie`; default `cookie` when `VERCEL` is set, else `file` | Where decisions are kept. Cookie mode is per-browser and re-derived on every read (ADR D-19) |
| `PLR_LEDGER_PATH` | Optional. Default `.ledger/ledger.jsonl` (gitignored) | Where the append-only decision ledger is written (ADR D-18). Needs a writable filesystem, so it works locally and with `next start`, not on static hosting. Not yet listed in `.env.example` (edits to that file are blocked in this environment); add the lines `PLR_LEDGER_PATH=`, `PLR_LEDGER_MODE=`, `PLR_LLM_MODE=`, `PLR_LLM_MAX_CALLS=` and `PLR_LLM_RECORDINGS=` by hand |

---

## Setup

```bash
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

## Switching the model layer on (cost and safety notes)

- Set `ANTHROPIC_API_KEY` and `PLR_LLM_MODE=live` in the **server** environment only. Check the setting with `npm run eval:model` (it costs a few cents with the default model) before showing it to anyone.
- **On a public deployment, anyone who opens `/inbox/try` can ask for the model reader**, and each use spends from your key. `PLR_LLM_MAX_CALLS` caps one server run (the cap resets when the server restarts, and each serverless instance counts separately), and a provider-console spend limit is the real backstop. Keep the mode `off` on a link you hand to strangers unless you want them to try it.
- Nothing the model returns is shown as a figure unless the calculator produced it first; a failure, a refusal or the cap falls back to the rules reader and the templates.
