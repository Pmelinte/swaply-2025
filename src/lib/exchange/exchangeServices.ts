import { getSupabaseClient } from "@/lib/supabase/client";
import { isSwapStatus } from "@/lib/swaps/lifecycle";
import { transitionSwapFromClient } from "@/lib/swaps/transitionClient";
import type { ServiceType, SupportService } from "./exchangeQuery";

export type { ServiceType, SupportService };

export interface ServiceDef {
  key: ServiceType;
  labelKey: string;
  icon: string;
  bilateral: boolean;
  group: "bilateral" | "individual" | "additional";
}

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
  userId: string,
): Promise<string[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data: existing } = await supabase
    .from("swaps")
    .select("confirmed_by")
    .eq("id", swapId)
    .maybeSingle();

  const current: string[] =
    (existing as { confirmed_by?: string[] } | null)?.confirmed_by ?? [];
  if (current.includes(userId)) return current;

  const updated = [...current, userId];
  await supabase
    .from("swaps")
    .update({ confirmed_by: updated })
    .eq("id", swapId);

  return updated;
}

/**
 * Temporary compatibility bridge. Batch 61.3 will replace this client-side
 * bilateral check with a dedicated exactly-once completion command.
 */
export async function completeSwap(swapId: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { data: swap, error } = await supabase
    .from("swaps")
    .select("status")
    .eq("id", swapId)
    .maybeSingle();

  if (error || !swap || !isSwapStatus(swap.status)) return;
  if (swap.status === "completed") return;
  if (swap.status !== "accepted" && swap.status !== "in_progress") return;

  await transitionSwapFromClient(supabase, {
    swapId,
    expectedStatus: swap.status,
    toStatus: "completed",
  });
}

export async function submitReview(
  swapId: string,
  reviewerId: string,
  reviewedId: string,
  ratings: {
    overall: number;
    communication: number;
    accuracy: number;
    punctuality: number;
  },
  comment: string,
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const avgRating =
    (ratings.overall +
      ratings.communication +
      ratings.accuracy +
      ratings.punctuality) /
    4;

  await supabase.from("reviews").insert({
    swap_id: swapId,
    reviewer_id: reviewerId,
    reviewed_id: reviewedId,
    rating: Math.round(avgRating * 10) / 10,
    rating_communication: ratings.communication,
    rating_accuracy: ratings.accuracy,
    rating_punctuality: ratings.punctuality,
    comment,
    tags: [],
  });
}
