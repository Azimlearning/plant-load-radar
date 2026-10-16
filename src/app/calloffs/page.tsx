import { connection } from "next/server";
import { loadNavCounts } from "@/ledger/nav-session";
import { buildCallOffs } from "@/data/calloffs-view";
import { loadScenario } from "@/ledger/scenario-session";
import { callOffStore } from "@/ledger/visitor";
import { confirmCallOff } from "./actions";
import { CallOffs } from "./calloffs";

// Rendered per request: the slots include this visitor's own call-offs.
export default async function CallOffsPage({ searchParams }: PageProps<"/calloffs">) {
  await connection();
  const q = await searchParams;
  const scenario = await loadScenario();
  const model = buildCallOffs(scenario, await callOffStore.read(), { error: typeof q.error === "string" ? q.error : undefined, ok: q.ok === "1" });
  return <CallOffs counts={await loadNavCounts()} model={model} action={confirmCallOff} />;
}
