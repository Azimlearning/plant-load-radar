import { connection } from "next/server";
import { buildBoard } from "@/data/board";
import { loadCapture } from "@/data/inbox";
import { loadJsonDataset } from "@/data/loaders";
import { SyntheticScenarioSchema } from "@/data/schema";
import { SCENARIO_FILE } from "@/data/synth";
import { loadRows } from "@/ledger/session";
import { Board } from "./board";

const PREVIEW_ROWS = 4; // how many lines to check the board shows before pointing to the inbox

// A server component. It reads the committed scenario through the manifest-enforcing loader (no manifest row, no
// data) and the ledger file, builds the view-model, and hands a finished model to the layout. Rendered per request
// because the ledger changes when a person decides.
export default async function Home() {
  await connection();
  const { data: scenario } = loadJsonDataset(SCENARIO_FILE, SyntheticScenarioSchema);
  const { result } = loadCapture();
  const preview = result.messages
    .flatMap((m) => m.lines)
    .filter((l) => l.needsPerson)
    .slice(0, PREVIEW_ROWS)
    .map((l) => ({ who: l.line.customer.value, product: l.line.product.value, volumeM3: l.line.volumeM3.value, tier: l.line.tier, why: l.reasons[0] ?? "" }));
  return <Board model={buildBoard(scenario, { needsPerson: result.counts.needsPerson, lines: result.counts.lines, preview }, await loadRows(scenario))} />;
}
