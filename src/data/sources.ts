// View-model for the sources and assumptions page (slide 15: "sources and assumptions behind every number").
// It is generated from the data manifest and the public fact files, so it cannot drift from what the app actually loads.

import { loadJsonDataset, loadManifest, type ManifestEntry } from "./loaders";
import { Figures } from "./board";
import { PitchReferencesSchema, PublicFactsFileSchema, type PitchReferences, type PublicFact } from "./schema";

export interface FileRow {
  file: string;
  kind: string;
  source: string;
  licence: string;
  when: string;
  note: string;
}

export interface FactGroup {
  file: string;
  title: string;
  count: string;
  facts: { label: string; value: string; unit: string; period: string; source: string; url: string; reliability: string }[];
}

export interface SourcesModel {
  title: string;
  banner: string;
  intro: string;
  kinds: { kind: string; meaning: string; count: string }[];
  files: FileRow[];
  references: { id: string; citation: string }[];
  assumptions: { title: string; text: string }[];
  factGroups: FactGroup[];
  note: string;
  allowedFigures: string[];
}

const KIND_MEANING: Record<string, string> = {
  public: "Public information found by research, with its source, licence and date.",
  synthetic: "Invented by the project and generated or written by hand; labelled, and calibrated to public data where it can be.",
  "model-generated": "Produced by a model the project trained. None exists today (ADR D-14, D-21).",
};

/** The public fact files, in the order the page shows them. */
const FACT_FILES = [
  ["public/chinhin-capacity-statements.json", "Chin Hin: capacity and pipeline statements"],
  ["public/chinhin-segments-q2fy26.json", "Chin Hin: segment results, Q2 FY2026"],
  ["public/lad-terms.json", "Late-handover damages: the statutory terms"],
  ["public/dosm-construction-q2-2026.json", "DOSM: construction statistics, Q2 2026"],
  ["public/material-prices-2026.json", "Material prices, 2026"],
  ["public/carrying-cost-range.json", "Carrying cost of stock: generic range (low authority)"],
] as const;

const fmtValue = (f: PublicFact): string => (typeof f.value === "number" ? f.value.toLocaleString("en-US") : f.value);

export function buildSources(manifest: readonly ManifestEntry[], references: PitchReferences, facts: Record<string, readonly PublicFact[]>): SourcesModel {
  const fig = new Figures();
  const kinds = [...new Set(manifest.map((m) => m.kind))].sort();
  return {
    title: "Sources and assumptions",
    banner: "Synthetic demo data. Every party is fictional and every figure is illustrative. This is not Chin Hin data.",
    intro: "Every number in the app is either public, with its source below, or invented and labelled. Chin Hin has given the project no data, and none is assumed. This page is built from the data manifest, so it lists exactly what the app can load.",
    kinds: kinds.map((k) => ({ kind: k, meaning: KIND_MEANING[k] ?? "", count: fig.n(manifest.filter((m) => m.kind === k).length) })),
    files: manifest.map((m) => ({ file: m.file, kind: m.kind, source: fig.text(m.source), licence: fig.text(m.licence), when: fig.text(m.retrievedOrSeed), note: fig.text(m.note) })),
    references: references.references.map((r) => ({ id: fig.n(r.id), citation: fig.text(r.citation) })),
    assumptions: references.assumptions.map((a) => ({ title: a.title, text: fig.text(a.text) })),
    factGroups: FACT_FILES.map(([file, title]) => ({
      file,
      title: fig.text(title),
      count: fig.n((facts[file] ?? []).length),
      facts: (facts[file] ?? []).map((f) => ({ label: fig.text(f.label), value: fig.text(fmtValue(f)), unit: fig.text(f.unit), period: fig.text(f.period), source: fig.text(f.sourceName), url: f.sourceUrl, reliability: f.reliability })),
    })),
    note: "The reference list is the pitch deck's own appendix; the project has not re-read each source end to end. Where it did (the Chin Hin filings and the DOSM statistics) the figures are in the fact tables below with their own source links and reliability.",
    allowedFigures: fig.all(),
  };
}

export function loadSources(): SourcesModel {
  const manifest = loadManifest();
  const references = loadJsonDataset("public/pitch-references.json", PitchReferencesSchema).data;
  const facts: Record<string, readonly PublicFact[]> = {};
  for (const [file] of FACT_FILES) facts[file] = loadJsonDataset(file, PublicFactsFileSchema).data.facts;
  return buildSources(manifest, references, facts);
}
