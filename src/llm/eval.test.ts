import { describe, expect, it } from "vitest";
import { extractWithRules } from "@/capture/rules";
import { loadCaptureInputs } from "@/data/inbox";
import { loadJsonDataset } from "@/data/loaders";
import { InboxFileSchema } from "@/data/schema";
import { evaluate, reportMarkdown } from "./eval";
import { IntakeOutputSchema, linesFromModel } from "./intake";

const file = loadJsonDataset("synthetic/inbox-samples.json", InboxFileSchema).data;
const { known } = loadCaptureInputs();

describe("the reader evaluation", () => {
  it("the rules reader never marks an invented value confirmed on the samples, and agrees with the gold on the needs-a-person calls", async () => {
    const r = await evaluate("Rules reader", extractWithRules, file.messages, known);
    expect(r.messages).toBe(22);
    expect(r.fields.every((f) => f.inventedConfirmed === 0)).toBe(true);
    expect(r.lineCountAgrees).toBe(22);
    expect(r.needsPersonAgrees).toBe(22);
  });

  it("a reader that reads nothing scores zero right and is not rewarded for it", async () => {
    const r = await evaluate("Silent reader", () => [], file.messages, known);
    expect(r.fields.every((f) => f.right === 0)).toBe(true);
    expect(r.lineCountAgrees).toBeLessThan(22);
  });

  it("a reader that invents confirmed values is caught by grounding and counted", async () => {
    const liar = (m: { text: string }) =>
      linesFromModel(
        IntakeOutputSchema.parse({
          lines: [
            {
              customer: { value: "Project Z", evidence: "Project Z", status: "stated", reason: "" },
              product: { value: "AAC block 100 mm", evidence: "AAC", status: "stated", reason: "" },
              volumeM3: { value: 777, evidence: "777 m3", status: "stated", reason: "" },
              neededBy: { value: "2026-11-30", evidence: "30 Nov", status: "stated", reason: "" },
              reference: { value: "PO 999", evidence: "PO 999", status: "stated", reason: "" },
            },
          ],
        }),
        m.text,
      );
    const r = await evaluate("Liar", liar, file.messages, known);
    expect(r.groundingDemotions).toBeGreaterThan(0);
    expect(r.fields.find((f) => f.field === "volumeM3")!.inventedConfirmed).toBe(0);
  });

  it("the report names the number to watch and states its limits", async () => {
    const md = reportMarkdown(await evaluate("Rules reader", extractWithRules, file.messages, known));
    expect(md).toMatch(/Invented and confirmed/);
    expect(md).toMatch(/not accuracy on real ones/);
  });
});
