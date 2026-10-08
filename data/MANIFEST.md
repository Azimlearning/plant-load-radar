# Data manifest

> Every file under `data/` must have a row here. Loaders refuse a file with no row (CLAUDE.md hard constraint 3, ADR D-06). `data-steward` owns this file.
> **Chin Hin has given us no data and none is assumed.** Everything here is public, model-generated or synthetic. There is no `real` kind and no private folder.

## Layout

| Folder | What goes in it |
|---|---|
| `data/public/` | Public information found by research, with a clear licence |
| `data/model/` | Output of a model we trained on public data, plus its model card |
| `data/synthetic/` | Seeded, config-driven generated data and its parameters |

Create a subfolder when its first file arrives; this file, not a placeholder, documents the convention. All of `data/` is committed.

## Kinds

- `public` — public information (government statistics, filings, published rates, press). Needs URL, licence, retrieved date, and what it does *not* measure.
- `model-generated` — produced by a model we trained. Needs: training sources (each itself a `public` row), code path, seed, model card (what it learned, what it cannot claim).
- `synthetic` — generated from a config file with a seed. Needs: seed, config path, and what it was calibrated to.
- Add `illustrative` in the note when a figure comes from the pitch deck rather than a source.

## Rows

One row per file, path relative to `data/`:

| file | kind | source URL / code path | licence | retrieved / seed | note |
|---|---|---|---|---|---|

*No data files yet. First rows arrive in P0 Task 4 (deep research) and Task 5 (synthetic generator).*

## Searched and not found

Record what was looked for and where, so nobody repeats the search. Expected: plant- and order-level data is private by nature (PRD OQ-10).

Preliminary results from the 2026-10-08 secondary research (`refdocs/research/`). No files were downloaded; `data-steward` re-does these properly in P0 Task 4.

| Item | Searched | Outcome |
|---|---|---|
| Plant-level or order-level data (any public source) | Web search on AAC / precast / ready-mix orders and plant output | **Not found.** Only paid market reports (IndexBox, 6Wresearch — previews only) and a paid customs-data aggregator (licence unclear; do not ingest). |
| AAC selling price per m³ and variable cost | Web search | **Not found.** Only per-piece vendor-blog prices (inconsistent, unit mismatch). |
| Utilisation by plant, stock levels | Web search | **Not found** beyond historic statements (2016–17 full capacity; ~30% at Kota Tinggi end-2019, quoted in context, not re-verified). |
| Ready-mix price per m³ | CIDB CONVINCE; MBAM via FMT | **Found**, two figures: Grade 30 RM413.73 (CIDB, Jul 2026), RM402 (MBAM, Aug 2026). Candidate `public` rows. |
| Construction work done by state and sub-sector | DOSM Q2 2026 | **Found.** Candidate `public` row. |
| Cement and steel prices | DOSM special releases (Jun, Aug 2026) | **Found.** Candidate `public` rows. |
| Chin Hin segment revenue / PBT | Bursa Q2 FY26 interim report | **Found.** Candidate `public` row (pull the PDF). |
| LAD terms | Statute text (Schedule G/H), Federal Court summary | **Found.** Candidate `public` row (text). |
| Carrying-cost range | Calculator sites citing APICS/CSCMP-style benchmarks | **Found, low authority.** Use as a labelled range only. |
| Idle site cost | Web search | **Not found.** |
