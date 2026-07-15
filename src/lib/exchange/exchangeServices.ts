import { getSupabaseClient } from "@/lib/supabase/client";
import type { ServiceType, SupportService } from "./exchangeQuery";

export type { ServiceType, SupportService };

export interface ServiceDef {
  key: ServiceType;
  labelKey: string;
  icon: string;
  bilateral: boolean;
  group: "bilateral" | "individual" | "additional";
}

export type CompletionResponse = {
  swap: Record<string, unknown>;
  replayed: boolean;
  idempotency_key: string;
  both_confirmed: boolean;
  confirmed_by: string[];
  effects_applied: boolean;
};

export type ReviewSubmissionResponse = {
  review: Record<string, unknown>;
  replayed: boolean;
  idempotency_key?: string;
};

export const SERVICE_DEFS: ServiceDef[] = [
  { key: "escrow", labelKey: "escrow", icon: "🔒", bilateral: true, group: "bilateral" },
  { key: "insurance", labelKey: "insurance", icon: "🛡️", bilateral: true, group: "bilateral" },
  { key: "transport", labelKey: "transport", icon: "🚚", bilateral: false, group: "individual" },
  { key: "accommodation", labelKey: "accommodation", icon: "🏨", bilateral: false, group: "individual" },
  { key: "packaging", labelKey: "packaging", icon: "📦", bilateral: false, group: "individual" },
  { key: "restaurant", labelKey: "restaurant", icon: "🍽️", bilateral: false, group: "individual" },
  { key: "legal", labelKey: "legal", icon: "⚖️", bilateral: false, group: "additional" },
  { key: "ai_valuation", labelKey: "aiValuation", icon: "🤖", bilateral: false, group: "additional" },
];

export async function upsertService(
  swapId: string,
  userId: string,
  serviceType: ServiceType,
  details: Record<string, unknown>,
  isBilateral = false,
  costEur?: number,
): Promise<SupportService | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("swap_support_services")
    .upsert(
      [{
        swap_id: swapId,
        user_id: userId,
        service_type: serviceType,
        is_bilateral: isBilateral,
        details,
        cost_eur: costEur ?? null,
        status: "active",
      }],
      { onConflict: "swap_id,user_id,service_type" },
    )
    .select("*")
    .maybeSingle();

  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  return {
    id: String(row.id ?? ""),
    swapId: String(row.swap_id ?? ""),
    userId: String(row.user_id ?? ""),
    serviceType: row.service_type as ServiceType,
    isBilateral: !!row.is_bilateral,
    provider: (row.provider as string) ?? null,
    details: (row.details as Record<string, unknown>) ?? {},
    costEur: (row.cost_eur as number) ?? null,
    status: row.status as "pending" | "active" | "completed" | "cancelled",
    createdAt: String(row.created_at ?? ""),
  };
}

export async function removeService(
  swapId: string,
  userId: string,
  serviceType: ServiceType,
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  await supabase
    .from("swap_support_services")
    .delete()
    .eq("swap_id", swapId)
    .eq("user_id", userId)
    .eq("service_type", serviceType);
}

export async function confirmSwap(
  swapId: string,
  idempotencyKey: string,
): Promise<CompletionResponse | null> {
  const response = await fetch(`/api/swaps/${encodeURIComponent(swapId)}/complete`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "idempotency-key": idempotencyKey,
    },
    body: JSON.stringify({ idempotencyKey }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string; code?: string }
      | null;
    console.error("Exchange completion confirmation failed", payload ?? response.status);
    return null;
  }

  const payload = (await response.json()) as Partial<CompletionResponse>;
  if (
    !payload.swap ||
    typeof payload.replayed !== "boolean" ||
    typeof payload.idempotency_key !== "string" ||
    typeof payload.both_confirmed !== "boolean" ||
    !Array.isArray(payload.confirmed_by) ||
    typeof payload.effects_applied !== "boolean"
  ) {
    console.error("Exchange completion returned an invalid response");
    return null;
  }

  return payload as CompletionResponse;
}

export async function fetchMyReview(
  swapId: string,
): Promise<Record<string, unknown> | null> {
  const response = await fetch(`/api/swaps/${encodeURIComponent(swapId)}/reviews`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) return null;
  const payload = (await response.json().catch(() => null)) as
    | { review?: Record<string, unknown> | null }
    | null;
  return payload?.review ?? null;
}

export async function submitReview(
  swapId: string,
  rating: number,
  comment: string,
  idempotencyKey: string,
  tags: string[] = [],
  photos: string[] = [],
): Promise<ReviewSubmissionResponse | null> {
  const response = await fetch(`/api/swaps/${encodeURIComponent(swapId)}/reviews`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "idempotency-key": idempotencyKey,
    },
    body: JSON.stringify({
      rating,
      comment,
      tags,
      photos,
      idempotencyKey,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string; code?: string }
      | null;
    console.error("Canonical review submission failed", payload ?? response.status);
    return null;
  }

  const payload = (await response.json().catch(() => null)) as
    | Partial<ReviewSubmissionResponse>
    | null;
  if (!payload?.review || typeof payload.replayed !== "boolean") {
    console.error("Canonical review endpoint returned an invalid response");
    return null;
  }

  return payload as ReviewSubmissionResponse;
}
