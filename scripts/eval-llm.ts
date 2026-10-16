/**
 * Evaluate a reader against the 22 invented sample messages.
 *   npx tsx scripts/eval-llm.ts rules             offline: the rules reader (the baseline any model must beat)
 *   npx tsx scripts/eval-llm.ts model             live: needs ANTHROPIC_API_KEY and PLR_LLM_MODE=live (or record); spends real money
 *   npx tsx scripts/eval-llm.ts rules --write refdocs/evals/rules-reader.md
 * The model run costs a few cents with the default model and is capped by PLR_LLM_MAX_CALLS. It has not been run in this
 * environment (there is no key here); run it locally and keep the report with the date and the model id.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { extractWithRules } from "../src/capture/rules";
import { loadCaptureInputs } from "../src/data/inbox";
import { loadJsonDataset } from "../src/data/loaders";
import { InboxFileSchema } from "../src/data/schema";
import { getProvider } from "../src/llm";
import { llmConfig } from "../src/llm/config";
import { evaluate, reportMarkdown } from "../src/llm/eval";
import { readMessageWithModel } from "../src/llm/intake";

async function main(): Promise<void> {
  const which = process.argv[2] ?? "rules";
  const writeAt = process.argv.includes("--write") ? process.argv[process.argv.indexOf("--write") + 1] : undefined;
  const file = loadJsonDataset("synthetic/inbox-samples.json", InboxFileSchema).data;
  const { known } = loadCaptureInputs();

  let report: string;
  if (which === "rules") {
    report = reportMarkdown(await evaluate("Rules reader", extractWithRules, file.messages, known));
  } else if (which === "model") {
    const config = llmConfig();
    const provider = getProvider(config);
    if (!provider) {
      console.error("The model reader is not available: set ANTHROPIC_API_KEY and PLR_LLM_MODE=live (or record). Nothing was run.");
      process.exit(1);
    }
    let inputTokens = 0;
    let outputTokens = 0;
    let failures = 0;
    const r = await evaluate(
      provider.name,
      async (m) => {
        const out = await readMessageWithModel(provider, m);
        if (!out.ok) {
          failures += 1;
          return [];
        }
        inputTokens += out.usage.inputTokens;
        outputTokens += out.usage.outputTokens;
        return out.lines;
      },
      file.messages,
      known,
    );
    report = reportMarkdown(r, ["", `- Model: ${config.model}. Calls that failed and were scored as no lines: ${failures}.`, `- Tokens: ${inputTokens} in, ${outputTokens} out.`]);
  } else {
    console.error("Usage: tsx scripts/eval-llm.ts rules|model [--write path]");
    process.exit(1);
  }

  console.log(report);
  if (writeAt) {
    mkdirSync(dirname(writeAt), { recursive: true });
    writeFileSync(writeAt, report);
    console.log(`wrote ${writeAt}`);
  }

}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
