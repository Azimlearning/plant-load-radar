import { buildBoard } from "@/data/board";
import { loadJsonDataset } from "@/data/loaders";
import { SyntheticScenarioSchema } from "@/data/schema";
import { SCENARIO_FILE } from "@/data/synth";
import { Board } from "./board";

// A server component: it reads the committed scenario through the manifest-enforcing loader (no manifest
// row, no data), builds the view-model, and hands a finished model to the layout. Prerendered at build time.
export default function Home() {
  const { data: scenario } = loadJsonDataset(SCENARIO_FILE, SyntheticScenarioSchema);
  return <Board model={buildBoard(scenario)} />;
}
