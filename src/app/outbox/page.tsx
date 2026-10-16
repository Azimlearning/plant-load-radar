import { connection } from "next/server";
import { loadNavCounts } from "@/ledger/nav-session";
import { buildOutbox } from "@/data/outbox-view";
import { outboxStore } from "@/ledger/visitor";
import { Outbox } from "./outbox";

// Rendered per request: the outbox holds this visitor's own approved messages.
export default async function OutboxPage() {
  await connection();
  return <Outbox counts={await loadNavCounts()} model={buildOutbox(await outboxStore.read())} />;
}
