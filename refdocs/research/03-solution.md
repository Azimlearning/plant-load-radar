# 03 — The solution, researched

> Stress-tests Plant Load Radar (`refdocs/context/03_PROJECT_PLANT_LOAD_RADAR.md`) against theory, comparable products and what we learned about Chin Hin. Labels: ✅ primary source seen · 🟡 reputable secondary · 🔶 vendor/self-reported · ❓ inference or unverified. Researched 2026-10-08.

## 1. Verdict in one paragraph

The core idea — decide scarce capacity by comparing the value at stake, with a named owner and a human checkpoint — is well supported by theory and fits where the market is going (constraint-aware, margin-aware order promising; human-in-the-loop agents). Nothing found contradicts it. Five things need sharpening before the pitch: the "capacity is tight" framing (01 §2), the fragility of the RM82k/day figure (01 §3), the relationship to Chin Hin's Kingdee ERP and AI Quotation Agent (§4), the third customer class (Singapore export / product mix) (§4), and the *autonomy ladder* framing of "AI decides is premature" (§5).

## 2. Theory — why a ringgit comparison is a defensible internal price

| Source | What it says (from the abstract/excerpt only) | Use |
|---|---|---|
| Rochester paper, "shadow price of capacity is the optimal internal price; full-cost charging overstates opportunity cost" (already in context `04`; not re-read this round) | The economic basis for "no transfer-price policy needed" | Cite as the theory behind the rule 🟡 |
| *Decentralized capacity management and internal pricing*, Review of Accounting Studies (Springer, 2010) | In a two-division firm, decentralised capacity works with suitably chosen transfer prices; but allowing divisions to **negotiate adjustments to capacity rights** creates a **dynamic hold-up problem** — the downstream division may inflate its capacity demands opportunistically | 🟡 Direct support for our fairness rule 1 ("plan ahead, get protected; unused slots are released"): **use-it-or-lose-it is the mitigation for over-reserving.** Say this explicitly. |
| *Capacity Rights and Full-Cost Transfer Pricing*, Management Science (2021) and a UCLA working paper | Studies full-cost transfer prices with capacity rights | 🟡 Background; we avoid full-cost prices by design |
| MIT OCW 15.010 notes on vertical integration and internal pricing; Columbia working paper on external and internal pricing in multidivisional firms | Textbook treatments: the right internal price reflects opportunity cost, which equals the external margin when capacity binds | 🟡 Background |

Caution: I read abstracts and excerpts, not the full papers. Before quoting any of them on stage, someone on the team should read the relevant section. ❓

## 3. How the ringgit rule maps onto established supply-chain vocabulary

The supply-chain trade already has names for what our rule does. Using them makes the proposal legible to anyone with an operations background in the room:

- **Allocation under scarcity** — rationing a constrained supply across competing demands by priority rules.
- **Order promising (ATP/CTP)** — "available-to-promise" and "capable-to-promise" check whether a new order can be committed. Our "move before you refuse" (offer the next free week) is order promising with a re-dated offer. ❓ (standard APICS-family terms; I did not re-source them this round)
- **Profitable-to-promise (PTP)** — promising by margin as well as feasibility. A vendor (YaanAI, "Promise.AI") describes a decision stack "Feasibility Check → RBA-ATP → Product Allocation → CTP → … → PTP". Our rule is, in effect, PTP with cost-of-delay on the internal side. 🔶 (vendor post; the terminology, not its claims, is what we borrow)

**Pitch line (❓ suggestion):** "It's profitable-to-promise for a vertically integrated group: the internal customer's price is its cost of delay."

## 4. Comparable products and cases

| Case | Claim | Reliability | Lesson for us |
|---|---|---|---|
| **Holcim — AI-assisted ordering over WhatsApp (Spain pilot)** | Digital ordering adoption 25% → 93%; ~66% of AI-proposed orders accepted; human escalation retained; testing exposed inappropriate suggestions and timing issues | 🔶 Reported by one participant's portfolio citing a McKinsey interview; "not an independent audit" (its own words) | A building-materials major used **WhatsApp as the interface** — validates our Intake premise. Quote the shape, not the percentages. |
| Vantegrate "Sellium" (WhatsApp B2B ordering for construction materials; ready-mix with mixer-truck scheduling) | Orders captured from text, voice notes and photos; checks stock and price list; "if something does not add up, it asks instead of guessing"; summarises before entering | 🔶 Vendor marketing | Same pattern as ours. Pitfalls they list — messy catalogue, confirming without checking, no summary-back, exceptions with no owner — double as our test cases. |
| OpenMax × Singapore building-materials distributor | 200+ WhatsApp messages/day; intent classification; invoice OCR | 🔶 Vendor case study | Confirms the problem is real in the region (Singapore, WhatsApp + WeCom). |
| materialpro WhatsApp AI; Duotach WhatsApp order bot; Chat2Cash (open-source repo docs) | Photo/voice/text → structured record; tool-calling schema with nullable fields and a confidence score | 🔶 Vendor / hobby | **Implementation pattern for Intake:** force structured output via tool calling, make fields nullable, return a confidence, keep the raw message beside the parsed record for audit. Matches our confirmed/inferred/missing/conflicting states. |
| OmniFlow (Devpost hackathon project) | WhatsApp + dashboard for construction procurement; ingestion and verification do "the heaviest lifting"; "the biggest barrier … isn't the intelligence, it's the interface" | 🔶 Hackathon entry | Peers in this space exist at hackathon level; our edge is the **decision rule and the owner**, not the capture. |
| *Agentic ERP* (arXiv 2607.17331) | Role-aligned LLM agents with a **risk-tiered human-in-the-loop harness**; conflicts resolved by hard constraints first, then priority order, then **escalate to a human with context**; 365-day *simulation* with zero stockouts | 🟡 Preprint; simulation only (the paper says so) | Academic backing for our checkpoint design and for "hard constraints before preferences". Note: they escalate to a human — we also keep the human, but at the plant, not up the chain. |
| LLM multi-agent inventory management (arXiv 2602.05524) | An LLM agent finds optimal ordering in a restricted scenario but "fails to perform effectively in different supply chain scenarios"; they add similarity-matched memory | 🟡 Preprint | **Supports D-02/D-03**: don't let the model compute or decide; it is unstable across scenarios. Cite when asked "why not let the AI decide?" |
| ProvisionAI "LevelLoad" (autonomous deployment planning) | Agents act "without waiting for human intervention"; 97% first-tender acceptance, −60% shipment volatility | 🔶 Vendor white paper | The opposite design philosophy (fully autonomous). Useful contrast: our checkpoint is a choice, and it is the *first rung* of an autonomy ladder (§5). |
| Capgemini "Agentic AI in S&OP" | Continuous planning with agent personas | 🔶 Marketing | Shows big consultancies sell this to consumer goods; we do it for one plant, on tools they have. |

## 5. Where our design should change or be said differently

1. **Capacity narrative (OQ-13).** See 01 §2. Add a sentence to slide 2/4: scarcity is by plant, product and week; the rule also tells you what to do with slack.
2. **Delay-cost realism.** Add a *schedule-sensitivity factor* and keep RM82k/day as the labelled upper bound (01 §3). Candidate ADR for P0.
3. **Margin per constrained resource, by product.** Panels earn ~1.5× block margin (FY2017 MD&A ✅) and Singapore is a major panel customer; precast competes for moulds; ready-mix for truck dispatch. The external-side value should be **contribution margin per unit of the binding resource** (per m³ of autoclave time, per mould-slot, per truck-hour), not per order. This also makes the "one rule, three levers" claim concrete. ❓ idea → `idea-catalyst` can develop it.
4. **A third customer class: export.** Singapore panel orders are external, often key accounts, and in a different currency/market. The margin card has a *key-account flag*; consider an explicit `export` attribute. ❓
5. **Autonomy ladder instead of "premature".** Chin Hin's own stated end-state is agentic replacement of workflows (02 §5). Reframe slide 7's "still premature" as: *Stage 1 (now): agents prepare, a person approves. Stage 2: auto-approve decisions inside a ringgit threshold after the ledger shows the rule matches the human's choices. Stage 3: autonomous within guardrails.* The ledger of approved decisions is what earns autonomy — it doubles as the audit trail. (Agentic ERP's risk-tiered harness is the academic analogue.) ❓ suggestion; needs an ADR if adopted.
6. **ERP relationship (OQ-14).** Chin Hin is deploying a Kingdee ERP with embedded AI agents and an AI Quotation Agent prototype (02 §5). Say: Plant Load Radar is the **capture-and-decision layer beside the ERP**: it handles the WhatsApp/paper orders the ERP never sees, makes the allocation decision, and writes clean order lines and a decision ledger to whatever system of record Chin Hin chooses. Whether Kingdee exposes the integration surface we would need is unknown. ❓
7. **Incentive mechanism is grounded.** Chin Hin reports by segment with inter-segment eliminations (RM336.5m in 1H FY26 ✅), so a plant that gives up outside margin for an internal project can be credited at group level via the ledger — the "finance credits the plant" answer is mechanically plausible. ❓ (we don't know their internal accounting)
8. **Language realism for Intake.** Malaysian plant WhatsApp is typically code-mixed (English/Malay/Chinese/shorthand — the deck's own example: "need 1,500 m3 AAC 100mm by Tue 20 Oct. Can confirm ya"). The Chat2Cash docs warn that code-mixed scripts can inflate token counts and silently exceed budgets. Build the Intake test set from code-mixed samples, not clean English. ❓ (inference from a related project's note on Hinglish)

## 6. Risks surfaced by the research

| Risk | Why | Mitigation |
|---|---|---|
| A judge challenges "capacity is tight" | Third AAC plant, soft market | Rehearse the three framings (01 §2); do not claim a shortage today |
| The headline LAD number is attacked | Per-purchaser, post-deadline, EOT possible | Present it as an upper-bound illustration; show the sensitivity factor |
| "You duplicate our Kingdee AI quotation agent" | Overlapping intake | Position as upstream capture + decision layer; ERP-agnostic |
| "Why only a human checkpoint?" | Chin Hin's ladder ends in agentic | Autonomy ladder slide / answer |
| Over-reliance on vendor numbers | Most comparables are marketing | Quote patterns and designs; never quote percentages as evidence |
| Web app vs "Power Apps" | Deck says Power Apps | Say plainly: web prototype now; Power Apps/Kingdee-adjacent is the production path (PRD OQ-04) |

## 7. What to cite, and what not to

**Safe to cite:** LAD statute and Federal Court rule; DOSM Q2 2026; Chin Hin Q2 FY26 segment results; the third-plant announcement (as a *plan*); Chin Hin's own AI Hackathon release; the Kingdee agreement; the hold-up result (as "research on capacity rights suggests…").
**Cite with a label:** Holcim WhatsApp pilot (self-reported pilot figures); vendor patterns.
**Do not cite:** "AI cuts forecast errors 30–50%"; vendor ROI percentages (97% tender acceptance, 85% less data-entry time, 99.2% accuracy); AAC per-piece price blogs; the paid customs-data records.

## 8. Sources

- Springer, decentralised capacity management and internal pricing: <https://link.springer.com/article/10.1007/s11142-010-9126-3>
- Management Science, capacity rights and full-cost transfer pricing: <https://dl.acm.org/doi/abs/10.1287/mnsc.2019.3477>; UCLA working paper: <https://www.anderson.ucla.edu/documents/areas/fac/accounting/working-papers/stefan%20paper.pdf>
- MIT OCW 15.010: <https://ocw.mit.edu/courses/15-010-economic-analysis-for-business-decisions-fall-2004/4678c1744e47662b9b0c358f82760c5e_trans_vert_int.pdf>; Columbia: <https://drupalgsb-test.paas.cc.columbia.edu/sites/default/files-efs/pubfiles/1036/1036.pdf>
- Agentic ERP: <https://arxiv.org/html/2607.17331>
- LLM multi-agent inventory management: <https://arxiv.org/pdf/2602.05524>
- Capgemini S&OP: <https://www.capgemini.com/insights/research-library/agentic-ai-in-sales-and-operations-planning/>
- ProvisionAI: <https://provisionai.com/white-paper-agentic-ai-supply-chain/>
- YaanAI Promise.AI post: <https://www.linkedin.com/posts/yaanai_supplychain-supplychainplanning-demandplanning-activity-7441842453659287552-2LlJ>
- Holcim ordering case (portfolio): <https://juanbeltran.ch/portfolio/worlds-first-autonomous-agentic-ai-in-construction>
- Vantegrate: <https://vantegrate.com/en/sellium/whatsapp-order-taking>, <https://vantegrate.com/en/industries/construction-materials>
- OpenMax Singapore case: <https://docs.icoco.ai/case-studies/building-materials>
- materialpro: <https://www.materialpro.io/en/features/whatsapp-ai>; Duotach: <https://duotach.com/en/blog/bot-whatsapp-tomar-pedidos>; Chat2Cash docs: <https://mintlify.wiki/swayam-mishra/Chat2Cash/how-it-works>
- OmniFlow (Devpost): <https://devpost.com/software/omniflow-1fep8g>
