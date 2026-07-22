import type { ServiceFormData } from "./serviceWizardStore";

export async function submitServiceWizard(
  form: ServiceFormData,
): Promise<{ id: string }[]> {
  const response = await fetch("/api/items/services", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ form }),
  });

  const body = (await response.json().catch(() => null)) as { items?: { id: string }[]; error?: string } | null;
  if (!response.ok) throw new Error(body?.error ?? "Failed to save service. Please try again.");
  return body?.items ?? [];
}
