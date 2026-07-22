import type { EventFormData } from "./eventWizardStore";

export async function submitEventWizard(
  form: EventFormData,
): Promise<{ id: string }[]> {
  const response = await fetch("/api/items/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ form }),
  });

  const body = (await response.json().catch(() => null)) as { items?: { id: string }[]; error?: string } | null;
  if (!response.ok) throw new Error(body?.error ?? "Failed to save event. Please try again.");
  return body?.items ?? [];
}
