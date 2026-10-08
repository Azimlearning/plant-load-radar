# Plant Load Radar

Who gets the plant's capacity when there isn't enough — decided by the ringgit at stake. A demo/MVP built to pitch Chin Hin Group's "Capacity & Demand Intelligence" challenge in Kabel's YEI 3.0 programme.

**Status:** Scaffolded 2026-10-08 — docs and plan exist, no code yet. See [`refdocs/STATUS.md`](refdocs/STATUS.md).

## What it does

One rule, one owner, one board:

- **The rule:** when capacity is short, serve whichever request has more ringgit at stake — an internal project's cost of delay (late-handover damages plus idle site cost) versus an outside order's margin. Confirmed orders are never bumped; close calls go to whoever confirmed first; the loser is offered the next free week.
- **The owner:** the plant scheduler applies the rule weekly. Exceptions go to a 30-minute huddle, never up the chain.
- **The board:** all committed demand, internal and external, against capacity, by week.
- **The AI layer:** four agents — Intake, Matching, Planner, Writer — read messy WhatsApp / paper / Excel orders, test options, and draft messages. A deterministic calculator does every calculation; the scheduler approves everything.

**About the data:** Chin Hin has given us no data. The demo runs only on public information, data from a model we trained, and synthetic data — every file is labelled in [`data/MANIFEST.md`](data/MANIFEST.md). All figures in the pitch and demo are labelled *illustrative* unless they carry a source.

## Requirements

- Node.js (the lead uses v24) and npm
- An LLM API key — only from phase P2 onward (see [`refdocs/guides/env_setup.md`](refdocs/guides/env_setup.md))
- Python + [uv](https://docs.astral.sh/uv/) — **optional**, only if the team trains a data model (ADR D-06)

## Setup

```bash
# Planned — package.json is created in phase P0; until then these will not work.
npm install
```

## Environment

Copy `.env.example` to `.env` and fill in the values. Nothing needs a key until P2. Every variable and where to get it: [`refdocs/guides/env_setup.md`](refdocs/guides/env_setup.md).

## Usage

```bash
# Planned — see CLAUDE.md "Running it"
npm test          # P0
npm run dev       # P1
```

## Project layout

```
.
├── CLAUDE.md                  operating brief for AI sessions
├── README.md
├── .env.example
├── .claude/                   settings, hooks, agents, commands, preflight
├── data/                      MANIFEST.md (every dataset's provenance)
├── refdocs/                   PRD, STATUS, plans, execution, changelog, guides, research
│   └── context/               the unzipped pitch pack (read-only history)
│
│   — planned, created by phases P0–P4 —
├── package.json
├── src/
│   ├── core/                  rule calculator, cost formulas (no LLM, no network)
│   ├── data/                  zod schemas, loaders, synthetic generator
│   ├── agents/                Intake, Matching, Planner, Writer
│   ├── llm/                   one provider interface
│   └── app/                   Next.js dashboard and server routes
├── data/public · model · synthetic
└── pipeline/                  optional Python tool to train a data model
```

## Documentation

| Doc | What's in it |
|---|---|
| [`refdocs/STATUS.md`](refdocs/STATUS.md) | Where the build actually is right now |
| [`refdocs/plant-load-radar-PRD.md`](refdocs/plant-load-radar-PRD.md) | Scope, architecture, roadmap, decision log |
| [`refdocs/changelog/CHANGELOG.md`](refdocs/changelog/CHANGELOG.md) | Session-by-session history |
| [`refdocs/changelog/DECISIONS.md`](refdocs/changelog/DECISIONS.md) | Why things are the way they are |
| [`refdocs/guides/env_setup.md`](refdocs/guides/env_setup.md) | Every environment variable and where to get it |
| [`refdocs/guides/checklist.md`](refdocs/guides/checklist.md) | Pre-ship checklist |
| [`refdocs/context/00_README.md`](refdocs/context/00_README.md) | Index of the pitch pack: brief, research, deck, script, interview prep |
| [`CLAUDE.md`](CLAUDE.md) | Operating brief for AI sessions on this repo |

## Team

Built by a team of five led by Fakhrul Azim Bin Ahmed Mardzukie (UTP). Roles to be added once Team-Up is confirmed.
