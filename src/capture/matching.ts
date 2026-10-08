// Matching: link a party name as written ("Site A", "Projek C", "Proj A/B") to a known party, or say why not.
// It never picks between two plausible parties; it returns both and marks the match `conflicting` (ADR D-16).

import type { Confidence, ExtractedLine, InboxMessage } from "./types";

export interface KnownParty {
  id: string;
  /** e.g. "Project A (fictional)" */
  name: string;
}

export interface PartyMatch {
  raw: string | null;
  candidates: string[];
  chosen: string | null;
  confidence: Confidence;
  reason: string;
}

export type Relation = { id: string; kind: "duplicate" | "confirms" };

// Words people use for the same kind of party. Vocabulary, not data: it says what the words mean, not who anyone is.
const KIND_WORDS: Record<string, string> = { project: "project", projek: "project", proj: "project", site: "project", contractor: "contractor", kontraktor: "contractor" };

/** "Project A (fictional)" -> ["project a"]; "Proj A/B" -> ["project a", "project b"]. */
function keysOf(name: string): string[] {
  const m = /^([A-Za-z]+)\s+(.+?)(?:\s*\(.*\))?$/.exec(name.trim());
  if (!m) return [];
  const kind = KIND_WORDS[m[1]!.toLowerCase()];
  return kind ? m[2]!.split("/").map((p) => `${kind} ${p.trim().toLowerCase()}`) : [];
}

export function matchParty(raw: string | null, known: KnownParty[]): PartyMatch {
  if (!raw) return { raw, candidates: [], chosen: null, confidence: "missing", reason: "no party named" };
  const wanted = keysOf(raw);
  const byKey = new Map(known.flatMap((p) => keysOf(p.name).map((k) => [k, p.id] as const)));
  const candidates = [...new Set(wanted.map((k) => byKey.get(k)).filter((id): id is string => !!id))];
  if (wanted.length > 1 && candidates.length > 0) {
    return { raw, candidates, chosen: null, confidence: "conflicting", reason: `"${raw}" could mean ${candidates.length} parties` };
  }
  if (candidates.length === 1) return { raw, candidates, chosen: candidates[0]!, confidence: "confirmed", reason: "" };
  return { raw, candidates: [], chosen: null, confidence: "missing", reason: `"${raw}" is not a known party` };
}

/** What makes two lines the same order: who, what, how much, by when. */
export const orderKey = (l: ExtractedLine, partyId: string | null): string | null => {
  if (!partyId || l.product.value === null || l.volumeM3.value === null || l.neededBy.value === null) return null;
  return [partyId, l.product.value, l.volumeM3.value, l.neededBy.value].join("|");
};

export const DUPLICATE_WINDOW_DAYS = 14;
export const receivedMs = (m: InboxMessage): number => new Date(m.receivedAt).getTime();
