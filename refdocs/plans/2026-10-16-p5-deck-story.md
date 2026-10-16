# Plan — P5 Deck-story scenario

> First phase of `2026-10-16-deck-parity-to-trl3.md`. Execution doc: `refdocs/execution/2026-10-16-p5-deck-story.md`. ADR: D-20. Requested by the user 2026-10-16 ("1- yes": align to the revised deck's numbers).

## Why this exists

The revised deck (Oct 2026, slides 3, 7, 9, 10) says Project A costs **RM145k a day, RM435k for a 3-day slip**, Contractor B is worth **RM18k**, the board shows **weeks 41 to 46** with spare +1,200 / −700 / −2,000 / +4,100 / +2,500 / +1,000, and **two weeks are short, one already covered by pre-build**. The prototype shows RM575,342, RM30,705, twelve weeks and one short week. A judge who clicks through after reading the slides must see the slides' numbers.

## What's already covered

Rule, planner, build-ahead alternative, board, decisions, ledger, drafts, inbox. The week-43 structure (1,800 m³ free, 3,800 wanted, Project A 1,500, Contractor B 600, Projects D and C with float) already matches the slides; only prices, the other weeks and two display behaviours differ.

## Scope

**In**
- A second committed scenario, `data/synthetic/deck-story.json`, **derived from** the existing generated scenario plus `data/synthetic/deck-story-params.json`: six weeks (2026-W41 to W46) with the slide-9 spare figures by construction; Project A priced from RM530m (Avantro's GDV as an upper bound, as slide 7's footnote says) with a 3-day slip for a week's wait; Contractor B from an illustrative RM167k order at the 10.8% segment margin (public, Q2 FY26); all outside customers at that same margin. Manifest rows, a stale-file test, a test pinning every slide figure.
- The app uses the deck story; the original 12-week generated scenario stays as the stress case the 318 tests run on.
- A week that building ahead fully covers is shown as **covered**, not as a decision (slide 9: "one is already covered by pre-build, the other needs a call"). Weeks short stays 2; Decisions waiting becomes 1.
- Ringgit lines show their working: "RM145,205 a day × 3 days".
- The reply to the pushed-back customer carries a calendar date ("from Mon 26 Oct"), as slide 10.
- A float what-if on the board: "What if Project A had 20 days of float?" Read-only; it recomputes with the same calculator and shows Contractor B served.

**Out (with reasons)**
- Theme and layout changes: P6. Chart colours: decided in P6 with a side-by-side (the user's answer to the colour question was a bare "yes" to an either/or).
- The "RM246k delay cost avoided" tile and seeded history: P7 (finance view).
- Changing the inbox samples: P8.

## Approach

`deckStory = transform(generatedScenario, params)`: a pure function, same style as the generator, so the committed file can be checked for staleness. App pages read one constant, `ACTIVE_SCENARIO_FILE`. Existing tests keep using the generated file. New honesty and end-to-end tests run on the deck story.

## Risks & unknowns

| Risk | Confidence | Mitigation |
|---|---|---|
| Slide says RM435k; exact is RM435,616 (rounded rate) | High | Show the exact figure with its working; demo notes say the slide rounds |
| Outside margin uses PBT margin (10.8%), not contribution margin (D-13 added a fixed-cost share) | High | The deck states PBT margin; ADR D-20 records the change and that it favours internal projects slightly |
| /value page numbers change (largest project now RM530m) | High | Intended: it must agree with the board. Tests recompute from the data |
| Pre-build coverage changes who can be decided | Medium | Only weeks the planner proves covered are excluded; stress scenario unchanged (test) |

## Definition of done

- The board shows the six weeks of slide 9 with exactly those spare figures, "Weeks short 2", "Decisions waiting 1", Week 42 marked covered, Week 43 needing the call.
- Week 43's card: serve Project A, RM145,205 a day × 3 days = RM435,616; Contractor B RM18,0xx margin, moves to Week 44.
- With 20 days of float on Project A the what-if serves Contractor B.
- The reply draft says "Mon 26 Oct".
- All tests, lint, typecheck, `check:literals` and build pass; the changelog's Verified line names them.
