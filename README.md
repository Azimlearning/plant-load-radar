# Plant Load Radar

Who gets the plant's capacity when there isn't enough, decided by the ringgit at stake. A working demo (TRL 3) built to pitch Chin Hin Group's "Capacity & Demand Intelligence" challenge in Kabel's YEI 3.0 programme.

Live demo: <https://plant-load-radar.vercel.app> (deployed from `main`; see [`refdocs/guides/deploy.md`](refdocs/guides/deploy.md)).

## About the data

**Chin Hin has given us no data, and this demo uses none.** Every dataset is one of three kinds, and each has a row in [`data/MANIFEST.md`](data/MANIFEST.md) with its source, licence and date (or seed):

- `public`: public information (Bursa filings, DOSM statistics, press reports), cited.
- `synthetic`: invented and seeded. Every party in the demo is fictional.
- `model-generated`: none today.

A loader refuses any file with no manifest row. Every ringgit or cubic-metre figure on screen is labelled illustrative or carries a source, and none is typed into the interface: all of them are computed by the code in `src/core/`. A language model, if switched on, may only read or reword text; a guard rejects any number it adds.

## What it does

One rule, one owner, one board:

- **The rule:** when capacity is short, serve whichever request has more ringgit at stake: an internal project's cost of delay (late-handover damages plus idle site cost) against an outside order's margin. Confirmed orders are never bumped; a close call goes to whoever confirmed first; the request that loses is offered the next free week.
- **The owner:** the plant scheduler applies the rule weekly. Exceptions go to a 30-minute huddle, never up the chain.
- **The board:** all committed demand, internal and external, against capacity by week.
- **The AI layer:** four steps (Intake, Matching, Planner, Writer) read messy WhatsApp, spreadsheet and photo orders, test the options, and draft messages. A deterministic calculator does the arithmetic. Nothing is added, sent or recorded until a named person approves it.

Out of scope on purpose: forecasting, letting AI decide allocation, real WhatsApp/Teams/Kingdee connections, logins.

## Run it

Requires Node.js 24 and npm.

```bash
npm install
cp .env.example .env     # nothing is required to run the demo; see refdocs/guides/env_setup.md
npm run dev              # http://localhost:3000
```

For the production build: `npm run build`, then `npx next start`.

## Pages

| Route | What it is |
|---|---|
| `/` | Overview |
| `/board` | Capacity against demand by week (slide 9's six weeks; "Show 6 more weeks" for the rest), the recommendation, build-ahead alternative, float what-if, reserved slots |
| `/inbox`, `/inbox/try` | Orders read from messages; try your own message, a pasted WhatsApp chat export, the sample sales-order export, or a photo |
| `/decisions` | Approve or change the rule's recommendation (a named person), edit drafts, approve and send to the simulated outbox, or send the week to the huddle |
| `/huddle` | Weekly 30-minute agenda from what is actually open |
| `/ask` | Plain-words capacity questions answered by the calculator |
| `/calloffs` | Reserve a slot for a call-off confirmed four or more weeks ahead |
| `/outbox`, `/ledger`, `/finance` | What was "sent", what was decided, and the finance view (with CSV export) |
| `/value`, `/pilot`, `/sources` | Cost of today's arrangement, pilot scorecard, every source and assumption |

Your decisions, call-offs, outbox and huddle flags are your own: a file under `.ledger/` locally, a cookie in your browser when hosted.

## Commands

| Command | What it does |
|---|---|
| `npm test` | Unit and component tests (vitest) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `next typegen` then `tsc --noEmit` |
| `npm run check:literals` | Fails if a figure is hard-coded in `src/core` or `src/app` |
| `npm run build` | Production build |
| `npm run e2e` | Builds, then runs the Playwright tests in a real browser at desktop and phone width (money path, keyboard use, accessibility checks on every page) |
| `BASE_URL=http://localhost:3111 npm run smoke` | Quick check of a running `next start` |
| `npm run generate:synthetic`, `npm run generate:deck-story` | Regenerate the demo scenarios (a test fails if the committed files are stale) |
| `npm run fetch:public` | Re-download the DOSM series |
| `npm run eval:rules`, `npm run eval:model` | Score the order reader against 22 invented messages. The model run needs a key and spends a few cents; it has not been run yet |

The model layer is **off by default** (`PLR_LLM_MODE`). Leave it off on any link you give to strangers: each model call spends your key.

## Documentation

| Doc | What's in it |
|---|---|
| [`refdocs/STATUS.md`](refdocs/STATUS.md) | Where the build actually is |
| [`refdocs/plant-load-radar-PRD.md`](refdocs/plant-load-radar-PRD.md) | Scope, architecture, roadmap, decision log |
| [`refdocs/changelog/CHANGELOG.md`](refdocs/changelog/CHANGELOG.md) | Session-by-session history, with what was verified |
| [`refdocs/changelog/DECISIONS.md`](refdocs/changelog/DECISIONS.md) | Why things are the way they are |
| [`refdocs/guides/env_setup.md`](refdocs/guides/env_setup.md) | Every environment variable and where to get it |
| [`refdocs/guides/deploy.md`](refdocs/guides/deploy.md) | Hosting on Vercel |
| [`refdocs/pitch/demo-notes-and-qa.md`](refdocs/pitch/demo-notes-and-qa.md) | The five-minute walk-through and Q&A |
| [`CLAUDE.md`](CLAUDE.md) | Operating brief for AI sessions on this repo |

## Team

Built by a team of five led by Fakhrul Azim Bin Ahmed Mardzukie (UTP).
