# Secondary research — index and headline findings

> Written 2026-10-08 for the Plant Load Radar team (and its subagents). Secondary research on three things: the **problem statement** ([01](01-problem-statement.md)), **Chin Hin** ([02](02-company.md)) and **our solution** ([03](03-solution.md)). It builds on `refdocs/context/04_RESEARCH.md` rather than repeating it.
> Chin Hin has given us no data. Everything here is public information, and every claim carries a confidence label.

## How this was done, and its limits

- 15 web searches on 2026-10-08. I read the **search excerpts** of each source, not every full document. "Verified" below means the figure appeared in an excerpt of a primary source (Bursa filing, DOSM release, company release, statute text); it does not mean I read the whole filing.
- Academic papers: abstracts and excerpts only.
- Paywalled market reports (IndexBox, 6Wresearch) were not opened beyond their previews. Vendor and blog numbers are labelled as such and not relied on.
- No full annual report was read. `data-steward` should pull the FY2025 annual report and the Q2 FY26 quarterly report PDFs into `data/public/` in P0 Task 4 (links in 02).

| Label | Meaning |
|---|---|
| ✅ | Seen in an excerpt of a primary source (filing, official statistics, statute, company release) |
| 🟡 | Reported by reputable press or a law firm; not checked against the primary document |
| 🔶 | Vendor, self-reported or marketing claim — do not present as fact |
| ❓ | My inference or an unverified item — needs checking before anyone relies on it |

## The eight findings that matter most

1. **"Capacity is tight" needs a better answer than the brief gives us.** Chin Hin is nearly *doubling* AAC capacity (1.2M → 2.2M m³/yr) in a softening market (Rehda: 59% of developers hold unsold completed homes; construction work growth cooling to 8.8%). A judge will ask: *why is there a shortage after you built a third plant?* The honest answer is plant-by-plant, product-by-product and week-by-week (precast moulds, ready-mix dispatch, ramp-up, panel vs block mix), plus the ramp-up period. See 01 §2 and 03 §3. ✅🟡
2. **The pitch's headline number is a model, not a fact — and it is fragile.** RM300m × 10% ÷ 365 = RM82,192/day assumes every unit in the block slips one day per day of material delay. LAD is owed per purchaser, only after each unit's own deadline, and the clock starts at the booking fee (Federal Court, *PJD Regency*, Jan 2021). Add a "schedule sensitivity" factor to the delay-cost card. See 01 §3. ✅🟡
3. **Chin Hin is already rolling out a Kingdee ERP with embedded AI agents** (agreement signed 13 Aug 2025; includes an "AI Quotation Agent" prototype). The brief's "no new ERP" fits — but our Intake agent overlaps Kingdee's AI ambitions. Position Plant Load Radar as the capture-and-decision layer that sits *beside* the ERP and feeds it. See 02 §5 and 03 §4. ✅
4. **Chin Hin's own AI ladder is explicit**: add AI to processes → automate end-to-end workflows → replace workflows with agentic AI entirely (Abel Saw, Microsoft customer story). Our "human checkpoint, AI-decides is premature" stance must read as a *stage gate on that ladder*, not timidity. See 03 §5. ✅
5. **Chin Hin's profit is thin where it counts.** Q2 FY26: revenue RM1.05bn (+10.3%) but net profit RM7.68m (−63.9%, lowest in ~5 years); AAC+precast PBT margin ≈10.8%, ready-mix ≈10.3% (PBT, not contribution margin). Management priority: "enhancing productivity and operational efficiency across the building materials segment". Utilisation and margin per m³ are exactly the levers a CFO cares about. See 02 §3. ✅
6. **There is a third customer class the rule ignores: Singapore export.** Management has long described Singapore as the largest export market for AAC wall panels (HDB uses them); panels earn about 1.5× block margin (FY2017 MD&A, ✅). The margin side of the rule should be per m³ of the *constrained resource*, by product, not one number per customer. See 03 §4.
7. **The academic case for our rule is real but has a known failure mode.** Capacity-allocation / internal-pricing literature supports comparing marginal values; one paper identifies a dynamic *hold-up* problem when divisions negotiate capacity rights (they over-reserve). Our "use it or lose it" fairness rule is the right mitigation — say so. See 03 §2. 🟡
8. **Public order-level data does not exist; public margin and price anchors do.** We found DOSM construction output, CIDB/DOSM material prices, Chin Hin's segment results, LAD terms and carrying-cost ranges. We found **no** public AAC RM/m³ selling price or plant order data. So the order stream stays `synthetic` (PRD OQ-10), calibrated to the anchors above. See 01 §5.

## Corrections to the context pack

| Context says | What I found | Action |
|---|---|---|
| `04_RESEARCH.md` §A lists "Metex Steel" among Chin Hin brands | Wire mesh (Metex) was **disposed in FY2025** — Chin Hin's "strategic exit from wire mesh"; Q2 FY26 shows no wire-mesh revenue ✅ | Don't mention Metex as current. Context left unedited (read-only); note here. |
| `03` §9 / deck: "Scale: 1 pp utilisation on 2.2M m³ = 22,000 m³" | Arithmetic ✅. But 2.2M is *nameplate after the third plant*; commissioning status is unconfirmed (see 02 §4) | Say "at full nameplate". |
| `01_EVENT.md`/deck cite "RM5.4bn" pipeline | Feb 2026 results state **RM5.29bn** (RM2.18bn unbilled property + RM1.81bn construction orders + RM1.28bn SIB backlog) ✅; the RM5.4bn figure was not found in this round | Prefer RM5.29bn with its breakdown unless a newer source is cited. |
| Deck: "Property +31%, construction +22% in 1H FY26" | ✅ Recomputed from the Q2 filing: property RM487.19m vs RM371.42m (+31.2%); construction RM427.92m vs RM350.71m (+22.0%) | Correct as stated. |
| Deck: "built in Excel and Power Apps … Microsoft stack" | Chin Hin is Microsoft-heavy (M365 Copilot, Teams Rooms, Copilot Studio, Foundry) ✅ **but its ERP is Kingdee** | Don't imply the ERP is Microsoft. |

## Open questions this research raised

Decided as defaults by ADR **D-12** (the team was unsure): OQ-13 capacity story, OQ-14 ERP positioning, OQ-17 autonomy ladder. Still open as **facts** to find out: OQ-15 (is the third Serendah AAC plant commissioned? — targets moved from 31 May to July 2026, no confirmation found) and OQ-16 (do material shortages extend a developer's LAD period under the statutory contract? — needs a legal read). Until those are known the pitch must not claim either way.
