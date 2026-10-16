// Server-side only. How the model layer is configured, from environment variables (names are listed in
// refdocs/guides/env_setup.md). Nothing here is ever sent to the browser.
//
//   PLR_LLM_MODE      off (default) | live | record | replay
//   ANTHROPIC_API_KEY the key, read only by the Anthropic provider
//   PLR_LLM_MODEL     the model id (default: the cheapest workable one, CLAUDE.md rule 8)
//   PLR_LLM_MAX_CALLS a per-process cap on model calls: the cost brake (default below)
//   PLR_LLM_RECORDINGS path of the record/replay file (default .llm/recordings.json, gitignored)

export type LlmMode = "off" | "live" | "record" | "replay";

/** Cheapest current model that can read short messages: Claude Haiku 5.5 (the claude-api skill's price table). */
export const DEFAULT_MODEL = "claude-haiku-5-5";
export const DEFAULT_MAX_CALLS = 60;
export const DEFAULT_RECORDINGS = ".llm/recordings.json";

export interface LlmConfig {
  mode: LlmMode;
  model: string;
  maxCalls: number;
  recordingsPath: string;
  /** True when a key is present. The key itself is never exposed from this module. */
  hasKey: boolean;
}

const MODES: readonly LlmMode[] = ["off", "live", "record", "replay"];

export function llmConfig(env: Record<string, string | undefined> = process.env): LlmConfig {
  const raw = (env.PLR_LLM_MODE ?? "off").trim().toLowerCase();
  const mode = (MODES as readonly string[]).includes(raw) ? (raw as LlmMode) : "off";
  const cap = Number(env.PLR_LLM_MAX_CALLS);
  return {
    mode,
    model: env.PLR_LLM_MODEL?.trim() || DEFAULT_MODEL,
    maxCalls: Number.isInteger(cap) && cap >= 0 ? cap : DEFAULT_MAX_CALLS,
    recordingsPath: env.PLR_LLM_RECORDINGS?.trim() || DEFAULT_RECORDINGS,
    hasKey: Boolean(env.ANTHROPIC_API_KEY?.trim()),
  };
}

/** A one-line account of the configuration for the screen, with no secret in it. */
export function describeConfig(c: LlmConfig): string {
  if (c.mode === "off") return "Model reader: off. The rules reader is used.";
  if (c.mode === "replay") return "Model reader: replaying recorded answers.";
  if (!c.hasKey) return "Model reader: not configured (no key on the server). The rules reader is used.";
  return `Model reader: ${c.mode === "record" ? "live, recording" : "live"} (${c.model}), at most ${c.maxCalls} calls per server run.`;
}
