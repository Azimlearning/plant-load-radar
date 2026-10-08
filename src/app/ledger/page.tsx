import { connection } from "next/server";
import { buildLedger } from "@/data/decisions";
import { loadJsonDataset } from "@/data/loaders";
import { SyntheticScenarioSchema } from "@/data/schema";
import { SCENARIO_FILE } from "@/data/synth";
import { fileStore } from "@/ledger/store";
import { Ledger } from "./ledger";

// Rendered per request: the ledger file changes when a person decides.
export default async function LedgerPage() {
  await connection();
  const scenario = loadJsonDataset(SCENARIO_FILE, SyntheticScenarioSchema).data;
  return <Ledger model={buildLedger(scenario, fileStore().read())} />;
}
