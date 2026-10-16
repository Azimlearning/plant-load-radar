"use server";

// Confirm a call-off (slide 6, project director). Like the decision action, it trusts nothing in the form: the form's
// text goes to `checkCallOff`, which refuses a missing name, an unknown project, a week too near, or a volume that does not
// fit. The reserved volume is the visitor's own demo state; it is never read back as a figure from the form.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkCallOff } from "@/data/calloffs";
import { loadScenario } from "@/ledger/scenario-session";
import { callOffStore } from "@/ledger/visitor";

export async function confirmCallOff(formData: FormData): Promise<void> {
  const scenario = await loadScenario();
  const outcome = checkCallOff(scenario, { projectId: formData.get("projectId"), week: formData.get("week"), volumeM3: formData.get("volumeM3"), requestedBy: formData.get("requestedBy") }, []);
  if (!outcome.ok) redirect(`/calloffs?error=${outcome.error}`);
  if (!(await callOffStore.append(outcome.callOff))) redirect("/calloffs?error=unknown");
  for (const path of ["/", "/calloffs", "/huddle", "/ask"]) revalidatePath(path);
  redirect("/calloffs?ok=1");
}
