// Server-side only. The Anthropic provider: the official SDK, structured outputs, no free text parsing.
// Defaults follow CLAUDE.md rule 8 (cheapest workable model) and the claude-api skill for Claude Haiku 5.5: adaptive thinking is
// on by default (so `thinking` is omitted), sampling parameters are not sent, effort is set low because these are short
// reading and rewording tasks, and a `refusal` stop reason is handled. It has NOT been run against the live API in this
// environment (no key); tests use a fake provider, and `scripts/eval-llm.ts` is the first live check.

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { LlmProvider, LlmResult, StructuredRequest } from "./provider";

export class AnthropicProvider implements LlmProvider {
  readonly name: string;
  private calls = 0;
  private readonly client: Anthropic;

  constructor(
    private readonly model: string,
    private readonly maxCalls: number,
    client?: Anthropic,
  ) {
    this.name = `Model reader (${model})`;
    this.client = client ?? new Anthropic(); // reads ANTHROPIC_API_KEY from the server environment
  }

  async structured<T>(req: StructuredRequest<T>): Promise<LlmResult<T>> {
    if (this.calls >= this.maxCalls) return { ok: false, reason: "budget", message: `The cap of ${this.maxCalls} model calls for this server run has been reached.` };
    this.calls += 1;
    try {
      const content: Anthropic.ContentBlockParam[] = [];
      if (req.image) content.push({ type: "image", source: { type: "base64", media_type: req.image.mediaType, data: req.image.base64 } });
      content.push({ type: "text", text: req.text });
      const response = await this.client.messages.parse({
        model: this.model,
        max_tokens: req.maxTokens,
        system: req.system,
        messages: [{ role: "user", content }],
        output_config: { effort: "low", format: zodOutputFormat(req.schema) },
      });
      if (response.stop_reason === "refusal") return { ok: false, reason: "refused", message: "The model declined to answer." };
      if (response.stop_reason === "max_tokens") return { ok: false, reason: "invalid", message: "The answer was cut off." };
      if (response.parsed_output == null) return { ok: false, reason: "invalid", message: "The answer did not match the expected shape." };
      return { ok: true, value: response.parsed_output as T, usage: { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens } };
    } catch (e) {
      if (e instanceof Anthropic.AuthenticationError) return { ok: false, reason: "not-configured", message: "The server's model key was rejected." };
      if (e instanceof Anthropic.RateLimitError) return { ok: false, reason: "error", message: "The model service is rate limiting; try again shortly." };
      if (e instanceof Anthropic.APIError) return { ok: false, reason: "error", message: `The model service returned an error (${e.status ?? "no status"}).` };
      return { ok: false, reason: "error", message: "The model service could not be reached." };
    }
  }
}
