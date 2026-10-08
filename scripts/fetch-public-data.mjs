#!/usr/bin/env node
/**
 * Reproducible download of the two open-data series used to calibrate the synthetic data (P0 Task 4).
 * Both are published by DOSM on data.gov.my under CC BY 4.0 (attribution: Department of Statistics Malaysia).
 *
 *   node scripts/fetch-public-data.mjs
 *
 * Writes data/public/*.json. It does NOT update data/MANIFEST.md — edit the manifest row by hand
 * (the retrieved date and raw SHA-256 are printed and stored in each file's `meta`).
 */
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "data", "public");
const RETRIEVED = new Date().toISOString().slice(0, 10);

/** Parse a simple CSV (no quoted fields — asserted). Returns objects keyed by header. */
function parseCsv(text) {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
  if (lines.some((l) => l.includes('"'))) throw new Error("CSV contains quotes; use a real parser");
  const header = lines[0].split(",");
  return lines.slice(1).map((l) => {
    const cells = l.split(",");
    if (cells.length !== header.length) throw new Error(`Bad row: ${l}`);
    return Object.fromEntries(header.map((h, i) => [h, cells[i]]));
  });
}

async function download(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  const text = await res.text();
  return { text, sha256: createHash("sha256").update(text).digest("hex") };
}

function write(name, payload) {
  writeFileSync(join(OUT, name), JSON.stringify(payload, null, 2) + "\n");
  console.log(`wrote data/public/${name}: ${payload.rows.length} rows`);
}

mkdirSync(OUT, { recursive: true });

// 1. Quarterly real GDP, construction sector and subsectors (code p4, p4.*). RM million, constant prices.
{
  const url = "https://storage.dosm.gov.my/gdp/gdp_qtr_real_supply_sub.csv";
  const { text, sha256 } = await download(url);
  const rows = parseCsv(text)
    .filter((r) => /^p4(\.|$)/.test(r.sector) && (r.series === "abs" || r.series === "growth_yoy"))
    .map((r) => ({ date: r.date, code: r.sector, series: r.series, value: Number(r.value) }));
  if (rows.some((r) => Number.isNaN(r.value))) throw new Error("non-numeric GDP value");
  write("dosm-gdp-construction-quarterly.json", {
    meta: {
      dataset: "gdp_qtr_real_supply_sub",
      title: "Quarterly real GDP by economic subsector, construction (p4, p4.1, p4.1.1, p4.1.2, p4.2, p4.3)",
      url,
      lookupUrl: "https://storage.dosm.gov.my/gdp/gdp_lookup.csv",
      retrieved: RETRIEVED,
      rawSha256: sha256,
      filter: "sector matches p4 or p4.*; series in abs, growth_yoy",
      units: "abs = real GDP in RM million (constant prices); growth_yoy = percent change on the same quarter a year earlier",
      codes: {
        p4: "Construction",
        "p4.1": "Buildings",
        "p4.1.1": "Residential buildings",
        "p4.1.2": "Non-residential buildings",
        "p4.2": "Civil engineering",
        "p4.3": "Specialised construction activities",
      },
      licence: "CC BY 4.0; attribution: Department of Statistics Malaysia (data.gov.my)",
    },
    rows,
  });
}

// 2. Monthly producer price index, group 239 (other non-metallic mineral products, which includes cement
//    and concrete articles). A coarse price-trend proxy, not a cement price.
{
  const url = "https://storage.dosm.gov.my/ppi/ppi_3d.csv";
  const { text, sha256 } = await download(url);
  const rows = parseCsv(text)
    .filter((r) => r.group === "239" && (r.series === "abs" || r.series === "growth_yoy"))
    .map((r) => ({ date: r.date, code: r.group, series: r.series, value: Number(r.index) }));
  if (rows.some((r) => Number.isNaN(r.value))) throw new Error("non-numeric PPI value");
  write("dosm-ppi-group239-monthly.json", {
    meta: {
      dataset: "ppi_3d",
      title: "Monthly Producer Price Index, group 239 (manufacture of other non-metallic mineral products)",
      url,
      retrieved: RETRIEVED,
      rawSha256: sha256,
      filter: "group = 239; series in abs, growth_yoy",
      units: "abs = index (DOSM base year); growth_yoy = percent change on the same month a year earlier",
      codes: { "239": "Other non-metallic mineral products (includes cement, lime, plaster and concrete articles)" },
      licence: "CC BY 4.0; attribution: Department of Statistics Malaysia (data.gov.my)",
    },
    rows,
  });
}
