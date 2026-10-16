import { connection } from "next/server";
import { loadNavCounts } from "@/ledger/nav-session";
import { buildAsk } from "@/data/ask";
import { loadScenario } from "@/ledger/scenario-session";
import { Ask } from "./ask";

// Rendered per request: the answer depends on the question in the address.
export default async function AskPage({ searchParams }: PageProps<"/ask">) {
  await connection();
  const q = await searchParams;
  const one = (v: string | string[] | undefined): string | undefined => (typeof v === "string" ? v : undefined);
  const scenario = await loadScenario();
  return <Ask counts={await loadNavCounts()} model={buildAsk(scenario, { week: one(q.week), volume: one(q.volume), q: one(q.q) })} />;
}
