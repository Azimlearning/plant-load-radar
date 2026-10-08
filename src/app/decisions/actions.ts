"use server";

// The only write path in the app (ADR D-18). A server action is reachable by a direct POST, so it trusts nothing:
// it passes the form's text fields to `recordDecision`, which recomputes every figure itself and refuses an
// unnamed approver, an unknown or already-decided week, or a bad choice. It never reads a number from the form.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { loadJsonDataset } from "@/data/loaders";
import { SyntheticScenarioSchema } from "@/data/schema";
import { SCENARIO_FILE } from "@/data/synth";
import { recordDecision } from "@/ledger/decide";
import { fileStore } from "@/ledger/store";

export async function decide(formData: FormData): Promise<void> {
  const scenario = loadJsonDataset(SCENARIO_FILE, SyntheticScenarioSchema).data;
  const out = recordDecision(
    scenario,
    {
      week: formData.get("week"),
      mode: formData.get("mode"),
      chosenRequestId: formData.get("chosenRequestId"),
      approvedBy: formData.get("approvedBy"),
      note: formData.get("note"),
    },
    fileStore(),
  );
  if (!out.ok) redirect(`/decisions?error=${out.error}`);
  for (const path of ["/", "/decisions", "/ledger"]) revalidatePath(path);
  redirect("/ledger");
}
