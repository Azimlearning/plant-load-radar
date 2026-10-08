# Plant Load Radar — Sources & References

> Raw research and external dependencies. The PRD is the *decided* view; this file is the *considered* view — including things that were looked at and rejected, which is often the more useful half.
> Record a source when it's chosen, and again when it's rejected. "We already tried that and here's why it didn't fit" is the single most expensive fact to re-derive.

Last updated: 2026-10-08

---

## Founding context documents

The documents this project was scaffolded from, unzipped from `files (5).zip` into `refdocs/context/` on 2026-10-08 (the inner `kabel-chin-hin-context.zip` was byte-identical and not extracted separately). Kept because the PRD paraphrases them and paraphrase loses detail.

| File | What's in it |
|---|---|
| [`context/00_README.md`](context/00_README.md) | Status at a glance and one-paragraph summary (as of 5 Oct) |
| [`context/01_EVENT.md`](context/01_EVENT.md) | Kabel programme, tiers, prizes, timeline, contacts, four self-contradictions |
| [`context/02_PROBLEM_STATEMENT.md`](context/02_PROBLEM_STATEMENT.md) | Chin Hin's brief and what each ask maps to |
| [`context/03_PROJECT_PLANT_LOAD_RADAR.md`](context/03_PROJECT_PLANT_LOAD_RADAR.md) | The full solution: rule, owner, board, agents, dashboard, rollout, formulas |
| [`context/04_RESEARCH.md`](context/04_RESEARCH.md) | Chin Hin, industry, comparables, law and finance figures; §E caution list |
| [`context/05_DECISIONS.md`](context/05_DECISIONS.md) | Pitch-phase decisions D01–D24 |
| [`context/06_COUNCIL_DEBATES.md`](context/06_COUNCIL_DEBATES.md) | Four debate rounds and verdicts |
| [`context/07_LOG.md`](context/07_LOG.md) | Day-by-day record 29 Sep – 5 Oct |
| [`context/08_COMMUNICATIONS.md`](context/08_COMMUNICATIONS.md) | WhatsApp thread with Aleef (Kabel) and drafts |
| [`context/09_CALENDAR.md`](context/09_CALENDAR.md) | Calendar events and nearby commitments |
| [`context/10_DECK.md`](context/10_DECK.md) | All 13 slides with speaker notes (deck v6) |
| [`context/11_SCRIPT.md`](context/11_SCRIPT.md) | Slide script with timings (~12 min) |
| [`context/12_INTERVIEW_PREP.md`](context/12_INTERVIEW_PREP.md) | Likely Q&A, delivery tips, what not to say |
| [`context/13_OPEN_ITEMS.md`](context/13_OPEN_ITEMS.md) | Pre-interview to-dos and risks (largely superseded) |
| [`context/14_STUDY_NOTES.md`](context/14_STUDY_NOTES.md) | Full study notes |
| [`context/15_ARTIFACTS_AND_FILES.md`](context/15_ARTIFACTS_AND_FILES.md) | Links and deck version history |

---

## External code & libraries

Nothing is installed yet. Choices from D-05 are listed so P0/P2 can verify them — **API behaviour must be read from current docs, not recalled** (use context7 or the library's docs).

| Name | What it does for us | Link | License | Status |
|---|---|---|---|---|
| Next.js | Web app (App Router) | https://nextjs.org/docs | MIT | Chosen (D-05); not yet installed; scaffold flags unread |
| TypeScript | Language for core, data, agents, UI | https://www.typescriptlang.org/docs/ | Apache-2.0 | Chosen (D-05) |
| zod | Schemas and validation; also the agents' extraction schema | https://zod.dev/ | MIT | Chosen (D-05); version differences unread |
| vitest | Unit tests | https://vitest.dev/ | MIT | Chosen (D-05) |
| ESLint | Lint | https://eslint.org/docs/ | MIT | Chosen (D-05) |
| LangGraph.js *or* Vercel AI SDK | Agent orchestration — decide in P2 after reading current docs; LangGraph is the deck's named orchestrator | https://langchain-ai.github.io/langgraphjs/ · https://ai-sdk.dev/docs | MIT / Apache-2.0 | Undecided (ADR in P2); API unverified |
| Python + uv (optional `pipeline/`) | Only if a trained data model is justified (D-06) | https://docs.astral.sh/uv/ | MIT / Apache-2.0 | Conditional on P0 Task 4 verdict (OQ-11) |

---

## APIs & services

| Service | Used for | Pricing model | Auth / key location | Status |
|---|---|---|---|---|
| LLM API (ASSUMED: Anthropic) | Intake extraction, Writer drafts, ask-the-board phrasing | Pay-per-use, small budget | `ANTHROPIC_API_KEY` in `.env` | Provider unconfirmed (D-08, OQ-05) |
| Vision / OCR for paper delivery orders | Intake agent on photos | Via the LLM provider's vision, or a free OCR library | Same key if via LLM | Undecided — choose in P2 |

Keys live in `.env` (git-ignored) and are read server-side only. Never commit a key; never expose one to a client bundle.

---

## Reference material

Studied but not depended on. Secondary research written for this project (problem statement, company, solution) is in `refdocs/research/`. Full list with links from the pitch phase is in `context/04_RESEARCH.md`; the ones most likely to matter for the build:

- DOSM Construction Statistics Q2 2026 — candidate public source for realistic demand volumes (not yet pulled).
- Housing Development Act LAD rule, 10% p.a. of purchase price, daily — [AskLegal](https://asklegal.my/p/late-delivery-payment-lad-liquidated-ascertained-damage-booking-fee), [PropertyGuru](https://www.propertyguru.com.my/property-guides/how-much-lad-can-i-claim-and-how-to-calculate-16823).
- Carrying cost 20–30% of inventory value per year — [Fishbowl citing ISM/APQC](https://www.fishbowlinventory.com/blog/what-is-carrying-cost).
- Shadow price of capacity as optimal internal price — [University of Rochester paper](https://urresearch.rochester.edu/fileDownloadForInstitutionalItem.action?itemId=4420&itemFileId=6640).
- WhatsApp-native AEC agent (structured data from site chats) — [ResearchGate paper](https://www.researchgate.net/publication/404955000_Chat_as_front_end_structured_data_as_output_A_whatsapp-native_AI_agent_for_the_AEC_industry).
- Chin Hin 2026 AI Hackathon with Kabel (a procurement planning agent already exists — ours must differ: allocation, not purchasing).

---

## Considered and rejected

| Option | Why it looked good | Why it lost | Recorded in |
|---|---|---|---|
| Power Apps + SharePoint as the MVP | Matches the deck exactly | Licence-dependent, hard for five people to parallelise; user: not restricted to it | D-05 |
| Python + Streamlit (first scaffold's choice) | Fastest first screen for a data person | User prefers a web-app stack; pins the team to Python | D-05 |
| Next.js front-end + Python (FastAPI) back-end | Clean split | Two toolchains and two deploys for a demo | D-05 |
| Database for state | Familiar | A demo on file data doesn't need one; hosted-ledger persistence is an open caveat (OQ-12) | D-05 |
| Microsoft Foundry orchestration | Fits Chin Hin's Microsoft stack | Needs Azure access the team may lack | D-05 |
| Asking Chin Hin for data / treating a data-sharing agreement as likely | Would make the demo "real" | User: Chin Hin has given no data and none is assumed | D-06 |
| Forecasting model | Looks impressive | Data too messy; brief warns AI may be premature | D-02 |
| AI-decides allocation | Automation story | Accountability | D-02 |
| "AI cuts forecast errors 30–50%" claim | Punchy stat | Traces to vendor blogs citing McKinsey — don't use | context `04_RESEARCH.md` §E |
