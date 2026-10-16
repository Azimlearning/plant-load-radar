# Demo notes and Q&A sheet

> For Azim, rehearsing the Plant Load Radar pitch; the team can use it as a second reader. Every number below was read from the running prototype on 2026-10-09 (all synthetic and illustrative: not Chin Hin's). The slides in `refdocs/Docs/` are untouched; where the prototype differs from a slide, this sheet says what to say.

## 1. The live walk-through (about five minutes; cut from the bottom)

> Rewritten 2026-10-16 for the revised deck and the five people on slide 6. Figures below were read from the production build that day (all synthetic and illustrative). Open the link; the first thing on every page is the yellow notice. Say it once, out loud: **synthetic data, fictional parties, not Chin Hin data.**

| Step | Click | Say | On screen (check as you go) |
|---|---|---|---|
| 1 | **Overview** | "The deck, as a working site." | Three public figures with sources (+83% AAC capacity, RM5.29b pipeline, 10.8% margin), then the rule on one example: serve Project A (RM435,616 = RM145,205 a day × 3 days) and offer Contractor B (RM18,073 margin) Week 44. |
| 2 | **Board** (scheduler, daily) | "One screen. Two weeks short; one is already covered." | Weeks 41 to 46 as slide 9: +1,200, −700, −2,000, +4,100, +2,500, +1,000. Week 42 is "covered by build-ahead", Week 43 is the one decision. "Delay cost avoided" tile is a **seeded** history (RM245,808), labelled not measured. Scroll to the float what-if: with 20 days of float Project A costs RM0 and Contractor B is served. |
| 3 | **Try it** (intake agents) | "A message becomes an order." | Pick the deck's message. Five chips (four confirmed, PO missing), the four-step trace, the calculator's sentence ("1,800 m³ free, 3,800 requested"), the draft question to the project planner. Then "Read the sample sales-order export" (five Kingdee-style rows). Photos need the model reader (not on in the hosted demo). |
| 4 | **Decisions** | "A person decides, and edits the words." | Type a name, edit the reply to Contractor B ("from Mon 26 Oct"), **Approve and send**. It lands in the **Outbox** with who approved it. Nothing is really sent. |
| 5 | **Weekly huddle** (plant manager) | "Thirty minutes, built from what is open." | Timer at 30:00, four blocks (15, 5, 5, 5), the build-ahead plan to confirm, the reserved slots, and after your decision the credit to the plant. |
| 6 | **Ask the board** (sales) | "Plain words, calculator answer." | "Can we take 800 m3 for Johor next week?" gives "Yes in Week 44 (4,100 m³ free). Week 43 would go 2,800 m³ short." plus a draft reply. |
| 7 | **Call-offs** (project director) | "Plan ahead, get protected." | Reserve 300 m³ for Project D in Week 46; the week's spare drops from 1,000 to 700 m³; unused slots are released 14 days before the week. |
| 8 | **Finance** | "Every decision, both sides, who, when." | Seeded history plus your decision; the balance flag; **Download as CSV**. |
| 9 | **Pilot scorecard** | "Baselines are empty on purpose." | The 90-day plan; four measures; one week under four policies (rule RM18,073 waiting; first-confirmed RM435,616; group-first RM453,689). With 20 days of float the rule waits RM0 and group-first charges an outside order RM18,073. |
| 10 | **Sources** | "Every number is public with a source, or invented and labelled." | The manifest, the twelve references, and the public fact tables with links. |
| 11 | **Ledger** or **Decisions** → *Start the demo again* | (hosted version only) | Clears your browser's decisions, call-offs and outbox so the next run starts clean. |

If time is short, stop after step 6; steps 7 to 10 are one sentence each.

## 2. What to say plainly (before a judge asks)

- "The intake you see is a **rules reader** unless a key is switched on. A model reader is built (`src/llm/`) and sits behind the same check: nothing is Confirmed unless its words are in the message. **It has not been run against the live service yet**; the first live evaluation needs a key."
- "The drafts are **templates** (a model can reword them, and may not add a number). Nothing is sent: the Outbox is simulated; there is no WhatsApp, Teams or email connection in this demo."
- "All data is **synthetic or public**. Chin Hin has given us none. Every assumed input on the cost page says what real data replaces it."
- "The deck shows Power Apps on Excel or SharePoint; this prototype is a web app so you can click it. The design is the same; the platform is a delivery choice."
- "A typed name is not a login. It exists so every ledger row names a person."

## 3. Where the prototype and the deck differ

> Updated 2026-10-16 for the **revised** deck (15 slides, "Revised pitch · October 2026"). Since P5 the app shows the deck story (ADR D-20), so the headline numbers match; sections 1, 5 and 6 were rewritten the same day.

| Slide says | Prototype shows | What to say |
|---|---|---|
| Slides 3, 7, 9: RM145k a day, RM435k for 3 days | RM145,205 a day × 3 days = **RM435,616** | "The slide rounds the daily rate to RM145k; the app keeps the exact figure and shows its working." |
| Slides 3, 7, 9: Contractor B about RM18k | **RM18,073** (an illustrative RM167k order at the public 10.8% segment margin) | "Same method as slide 15; the slide rounds." |
| Slide 7: Project A is an upper bound (Avantro's GDV) | Project A is priced from RM530m, labelled illustrative | "It is the largest case, so it is an upper bound, as the footnote says." |
| Slide 9: weeks 41 to 46; two short weeks, one covered by pre-build | Exactly those six weeks and figures; Week 42 shown as covered, Week 43 needs the call | Matches. |
| Slide 9: "3 orders to check" | 18 of 21 lines | "The samples are deliberately hard; most are 'likely' because no PO number is given." |
| Slide 9: "Delay cost avoided, Oct RM246k" | A tile "Delay cost avoided, earlier weeks" showing **RM245,808**, labelled a seeded demo history (three invented decisions), plus a separate "ringgit at stake, decided, not a saving" tile for your own decision | "Nothing has been measured. The seeded history is there so the tile has something to add up; the pilot measures the real figure." |
| Slide 9: "Updated 9:42 AM · 3 new orders read" and channel chips | Orders to check is 18 of 21 lines; the demo's messages are dated Mon 12 Oct 9:42 AM; channel is shown on each message | "The samples are deliberately hard." |
| Slide 10: reply offers "Mon 26 Oct" | Same wording and date | Matches. |
| Slide 10: "Approve and send", "Edit" | Editable drafts, **Approve and send** to a simulated Outbox, **Record decision only**, **Send to the huddle** | Nothing leaves the app; the Outbox stands in for WhatsApp and Teams. |
| Slide 7, second example: 20 days of float, so Contractor B is served | A what-if card on the board shows it | Read-only; nothing is recorded. |
| Slides 3, 6, 7, 8, 9: Power Apps, Foundry, LangGraph, Power Automate | A web app, no orchestration framework, no language model has run | "That is the production path. For the MVP, four typed steps in a function were cheaper to build and to read." |
| Outside margin | The deck's PBT margin (10.8%), not a contribution margin | "Conservative for outside orders: a contribution margin would make them worth more." |

## 4. The platform's AI review of the submission (91/100) and how we answer it

Scores: clarity 23/25, relevance 24/25, innovation 21/25, feasibility 23/25. Its weaknesses and red flag, checked against the prototype:

| Their point | Is it fair? | What the prototype shows | Honest answer |
|---|---|---|---|
| **Relies on accurate, current schedule and milestone inputs from project planners, which may lag** | Yes | Late-handover cost comes from each project's deadline, projected handover, buffer and price. Those are set once per project and are inputs, not guesses by the system. | "Stale inputs are the main data risk. Month one rebuilds recent decisions from WhatsApp and paper to see how stale they really are, and the weekly huddle re-confirms the projects that are contested. A wrong input shows up in the ledger as a wrong ringgit, where someone can see and correct it." |
| **The 10% tie-breaker could meet resistance from outside clients if internal jobs keep winning** | Partly | Week 43 shows internal winning by a wide margin (RM435,616 against RM18,073) because a legal penalty is far larger than a margin. It also shows internal requests with float costing RM0 to wait, so outside orders go first in that case. The ledger logs both sides. | "Internal wins only when a handover is truly at risk; with float it costs nothing to wait. The 10% band applies only when the two values are nearly equal, and then the **earlier confirmed request goes first**, whoever it is. Confirmed orders are never bumped, and a request that loses is offered the next free week, not refused. Group finance reviews the ledger monthly, so any drift towards one side is visible." |
| **Pre-build limits (yard space, curing cycle) are only touched on, not modelled** | Yes | One stock limit of 1,000 m³, shown on screen and labelled an assumption. The board now also says that yard space and the autoclave's curing cycle are not modelled. | "We model one stock limit on purpose. The plant's real yard and curing constraints replace that single number in the pilot; they are on the data request list." |
| **Red flag: site managers who submit call-offs late could force sudden, high-penalty overrides** | Reasonable | Confirmed orders are never taken back; reservations lapse if unused; a late call-off competes under the same rule as any new request. | "A late call-off cannot bump an order that is already confirmed. Early confirmation earns protected capacity, and unused reservations are released, so the incentive is to confirm early. A late one with a large penalty at stake does win a contested week, which is the intended behaviour, and it shows up in the huddle with its ringgit." |

## 5. Hardest questions and honest one-line answers

1. **Why not just forecast better?** Forecasting does not decide who is served, and the data is on WhatsApp and paper. Fix the decision and the capture first; forecasting comes after a few months of clean data.
2. **What share of RM1.56m do you save?** We do not know and will not guess: those inputs are invented, month one replaces them with your data, and month three measures the saving.
3. **If our plant is short, the site buys AAC from a competitor. Where is RM145k a day?** Then the real delay cost is the extra paid outside; RM145k a day is the ceiling when no substitute arrives in time. The page labels it an upper bound, charged only after the deadline.
4. **Doesn't building ahead raise working capital?** It is capped (1,000 m³ in the demo), only fills a known short week, and the pilot measures stock before and after, so a rise would show.
5. **Why would a plant manager follow a rule that costs his margin?** The ledger records the ringgit he gave up for the group so finance can credit his plant, and the huddle gives him a say on exceptions. The rule also protects his margin whenever an outside order is worth more.
6. **Is the AI deciding?** No. A calculator produces every number, a rules reader (a model later) writes words around them, and a named person approves. The server ignores any figure in a form.
7. **Isn't an agent pipeline overkill for WhatsApp?** It meets the plant where it is: orders keep arriving by WhatsApp and the agents turn them into data. Each step is small and can be switched off without breaking the board.
8. **What if there is not much data?** The first phase rebuilds recent decisions from chats and paper; that is the baseline.
9. **Does a materials shortage extend the legal deadline?** We do not know and the page says so; it is why the delay cost has a low case of zero days.
10. **Why a web app when the deck says Power Apps?** The prototype had to be clickable by anyone with a link. The data model and rule are platform-independent.

11. **Has a language model actually run?** Not in this build. The model layer is written and tested against a scripted stand-in (it cannot invent a confirmed value or add a number), and the evaluation harness exists. The rules reader's own result on the 22 invented messages is committed (`refdocs/evals/rules-reader.md`) as the baseline a model must beat. The first live run needs a key and costs a few cents.
12. **Why not train your own model?** The data is invented, so a model trained on it would learn our own generator. The cheap reader is rules plus an API model with grounding. After the pilot's first month, with real messages, a small fine-tuned tagger for the five fields could cut cost and keep messages on the plant's machine. Forecasting stays out of scope until the data is clean.
13. **Where does the RM246k on slide 9 come from?** The app shows a **seeded** history (RM245,808 from three invented decisions), clearly labelled; nothing has been measured. The pilot measures the real figure against a month-1 baseline.

## 6. Not built, and what the pilot or local development would do first

- **A live model run.** Needs `ANTHROPIC_API_KEY` on the server and `PLR_LLM_MODE=live` (see `refdocs/guides/env_setup.md`); then `npm run eval:model` and the photo reader on `/inbox/try`. Untested against the real service in the cloud build.
- **Real connections:** WhatsApp, Teams, Power Automate, Kingdee write-back, Power BI. The outbox, the CSV export and the sample export stand in for them.
- **Real yard and curing constraints; a real carrying rate; real margin per m³** (one stock limit and the public PBT margin stand in).
- **More than one plant, accounts, a database.** A typed name is not a login; the hosted demo keeps each visitor's state in a cookie.
- **First data to ask for:** recent orders and allocation decisions (even WhatsApp or paper), weekly output and downtime, stock by plant, margin per m³ by product and customer, project handover deadlines and buffers, the real Kingdee export layout.
