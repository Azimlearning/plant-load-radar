import { connection } from "next/server";
import { buildAsk } from "@/data/ask";
import { loadJsonDataset } from "@/data/loaders";
import { SyntheticScenarioSchema } from "@/data/schema";
import { SCENARIO_FILE } from "@/data/synth";
import { Ask } from "./ask";

// Rendered per request: the answer depends on the question in the address.
export default async function AskPage({ searchParams }: PageProps<"/ask">) {
  await connection();
  const q = await searchParams;
  const one = (v: string | string[] | undefined): string | undefined => (typeof v === "string" ? v : undefined);
  const scenario = loadJsonDataset(SCENARIO_FILE, SyntheticScenarioSchema).data;
  return <Ask model={buildAsk(scenario, { week: one(q.week), volume: one(q.volume) })} />;
}
