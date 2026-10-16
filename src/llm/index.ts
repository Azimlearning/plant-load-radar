// Server-side only. Which provider the app uses right now, or null when the model layer is off or unconfigured.
// The rules reader and the templates are always the fallback: a missing key, a refusal or a budget stop never breaks a page.

import { AnthropicProvider } from "./anthropic";
import { llmConfig, type LlmConfig } from "./config";
import type { LlmProvider } from "./provider";
import { RecordingProvider, ReplayProvider } from "./recording";

let cached: { key: string; provider: LlmProvider | null } | null = null;

export function getProvider(config: LlmConfig = llmConfig()): LlmProvider | null {
  const key = JSON.stringify([config.mode, config.model, config.maxCalls, config.hasKey, config.recordingsPath]);
  if (cached?.key === key) return cached.provider;
  let provider: LlmProvider | null = null;
  if (config.mode === "replay") provider = new ReplayProvider(config.recordingsPath);
  else if ((config.mode === "live" || config.mode === "record") && config.hasKey) {
    const live = new AnthropicProvider(config.model, config.maxCalls);
    provider = config.mode === "record" ? new RecordingProvider(live, config.recordingsPath) : live;
  }
  cached = { key, provider };
  return provider;
}
