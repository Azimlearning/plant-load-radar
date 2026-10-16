// Server-side only. Record and replay model answers, so a rehearsal or a demo can run offline after one live run.
// A recording is the model's own answer to an exact request; replay refuses anything it has not recorded.
// Recordings are local files (gitignored). Committing any would need a manifest row and an ADR: they are model output.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { LlmProvider, LlmResult, StructuredRequest } from "./provider";

interface Recording {
  key: string;
  purpose: string;
  /** The model's answer, already validated against the request's schema when it was recorded. */
  value: unknown;
  usage: { inputTokens: number; outputTokens: number };
}

export const requestKey = (req: Pick<StructuredRequest<unknown>, "purpose" | "system" | "text" | "image">): string =>
  createHash("sha256")
    .update(JSON.stringify({ p: req.purpose, s: req.system, t: req.text, i: req.image ? createHash("sha256").update(req.image.base64).digest("hex") : null }))
    .digest("hex");

function readAll(path: string): Recording[] {
  if (!existsSync(path)) return [];
  try {
    const json: unknown = JSON.parse(readFileSync(path, "utf8"));
    return Array.isArray(json) ? (json as Recording[]) : [];
  } catch {
    return [];
  }
}

/** Wraps a live provider and saves each good answer. */
export class RecordingProvider implements LlmProvider {
  readonly name: string;
  constructor(
    private readonly inner: LlmProvider,
    private readonly path: string,
  ) {
    this.name = `${inner.name}, recording`;
  }
  async structured<T>(req: StructuredRequest<T>): Promise<LlmResult<T>> {
    const out = await this.inner.structured(req);
    if (out.ok) {
      const key = requestKey(req);
      const all = readAll(this.path).filter((r) => r.key !== key);
      all.push({ key, purpose: req.purpose, value: out.value, usage: out.usage });
      mkdirSync(dirname(this.path), { recursive: true });
      writeFileSync(this.path, JSON.stringify(all, null, 2));
    }
    return out;
  }
}

/** Plays back saved answers. A request that was never recorded is refused, not guessed. */
export class ReplayProvider implements LlmProvider {
  readonly name = "Model reader (replaying recorded answers)";
  constructor(private readonly path: string) {}
  async structured<T>(req: StructuredRequest<T>): Promise<LlmResult<T>> {
    const hit = readAll(this.path).find((r) => r.key === requestKey(req));
    if (!hit) return { ok: false, reason: "not-configured", message: "No recorded answer for this input. Run it live once with PLR_LLM_MODE=record." };
    const parsed = req.schema.safeParse(hit.value);
    if (!parsed.success) return { ok: false, reason: "invalid", message: "The recorded answer no longer matches the expected shape." };
    return { ok: true, value: parsed.data, usage: hit.usage };
  }
}
