import { connection } from "next/server";
import { buildBoard } from "@/data/board";
import { loadCapture } from "@/data/inbox";
import { loadJsonDataset } from "@/data/loaders";
import { SyntheticScenarioSchema } from "@/data/schema";
import { SCENARIO_FILE } from "@/data/synth";
import { fileStore } from "@/ledger/store";
import { Board } from "./board";

// A server component. It reads the committed scenario through the manifest-enforcing loader (no manifest row, no
// data) and the ledger file, builds the view-model, and hands a finished model to the layout. Rendered per request
// because the ledger changes when a person decides.
export default async function Home() {
  await connection();
  const { data: scenario } = loadJsonDataset(SCENARIO_FILE, SyntheticScenarioSchema);
  const { result } = loadCapture();
  return <Board model={buildBoard(scenario, { needsPerson: result.counts.needsPerson, lines: result.counts.lines }, fileStore().read())} />;
}
