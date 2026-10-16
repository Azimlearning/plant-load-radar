// One provider interface for every language-model call in the app (CLAUDE.md: "one provider interface in src/llm/").
// The model only ever writes or reads WORDS (hard constraint 1): nothing it returns is shown as a figure unless the
// calculator produced the same figure first. Server-side only: the key is never read in a client component.

import type { ZodType } from "zod";

export type Purpose = "intake" | "writer" | "photo";

export interface ImageInput {
  mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif";
  base64: string;
}

export interface StructuredRequest<T> {
  purpose: Purpose;
  /** Fixed instructions. Never contains user text. */
  system: string;
  /** The data to read, e.g. the message. The system prompt tells the model it is data, not instructions. */
  text: string;
  image?: ImageInput;
  schema: ZodType<T>;
  maxTokens: number;
}

export interface Usage {
  inputTokens: number;
  outputTokens: number;
}

export type LlmFailure = "not-configured" | "budget" | "refused" | "invalid" | "error";

export type LlmResult<T> = { ok: true; value: T; usage: Usage } | { ok: false; reason: LlmFailure; message: string };

export interface LlmProvider {
  /** A short name for the screen: which reader did the work. */
  readonly name: string;
  structured<T>(req: StructuredRequest<T>): Promise<LlmResult<T>>;
}
