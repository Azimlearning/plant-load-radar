// Server-side only: uses node:fs. Never import this from a client component.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { isAbsolute, join, posix, relative, resolve, sep } from "node:path";
import * as z from "zod";

/**
 * The only three kinds of data this project may use (ADR D-06). There is deliberately no "real":
 * Chin Hin has given us no data, and the pitch must never imply the demo ran on it.
 */
export const DATA_KINDS = ["public", "model-generated", "synthetic"] as const;
export type DataKind = (typeof DATA_KINDS)[number];

export interface ManifestEntry {
  /** Path relative to the data directory, always with forward slashes. */
  file: string;
  kind: DataKind;
  /** Source URL for public data; code path for model-generated or synthetic data. */
  source: string;
  licence: string;
  /** Retrieved date for public data; seed for model-generated or synthetic data. */
  retrievedOrSeed: string;
  note: string;
}

export class ManifestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ManifestError";
  }
}

export const MANIFEST_FILE = "MANIFEST.md";

/** The data directory: PLR_DATA_DIR if set, otherwise ./data. */
export function dataDir(): string {
  return resolve(process.env.PLR_DATA_DIR ?? "./data");
}

const COLUMNS = 6;

/**
 * Parse the `## Rows` table of MANIFEST.md. One row per file:
 * | file | kind | source URL / code path | licence | retrieved / seed | note |
 * Cells must not contain a literal pipe. Anything outside the Rows section is ignored.
 */
export function parseManifest(markdown: string): ManifestEntry[] {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((l) => /^##\s+Rows\s*$/.test(l));
  if (start === -1) throw new ManifestError(`${MANIFEST_FILE} has no "## Rows" section`);

  const entries: ManifestEntry[] = [];
  const seen = new Set<string>();
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (/^##\s/.test(line)) break;
    if (!line.startsWith("|")) continue;

    const cells = line.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
    if (cells.every((c) => /^:?-{3,}:?$/.test(c))) continue; // separator row
    if (cells[0]!.toLowerCase() === "file") continue; // header row
    if (cells.length !== COLUMNS) {
      throw new ManifestError(`Manifest row has ${cells.length} cells, expected ${COLUMNS}: "${line}"`);
    }

    const [file, kind, source, licence, retrievedOrSeed, note] = cells as [string, string, string, string, string, string];
    if (!(DATA_KINDS as readonly string[]).includes(kind)) {
      throw new ManifestError(
        `Manifest row for "${file}" has kind "${kind}"; allowed: ${DATA_KINDS.join(", ")} (there is no "real" kind)`,
      );
    }
    if (!file || !source || !licence || !retrievedOrSeed) {
      throw new ManifestError(`Manifest row for "${file || "?"}" is missing file, source, licence or retrieved/seed`);
    }
    const norm = posix.normalize(file.replaceAll("\\", "/"));
    if (seen.has(norm)) throw new ManifestError(`Duplicate manifest row for "${norm}"`);
    seen.add(norm);
    entries.push({ file: norm, kind: kind as DataKind, source, licence, retrievedOrSeed, note });
  }
  return entries;
}

export function loadManifest(dir: string = dataDir()): ManifestEntry[] {
  const path = join(dir, MANIFEST_FILE);
  if (!existsSync(path)) throw new ManifestError(`No ${MANIFEST_FILE} in ${dir}`);
  return parseManifest(readFileSync(path, "utf8"));
}

function toPosix(p: string): string {
  return p.split(sep).join("/");
}

function listFiles(dir: string, base: string = dir): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = join(dir, e.name);
    return e.isDirectory() ? listFiles(full, base) : [toPosix(relative(base, full))];
  });
}

/** Files on disk with no manifest row (MANIFEST.md itself excluded). Should always be empty. */
export function findUnmanifested(dir: string = dataDir()): string[] {
  const known = new Set(loadManifest(dir).map((e) => e.file));
  return listFiles(dir)
    .filter((f) => f !== MANIFEST_FILE && !known.has(f))
    .sort();
}

/** Manifest rows whose file does not exist. Should always be empty. */
export function findMissingFiles(dir: string = dataDir()): string[] {
  return loadManifest(dir)
    .map((e) => e.file)
    .filter((f) => !existsSync(join(dir, f)))
    .sort();
}

/** Look up a file's manifest row, or throw. This is the gate: no row, no data. */
export function requireManifested(relPath: string, dir: string = dataDir()): ManifestEntry {
  const norm = posix.normalize(relPath.replaceAll("\\", "/"));
  if (isAbsolute(relPath) || norm.startsWith("../") || norm === "..") {
    throw new ManifestError(`Dataset path must be inside the data directory: "${relPath}"`);
  }
  const entry = loadManifest(dir).find((e) => e.file === norm);
  if (!entry) {
    throw new ManifestError(
      `"${norm}" has no row in ${MANIFEST_FILE}. Add one (kind, source, licence, retrieved/seed) before loading it.`,
    );
  }
  return entry;
}

/** Load a JSON dataset, but only if it is in the manifest, then validate it against `schema`. */
export function loadJsonDataset<S extends z.ZodType>(
  relPath: string,
  schema: S,
  dir: string = dataDir(),
): { entry: ManifestEntry; data: z.output<S> } {
  const entry = requireManifested(relPath, dir);
  const full = join(dir, entry.file);
  if (!existsSync(full)) throw new ManifestError(`"${entry.file}" is in the manifest but not on disk`);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(full, "utf8"));
  } catch (e) {
    throw new ManifestError(`"${entry.file}" is not valid JSON: ${(e as Error).message}`);
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new ManifestError(`"${entry.file}" does not match its schema:\n${z.prettifyError(parsed.error)}`);
  }
  return { entry, data: parsed.data };
}
