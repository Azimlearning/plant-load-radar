# Plant Load Radar — Build Status

> **Read this first to know where we are.** Updated at the end of every build session. Phases and scope come from `refdocs/plant-load-radar-PRD.md` §6. Don't reorder phases without updating this file and saying why (CLAUDE.md "keep docs current").

**Build philosophy:** A demo built to be shown. Deterministic core first, agents second, polish last. Never build the second of anything until the first is green end-to-end. Numbers come from the calculator; data comes from files with provenance. Planning is by order and exit criteria — no dates (D-11).

**Right now:** Nothing is built. This project was scaffolded on 2026-10-08 and the stack, data and timing assumptions were corrected the same day — the docs, agent config, and the P0 plan exist; no code does. The next session starts at `refdocs/plans/2026-10-08-p0-foundation.md`.

Programme state (from the user, 2026-10-08): pre-interview passed, team of 5 formed. Chin Hin has provided no data. Timing is rolling and flexible.

---

## Phase checklist

| Phase | Scope | Status |
|---|---|---|
| P0 Foundation | Web skeleton, schemas, data + MANIFEST + loaders, deep public-data research, synthetic generator, rule calculator + tests | ⬜ Not started |
| P1 Board | Capacity check, planner, web board, KPI tiles, recommendation card | ⬜ Not started |
| P2 Capture | LLM interface, Intake + Matching agents, orders inbox, confidence states | ⬜ Not started |
| P3 Decide & write | Writer agent, approval checkpoint, ledger, ask-the-board | ⬜ Not started |
| P4 Pitch-ready | Data realism, demo script, backup demo, deploy decision, rehearsal | ⬜ Not started |

Status vocabulary — use these exactly, and never round up:

- ⬜ **Not started**
- 🔶 **In progress** — say precisely what works and what doesn't
- ✅ **Done** — built *and* verified. If it compiles but was never run, it is not done.
- ⛔ **Blocked** — name the blocker and who/what unblocks it

---

## P0 — Foundation (current phase)

| Item | Approach | Status |
|---|---|---|
| Project skeleton | Next.js + TypeScript, vitest, ESLint, `tsc`; read current docs first | ⬜ |
| Schemas | zod: capacity, orders (with per-field confidence), projects (delay-cost card), customers (margin card), ledger row | ⬜ |
| Manifest + loaders | `data/MANIFEST.md`; loaders throw on files with no manifest row or kind `real` | ⬜ |
| Deep public-data research | `data-steward` researches DOSM, LAD, carrying cost, Chin Hin disclosures, market data; records each hit and each "not findable"; verdicts on OQ-10 and OQ-11 | ⬜ |
| Synthetic generator | Seeded, config-driven, calibrated to public aggregates, labelled `synthetic`; trained model only if research justifies it | ⬜ |
| Delay-cost + margin functions | `(Σ price × 10%) ÷ 365 + idle site cost`, only past deadline; contribution margin | ⬜ |
| Rule comparator + fairness | More ringgit wins; ~10% close call → first confirmed; confirmed orders never bumped; move before refuse | ⬜ |
| Tests | Includes the RM300m block ≈ RM82,192/day vs RM18k margin worked example | ⬜ |

---

## Verification ledger

What has actually been run, not what has been written. A row here needs a real command and a real result.

| Date | What was verified | How | Result |
|---|---|---|---|
| 2026-10-08 | Toolchain on the lead's machine | `node --version`, `npm --version`, `pnpm --version`, `python --version`, `uv --version`, `git --version` | Node 24.11.0, npm 11.6.1, pnpm 10.12.1, Python 3.13.14, uv 0.11.26, git 2.47.0 present |
| 2026-10-08 | Pitch-pack files extracted intact | SHA-256 compare of `refdocs/context/*.md` against the zip contents | All 16 files identical |
| 2026-10-08 | Secret-guard hook (Node port, `.claude/hooks/check_secrets.mjs`) behaves | Scratchpad script piped 11 payloads: planted Anthropic key via Write, Edit and MultiEdit; planted JWT; clean code; allowlist pragma; `.env.example`; `.env`; malformed JSON; empty stdin; non-write tool. `settings.json` parsed as valid JSON | 11/11 as expected: exit 2 on the four planted secrets, exit 0 on the rest. (This replaced an earlier Python hook, 9/9, since deleted.) |
| 2026-10-08 | Research arithmetic | Recomputed by hand: 300e6×10%÷365 = 82,191.78; 500,000×10%×30÷365 = 4,109.59; 100,000×10%×139÷365 = 3,808.22; Q2 FY26 segment growth rates and PBT margins from the Bursa figures; Selangor+Johor shares 25.5%+19.6% | All match the figures written in `refdocs/research/` |

---

## Known gaps

- No code, no tests, no `package.json` — all commands in CLAUDE.md "Running it" are plans until P0 lands.
- Secondary research is done (`refdocs/research/`) but is excerpt-level: no full annual report, paper or statute was read end to end, and no data files were downloaded. P0 Task 4 does that properly.
- Pitch framing defaults are set by D-12 (OQ-13/14/17). Two facts remain unknown: OQ-15 (is the third AAC plant running?) and OQ-16 (do material shortages extend LAD?). The pitch must not claim either way.
- No file-structure doc: deliberately not scaffolded (a file map of a project with no files is fabrication). Write one once there is a tree to describe.
- No parity doc: single-surface project.
- Stack decided (D-05, confirmed); deploy target undecided (D-09).
- Open `ASSUMED:` items: see `changelog/DECISIONS.md` and PRD §8.
- Context pack is stale on programme status (it ends 5 Oct; the interview was 6 Oct).
