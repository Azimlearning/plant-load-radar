import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DAYS_PER_YEAR, LAD_RATE_PER_YEAR } from "@/core/costs";
import { findMissingFiles, findUnmanifested, loadJsonDataset, loadManifest } from "./loaders";
import { PublicFactsFileSchema, SeriesFileSchema, type PublicFact, type PublicFactsFile } from "./schema";

// These tests read the project's REAL data/ folder. They guard provenance (every file in the manifest,
// every fact sourced) and tie the data to the code (constants in src/core match what the sources say).

const dir = join(process.cwd(), "data");
const factFiles = [
  "public/dosm-construction-q2-2026.json",
  "public/material-prices-2026.json",
  "public/lad-terms.json",
  "public/chinhin-segments-q2fy26.json",
  "public/chinhin-capacity-statements.json",
  "public/carrying-cost-range.json",
];
const seriesFiles = ["public/dosm-gdp-construction-quarterly.json", "public/dosm-ppi-group239-monthly.json"];

const facts = (file: string): PublicFactsFile => loadJsonDataset(file, PublicFactsFileSchema, dir).data;
const byKey = (file: string): Map<string, PublicFact> => new Map(facts(file).facts.map((f) => [f.key, f]));
const num = (m: Map<string, PublicFact>, key: string): number => {
  const v = m.get(key)?.value;
  if (typeof v !== "number") throw new Error(`missing numeric fact ${key}`);
  return v;
};

describe("provenance", () => {
  it("every file in data/ has a manifest row and every row has a file", () => {
    expect(findUnmanifested(dir)).toEqual([]);
    expect(findMissingFiles(dir)).toEqual([]);
  });

  it("every public file on disk is declared kind 'public'", () => {
    const onDisk = readdirSync(join(dir, "public")).map((f) => `public/${f}`);
    const manifest = loadManifest(dir);
    for (const f of onDisk) expect(manifest.find((e) => e.file === f)?.kind, f).toBe("public");
  });

  it.each(factFiles)("%s validates and every fact has a source URL and reliability", (file) => {
    const f = facts(file);
    expect(f.facts.length).toBeGreaterThan(0);
    for (const fact of f.facts) {
      expect(fact.sourceUrl.startsWith("https://"), fact.key).toBe(true);
      expect(["primary", "secondary", "low-authority"]).toContain(fact.reliability);
    }
  });

  it.each(seriesFiles)("%s validates and records the raw download checksum", (file) => {
    const s = loadJsonDataset(file, SeriesFileSchema, dir).data;
    expect(s.meta.licence).toMatch(/CC BY 4\.0/);
    expect(s.rows.length).toBeGreaterThan(100);
  });
});

describe("data agrees with code", () => {
  const lad = byKey("public/lad-terms.json");

  it("the LAD rate in the sourced data equals the constant the calculator uses", () => {
    expect(num(lad, "lad.rate_per_year")).toBe(LAD_RATE_PER_YEAR);
    expect(num(lad, "lad.days_per_year")).toBe(DAYS_PER_YEAR);
  });

  it("delivery periods are 24 months (landed) and 36 months (strata)", () => {
    expect(num(lad, "lad.landed.delivery_months")).toBe(24);
    expect(num(lad, "lad.strata.delivery_months")).toBe(36);
  });
});

describe("internal consistency of the transcribed figures", () => {
  it("DOSM Q2 2026: subsectors sum to the total, owners sum to the total, shares are about 100 percent", () => {
    const m = byKey("public/dosm-construction-q2-2026.json");
    const sub = ["civil", "nonresidential", "residential", "specialtrade"];
    const total = num(m, "dosm.construction.workdone.total");
    expect(sub.reduce((s, k) => s + num(m, `dosm.construction.workdone.subsector.${k}`), 0)).toBeCloseTo(total, 1);
    expect(num(m, "dosm.construction.workdone.owner.private") + num(m, "dosm.construction.workdone.owner.public")).toBeCloseTo(total, 1);
    expect(sub.reduce((s, k) => s + num(m, `dosm.construction.workdone.subsector.${k}.share`), 0)).toBeCloseTo(100, 0);
  });

  it("Chin Hin Q2 FY26: the five revenue sub-segments add up to the building-materials subtotal exactly, in every period", () => {
    const m = byKey("public/chinhin-segments-q2fy26.json");
    for (const tag of ["q2fy26", "q2fy25", "h1fy26", "h1fy25"]) {
      const parts = ["distribution", "rmc", "aac_precast", "safety_glass_roofing", "wire_mesh"].reduce((sum, seg) => {
        const v = m.get(`chinhin.seg.${seg}.revenue.${tag}`)?.value; // absent = none that period (e.g. wire mesh was exited)
        return sum + (typeof v === "number" ? v : 0);
      }, 0);
      expect(parts, tag).toBe(num(m, `chinhin.seg.building_materials.revenue.${tag}`));
    }
  });

  it("Chin Hin Q2 FY26: the division's PBT is dragged down by the glass/roofing segment's Q2 loss, not by AAC", () => {
    const m = byKey("public/chinhin-segments-q2fy26.json");
    expect(num(m, "chinhin.seg.safety_glass_roofing.pbt.q2fy26")).toBeLessThan(0);
    expect(num(m, "chinhin.seg.aac_precast.pbt.q2fy26")).toBeGreaterThan(num(m, "chinhin.seg.aac_precast.pbt.q2fy25"));
  });

  it("Chin Hin Q2 FY26: the headline growth rates quoted in the pitch recompute from the data", () => {
    const m = byKey("public/chinhin-segments-q2fy26.json");
    const growth = (a: string, b: string) => num(m, a) / num(m, b) - 1;
    expect(growth("chinhin.seg.property.revenue.h1fy26", "chinhin.seg.property.revenue.h1fy25")).toBeCloseTo(0.312, 3);
    expect(growth("chinhin.seg.construction.revenue.h1fy26", "chinhin.seg.construction.revenue.h1fy25")).toBeCloseTo(0.22, 3);
    expect(growth("chinhin.seg.building_materials.revenue.q2fy26", "chinhin.seg.building_materials.revenue.q2fy25")).toBeCloseTo(0.135, 3);
  });

  it("DOSM real GDP: construction subsectors sum to the construction total each quarter", () => {
    const s = loadJsonDataset("public/dosm-gdp-construction-quarterly.json", SeriesFileSchema, dir).data;
    const abs = s.rows.filter((r) => r.series === "abs");
    const dates = [...new Set(abs.map((r) => r.date))];
    expect(dates.length).toBeGreaterThan(40);
    for (const d of dates) {
      const v = (code: string) => abs.find((r) => r.date === d && r.code === code)!.value;
      // DOSM publishes early years as whole RM million, so parts can differ from the total by rounding.
      // Measured on 2026-10-08: the worst gap over all 46 quarters is exactly RM1 million (2015 Q1, of ~13,700).
      const ROUNDING_RM_MILLION = 1;
      expect(Math.abs(v("p4.1.1") + v("p4.1.2") + v("p4.2") + v("p4.3") - v("p4")), d).toBeLessThanOrEqual(ROUNDING_RM_MILLION);
      expect(Math.abs(v("p4.1.1") + v("p4.1.2") - v("p4.1")), d).toBeLessThanOrEqual(ROUNDING_RM_MILLION);
    }
  });

  it("AAC capacity arithmetic: existing + third plant = total after (all stated as 'approximately' or 'over')", () => {
    const m = byKey("public/chinhin-capacity-statements.json");
    expect(num(m, "chinhin.aac.capacity.existing_m3_year") + num(m, "chinhin.aac.capacity.third_plant_addition_m3_year")).toBe(
      num(m, "chinhin.aac.capacity.total_after_third_m3_year"),
    );
  });

  it("the third plant's commissioning is not recorded as confirmed", () => {
    const m = byKey("public/chinhin-capacity-statements.json");
    expect(m.get("chinhin.aac.capacity.total_after_third_m3_year")?.note).toMatch(/NOT confirmed/);
  });

  it("the carrying-cost band is ordered and lines up with the 20 to 30 percent range", () => {
    const m = byKey("public/carrying-cost-range.json");
    expect(num(m, "carrying.total.low")).toBeLessThan(num(m, "carrying.total.high"));
    for (const c of ["capital", "storage", "insurance", "obsolescence"]) {
      expect(num(m, `carrying.component.${c}.low`), c).toBeLessThan(num(m, `carrying.component.${c}.high`));
    }
    expect(m.get("carrying.total.low")?.reliability).toBe("low-authority");
  });
});
