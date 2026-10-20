# Plan — L3 product gaps (local development)

> Source: `refdocs/handoff/continue-dev-prompt.md` §3 L3. Order and exit criteria only, no dates (D-11). Authority: the deck (slides 7, 9, 10) must not be contradicted.

## Goal
Close four known gaps so the demo walk-through has no dead ends, without adding surfaces or touching the rule.

## Items, in order
1. **Longer call-off horizon.** The deck story keeps weeks 41 to 46 exactly as slide 9 on the board by default. Six quiet scripted weeks (47 to 52) sit behind a "Show more weeks" control; the call-off form lists every week from the earliest reservable one (Week 46) to Week 52.
   - Exit: slide 9's spare figures unchanged on the default view; the call-off form offers more than one week; a call-off still cannot change a recorded decision (invariant test in `calloffs.test.ts` stays green and gains a longer-horizon case).
2. **Reserved slots on the board** (slide 7, guardrail 2). The board lists slots with their release dates, including the visitor's own call-offs.
   - Exit: a test shows the seeded slots on the board model and a new call-off appearing; every figure goes through `Figures`.
3. **WhatsApp export import** on `/inbox/try`: accept a pasted chat export (`[date, time] name: text`), split into messages, run the same pipeline. Rules reader first, plus Bahasa Malaysia number words in the rules reader with gold cases.
   - Exit: unit tests for the splitter (both common export shapes, multi-line messages, system lines ignored) and for number words; a cap on the messages per paste.
4. **Send to the huddle as a stored state.** A per-visitor flag on a pending decision (same store pattern as the outbox), shown on `/huddle`.
   - Exit: flag survives a reload, appears on the huddle, does not alter the calculator's output or the recorded decision, and clears when the decision is recorded.

## Out of scope
New pages, forecasting, any change to the rule or cost formulas, live model work (L1, needs the user's key), deployment (L5).

## Risks
- Extra weeks shift anything that averages over all weeks (`value.ts`). Check `/value` figures and tests; if they move, derive them from the displayed weeks and record why.
- Cookie caps (about 3.5 KB) bound the huddle flag store; keep entries tiny.
- Any digit in a new UI string must be registered with `fig.text(...)` (figure-accounting tests).
