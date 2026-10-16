import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Ask } from "@/app/ask/ask";
import { buildAsk } from "./ask";
import { loadJsonDataset } from "./loaders";
import { SyntheticScenarioSchema } from "./schema";

const deck = loadJsonDataset("synthetic/deck-story.json", SyntheticScenarioSchema, join(process.cwd(), "data")).data;

const figures = (html: string, allowed: readonly string[]) => {
  const text = html.replace(/<[^>]+>/g, " ").replace(/&(?:amp|lt|gt|quot|#x27|#39);/g, " ").replace(/\b\d{4}-\d{2}-\d{2}\b/g, " ").replace(/\b\d{4}-W\d{2}\b/g, " ");
  return [...new Set((text.match(/\d{1,3}(?:,\d{3})+|\d+/g) ?? []).filter((f) => !allowed.includes(f)))];
};

describe("slide 10's plain-words question", () => {
  const model = buildAsk(deck, { q: "Can we take 800 m³ for Johor next week?" });

  it("answers as the slide does: yes in week 44 with 4,100 m3 free, and week 43 would go 2,800 m3 short", () => {
    expect(model.answer?.headline).toBe("Yes in Week 44 (4,100 m³ free). Week 43 would go 2,800 m³ short.");
    expect(model.error).toBeNull();
  });

  it("shows how it read the words, and drafts a reply with the calendar date", () => {
    expect(model.answer?.detail[0]).toContain("Read as: 800 m³ in Week 43 for Johor");
    expect(model.reply).toBe("Hi, Week 43 is fully booked. We can supply 800 m³ for Johor from Mon 26 Oct (Week 44). Shall I lock that in?");
  });

  it("every figure on the rendered page is one the calculator or the reader produced", () => {
    expect(figures(renderToStaticMarkup(<Ask model={model} />), model.allowedFigures)).toEqual([]);
  });

  it("says what it could not read instead of guessing", () => {
    const bad = buildAsk(deck, { q: "can you help me please" });
    expect(bad.answer).toBeNull();
    expect(bad.error).toMatch(/volume/);
    expect(bad.error).toMatch(/week/);
  });

  it("a small request that fits is a plain yes with no squeeze", () => {
    const yes = buildAsk(deck, { q: "300 m3 week 44" });
    expect(yes.answer?.headline).toBe("Yes in Week 44 (4,100 m³ free).");
    expect(yes.reply).toContain("Shall I lock that in?");
  });

  it("the structured form still works as before", () => {
    expect(buildAsk(deck, { week: "2026-W44", volume: "300" }).answer?.tone).toBe("yes");
  });
});
