import { connection } from "next/server";
import { buildDecisions, refusalText } from "@/data/decisions";
import { loadJsonDataset } from "@/data/loaders";
import { SyntheticScenarioSchema } from "@/data/schema";
import { SCENARIO_FILE } from "@/data/synth";
import { fileStore } from "@/ledger/store";
import { decide } from "./actions";
import { Decisions } from "./decisions";

// Rendered per request: it reads the ledger, which changes when a person decides.
export default async function DecisionsPage({ searchParams }: PageProps<"/decisions">) {
  await connection();
  const { error } = await searchParams;
  const scenario = loadJsonDataset(SCENARIO_FILE, SyntheticScenarioSchema).data;
  const model = buildDecisions(scenario, fileStore().read(), refusalText(typeof error === "string" ? error : undefined));
  return <Decisions model={model} action={decide} />;
}
