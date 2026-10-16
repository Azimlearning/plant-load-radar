import { connection } from "next/server";
import { extractWithRules } from "@/capture/rules";
import type { ExtractedLine, InboxMessage } from "@/capture/types";
import { loadCaptureInputs } from "@/data/inbox";
import { loadTextDataset } from "@/data/loaders";
import { DO_IMAGE_IDS, doImageLabel, isDoImageId, loadDoImage } from "@/data/photos";
import { buildTry, demoReceivedAt, resolveMessages } from "@/data/try";
import { getProvider } from "@/llm";
import { describeConfig, llmConfig } from "@/llm/config";
import { readMessageWithModel, readPhotoWithModel, type IntakeOutput } from "@/llm/intake";
import { loadNavCounts } from "@/ledger/nav-session";
import { loadScenario } from "@/ledger/scenario-session";
import { TryIt } from "./tryit";

const CSV_FILE = "synthetic/kingdee-export.csv";
/** How many messages one request may send to the model: a cost brake on top of the per-run call cap. */
const MAX_MODEL_MESSAGES = 10;

const transcribe = (out: IntakeOutput): string =>
  out.lines.map((l) => [l.customer.value ?? "", l.product.value ?? "", l.volumeM3.value === null ? "" : `${l.volumeM3.value} m3`, l.neededBy.value ?? "", l.reference.value ?? ""].join(" | ")).join("\n");

// Rendered per request: the answer depends on the text in the address. Nothing is stored.
export default async function TryPage({ searchParams }: PageProps<"/inbox/try">) {
  await connection();
  const q = await searchParams;
  const one = (v: string | string[] | undefined): string | undefined => (typeof v === "string" ? v : undefined);
  const params = { text: one(q.text), channel: one(q.channel), sample: one(q.sample), csv: one(q.csv), reader: one(q.reader), photo: one(q.photo) };
  const scenario = await loadScenario();
  const { known, samples } = loadCaptureInputs();
  const csv = params.csv === "sample" ? loadTextDataset(CSV_FILE).text : "";

  const config = llmConfig();
  const provider = getProvider(config);
  const photos = DO_IMAGE_IDS.map((id) => ({ id, label: doImageLabel(id), src: `/do-image/${id}` }));
  const ctx: Parameters<typeof buildTry>[5] = { photos, modelNote: describeConfig(config) };
  const read = new Map<string, ExtractedLine[]>();
  const failures: string[] = [];

  if (params.reader === "model" && provider) {
    const { messages } = resolveMessages(scenario, samples, params, csv);
    for (const m of messages.slice(0, MAX_MODEL_MESSAGES)) {
      const r = await readMessageWithModel(provider, m);
      if (r.ok) read.set(m.id, r.lines);
      else failures.push(r.reason);
    }
    ctx.readerName = provider.name;
    if (failures.length > 0) ctx.modelNote = `${ctx.modelNote} ${failures.length} message(s) could not be read by the model (${[...new Set(failures)].join("; ")}), so the rules reader read them instead.`;
  } else if (params.reader === "model") {
    ctx.modelNote = `${ctx.modelNote} The rules reader was used.`;
  }

  if (params.photo && isDoImageId(params.photo)) {
    if (!provider) {
      ctx.photoNote = "Reading a photo needs the model reader, which is not switched on here. Nothing was read. (A rules reader cannot read pictures.)";
    } else {
      const img = loadDoImage(params.photo);
      const receivedAt = demoReceivedAt(scenario);
      const r = await readPhotoWithModel(provider, { mediaType: img.mediaType, base64: img.bytes.toString("base64") }, receivedAt, transcribe);
      if (r.ok) {
        const message: InboxMessage = { id: `photo-${params.photo}`, channel: "photo", receivedAt, sender: `${doImageLabel(params.photo)} (invented)`, text: r.text };
        read.set(message.id, r.lines);
        ctx.extraMessages = [message];
        ctx.readerName = provider.name;
        ctx.photoNote = "Read by the model from the picture. Every field is at most Inferred: a person checks it against the paper.";
      } else {
        ctx.photoNote = `The photo could not be read: ${r.reason}`;
      }
    }
  }

  if (read.size > 0) ctx.extract = (m: InboxMessage) => read.get(m.id) ?? extractWithRules(m);
  return <TryIt counts={await loadNavCounts()} model={buildTry(scenario, known, samples, params, csv, ctx)} />;
}
