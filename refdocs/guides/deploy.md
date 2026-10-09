# Deploying the demo (Vercel) so judges can open it

> Status 2026-10-09: **not deployed yet.** The Vercel connector in Claude Code is not authorised in the session that built this, and the Vercel CLI is not installed or logged in. The repo is ready; the steps below take about five minutes. ADR D-19.

## What is already set up for hosting

- **No required environment variables.** The demo uses only committed synthetic and public data. There is no API key, because no model runs.
- **Per-browser ledger on Vercel.** When running on Vercel (the `VERCEL` variable is set) the app stores each visitor's decisions in their own cookie, re-derived from the scenario on every read. One judge's approval never changes what the next judge sees, and an edited cookie cannot show a figure the calculator did not produce. A "Start the demo again" button clears it. Locally, the append-only file ledger is used unless you set `PLR_LEDGER_MODE=cookie`.
- **Data files travel with the server functions.** `next.config.ts` sets `outputFileTracingIncludes` for `data/**`, and the build's trace files were checked to list them for `/`, `/decisions` and `/ledger`.
- **Next.js is detected automatically.** No `vercel.json` is needed.

## Option A: import from GitHub (no CLI)

1. Open <https://vercel.com/new> and sign in with the GitHub account that owns the repo (`Azimlearning/plant-load-radar`, private).
2. Import the repository. Framework preset: **Next.js** (detected). Build command and output: leave the defaults. Environment variables: none.
3. Deploy. Vercel gives a URL like `https://plant-load-radar-<hash>.vercel.app`.
4. **Judges must be able to open it.** New Vercel projects can have *Deployment Protection* (Vercel Authentication) on, which asks visitors to log in to Vercel. In **Settings → Deployment Protection**, set it to *Disabled* (or use a shareable link) for the production domain, then open the URL in a private window to confirm.
5. Open `/decisions`, approve with a name, check `/ledger`, press "Start the demo again". That is the whole flow a judge will try.

## Option B: Vercel CLI

```
npm i -g vercel
vercel login
vercel --prod
```

Answer the prompts with the defaults. Then do step 4 above.

## Option C: through Claude Code's Vercel connector

Authorise the connector in claude.ai (Settings → Connectors → Vercel). Once it shows as connected in the session, ask Claude Code to deploy the project. Claude Code cannot complete that authorisation itself.

## Before sending the link

- Open it on a phone and on a laptop. The navigation becomes a scrolling strip on narrow screens.
- Walk the flow in `/decisions` once yourself, then press "Start the demo again" so your own cookie is clean.
- The page opens with the synthetic-data notice on purpose: it must not be removed.
- The repo is public (changed on 2026-10-09 at the user's request), so the code, `refdocs/` and `refdocs/Docs/` (slides, script, study notes) are visible to anyone. The pitch pack in `refdocs/context/` includes organiser contact details and interview-prep notes.

## Known limits of the hosted version

- Decisions live in the visitor's browser for eight hours and are lost if they clear cookies. That is by design.
- Nothing is sent anywhere: no WhatsApp, no email. The drafts are templates and say so.
- Server functions on the free tier may take a second or two on a cold start.
