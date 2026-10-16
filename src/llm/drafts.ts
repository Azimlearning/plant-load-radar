// Polishes the template drafts with the model writer, one text at a time, each behind the number guard in writer.ts.
// A text the model gets wrong (a new number, too long, a failure) simply stays as the template.

import type { Drafts } from "@/writer/drafter";
import type { LlmProvider } from "./provider";
import { refineWithModel } from "./writer";

export interface RefinedDrafts {
  drafts: Drafts;
  /** How many of the texts came from the model, and how many there were. */
  byModel: number;
  total: number;
  /** Why any text fell back to its template, in words. */
  fallbacks: string[];
}

export async function refineDrafts(provider: LlmProvider, drafts: Drafts): Promise<RefinedDrafts> {
  const brief = await refineWithModel(provider, drafts.brief, "brief");
  const replies = [];
  for (const r of drafts.replies) replies.push({ to: r.to, ...(await refineWithModel(provider, r.text, "reply")) });
  const all = [brief, ...replies];
  return {
    drafts: { brief: brief.text, replies: replies.map((r) => ({ to: r.to, text: r.text })) },
    byModel: all.filter((r) => r.by === "model").length,
    total: all.length,
    fallbacks: [...new Set(all.filter((r) => r.by === "template").map((r) => r.why))],
  };
}
