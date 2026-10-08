import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as z from "zod";
import {
  ManifestError,
  dataDir,
  findMissingFiles,
  findUnmanifested,
  loadJsonDataset,
  loadManifest,
  parseManifest,
  requireManifested,
} from "./loaders";

const HEADER = `# Data manifest

## Layout

| Folder | What |
|---|---|
| \`data/public/\` | public |

## Rows

| file | kind | source URL / code path | licence | retrieved / seed | note |
|---|---|---|---|---|---|
`;

const row = (file: string, kind = "synthetic") => `| ${file} | ${kind} | src/data/synth.ts | MIT | seed 1 | test fixture |\n`;

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "plr-data-"));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

const write = (rel: string, content: string) => {
  const full = join(dir, rel);
  mkdirSync(join(full, ".."), { recursive: true });
  writeFileSync(full, content);
};

describe("parseManifest", () => {
  it("reads rows and ignores tables outside the Rows section", () => {
    const entries = parseManifest(HEADER + row("synthetic/a.json") + row("public/b.json", "public"));
    expect(entries.map((e) => [e.file, e.kind])).toEqual([
      ["synthetic/a.json", "synthetic"],
      ["public/b.json", "public"],
    ]);
  });

  it("returns no entries for an empty table", () => {
    expect(parseManifest(HEADER)).toEqual([]);
  });

  it("stops at the next section", () => {
    const md = HEADER + row("a.json") + "\n## Searched and not found\n\n| Item | Searched | Outcome |\n|---|---|---|\n| x | y | z |\n";
    expect(parseManifest(md)).toHaveLength(1);
  });

  it('rejects kind "real" — Chin Hin has given us no data', () => {
    expect(() => parseManifest(HEADER + row("a.json", "real"))).toThrow(/no "real" kind/);
  });

  it("rejects an unknown kind, a short row, a missing licence and a duplicate", () => {
    expect(() => parseManifest(HEADER + row("a.json", "invented"))).toThrow(ManifestError);
    expect(() => parseManifest(HEADER + "| a.json | synthetic | x |\n")).toThrow(/cells/);
    expect(() => parseManifest(HEADER + "| a.json | synthetic | src | | seed 1 | n |\n")).toThrow(/missing/);
    expect(() => parseManifest(HEADER + row("a.json") + row("a.json"))).toThrow(/Duplicate/);
  });

  it("requires a Rows section", () => {
    expect(() => parseManifest("# nothing here")).toThrow(/Rows/);
  });
});

describe("the gate: no manifest row, no data", () => {
  const Schema = z.object({ n: z.number() });

  it("loads a manifested, valid file", () => {
    write("MANIFEST.md", HEADER + row("synthetic/ok.json"));
    write("synthetic/ok.json", JSON.stringify({ n: 3 }));
    const { entry, data } = loadJsonDataset("synthetic/ok.json", Schema, dir);
    expect(data).toEqual({ n: 3 });
    expect(entry.kind).toBe("synthetic");
  });

  it("refuses a file that exists on disk but has no manifest row", () => {
    write("MANIFEST.md", HEADER);
    write("synthetic/sneaky.json", JSON.stringify({ n: 1 }));
    expect(() => loadJsonDataset("synthetic/sneaky.json", Schema, dir)).toThrow(/no row in MANIFEST\.md/);
  });

  it("refuses a manifested file that is missing from disk", () => {
    write("MANIFEST.md", HEADER + row("synthetic/gone.json"));
    expect(() => loadJsonDataset("synthetic/gone.json", Schema, dir)).toThrow(/not on disk/);
  });

  it("refuses data that does not match its schema, and says why", () => {
    write("MANIFEST.md", HEADER + row("synthetic/bad.json"));
    write("synthetic/bad.json", JSON.stringify({ n: "three" }));
    expect(() => loadJsonDataset("synthetic/bad.json", Schema, dir)).toThrow(/does not match its schema/);
  });

  it("refuses invalid JSON", () => {
    write("MANIFEST.md", HEADER + row("synthetic/broken.json"));
    write("synthetic/broken.json", "{ nope");
    expect(() => loadJsonDataset("synthetic/broken.json", Schema, dir)).toThrow(/not valid JSON/);
  });

  it("refuses paths that escape the data directory", () => {
    write("MANIFEST.md", HEADER + row("synthetic/ok.json"));
    expect(() => requireManifested("../secrets.json", dir)).toThrow(/inside the data directory/);
    expect(() => requireManifested("/etc/passwd", dir)).toThrow(/inside the data directory/);
  });

  it("accepts Windows-style separators for a manifested file", () => {
    write("MANIFEST.md", HEADER + row("synthetic/ok.json"));
    expect(requireManifested("synthetic\\ok.json", dir).file).toBe("synthetic/ok.json");
  });

  it("needs a MANIFEST.md at all", () => {
    expect(() => loadManifest(dir)).toThrow(/No MANIFEST\.md/);
  });
});

describe("audits (both should always be empty in the real data/ folder)", () => {
  it("lists unmanifested files, ignoring MANIFEST.md itself", () => {
    write("MANIFEST.md", HEADER + row("synthetic/ok.json"));
    write("synthetic/ok.json", "{}");
    write("public/orphan.csv", "a,b");
    write("model/deep/orphan2.json", "{}");
    expect(findUnmanifested(dir)).toEqual(["model/deep/orphan2.json", "public/orphan.csv"]);
  });

  it("lists manifest rows whose file is missing", () => {
    write("MANIFEST.md", HEADER + row("synthetic/ok.json") + row("synthetic/gone.json"));
    write("synthetic/ok.json", "{}");
    expect(findMissingFiles(dir)).toEqual(["synthetic/gone.json"]);
  });
});

describe("dataDir", () => {
  it("honours PLR_DATA_DIR", () => {
    const prev = process.env.PLR_DATA_DIR;
    process.env.PLR_DATA_DIR = dir;
    try {
      expect(dataDir()).toBe(dir);
    } finally {
      if (prev === undefined) delete process.env.PLR_DATA_DIR;
      else process.env.PLR_DATA_DIR = prev;
    }
  });
});

describe("the project's real data/ folder", () => {
  it("has a parseable manifest, no unmanifested files and no missing files", () => {
    const real = join(process.cwd(), "data");
    expect(() => loadManifest(real)).not.toThrow();
    expect(findUnmanifested(real)).toEqual([]);
    expect(findMissingFiles(real)).toEqual([]);
  });
});
