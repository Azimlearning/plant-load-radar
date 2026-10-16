import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { csvToMessages, parseCsv } from "./csv";
import { processInbox } from "./pipeline";

const AT = "2026-10-12T01:42:00Z";
const parties = ["a", "b", "c", "d", "e", "f", "g", "h"].flatMap((l) => [
  { id: `project-${l}`, name: `Project ${l.toUpperCase()} (fictional)` },
  { id: `contractor-${l}`, name: `Contractor ${l.toUpperCase()} (fictional)` },
]);

describe("reading a CSV", () => {
  it("handles quotes, commas, doubled quotes and blank lines", () => {
    expect(parseCsv('a,b\n"x, y","say ""hi"""\n\n1,2\n')).toEqual([["a", "b"], ["x, y", 'say "hi"'], ["1", "2"]]);
  });
  it("turns each row into the pipe-row the rules reader already understands", () => {
    const out = csvToMessages("customer,product,volume_m3,needed_by,reference\nContractor F,AAC block 100mm,1000,2026-10-26,PO F-77\n", AT, "export");
    expect(out.messages.map((m) => m.text)).toEqual(["Contractor F | AAC block 100mm | 1000 m3 | 2026-10-26 | PO F-77"]);
    expect(out.problems).toEqual([]);
  });
  it("matches columns by name, in any order, and reports the ones it ignored or could not find", () => {
    const out = csvToMessages("Notes,PO,Qty,Customer\nhello,PO 1,300,Project D\n", AT, "export");
    expect(out.ignoredColumns).toEqual(["notes"]);
    expect(out.problems.join(" ")).toMatch(/No column for product/);
    expect(out.messages[0]!.text).toBe("Project D |  | 300 m3 |  | PO 1");
  });
  it("refuses an export with no rows, or too much text", () => {
    expect(csvToMessages("customer\n", AT, "x").problems[0]).toMatch(/header row and at least one row/);
    expect(csvToMessages("x".repeat(9000), AT, "x").problems[0]).toMatch(/too much/);
  });
  it("a pipe or newline inside a cell cannot make a second row", () => {
    const out = csvToMessages('customer,product\n"Project D | AAC","a\nb"\n', AT, "x");
    expect(out.messages).toHaveLength(1);
    expect(out.messages[0]!.text.split("\n")).toHaveLength(1);
  });
  it("the sample Kingdee-style export reads through the real pipeline: complete rows are firm, blanks are missing, never filled in", () => {
    const text = readFileSync(join(process.cwd(), "data/synthetic/kingdee-export.csv"), "utf8");
    const { messages } = csvToMessages(text, AT, "Kingdee export (fictional)");
    const result = processInbox(messages, parties);
    expect(result.counts.lines).toBe(5);
    const h = result.messages.find((m) => m.message.text.startsWith("Project H"))!.lines[0]!;
    expect(h.line.neededBy.value).toBeNull();
    expect(h.line.neededBy.confidence).toBe("missing");
    expect(h.needsPerson).toBe(true);
    const f = result.messages.find((m) => m.message.text.startsWith("Contractor F"))!.lines[0]!;
    expect(f.line.reference.value).toBe("PO F-77");
    expect(f.line.tier).toBe("firm");
  });
});
