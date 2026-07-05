import type { SupabaseClient } from "@supabase/supabase-js";

export type CompleteSwapResult = {
  id: string;
  status: "completed";
};

type SwapRow = {
  id: string;
  requester_id: string;
  responder_id: string;
  offered_item_id: string | null;
  requested_item_id: string | null;
  status: string;
  conversation_id: string | null;
};

type ProfileStats = {
  completed_swaps?: number | null;
  completion_rate?: number | null;
  trust_score?: number | null;
};

function nextCompletionRate(current: number | null | undefined): number {
  if (typeof current !== "number" || Number.isNaN(current)) return 100;
  return Math.min(100, Math.round(current * 0.9 + 10));
}

function nextTrustScore(current: number | null | undefined): number {
  if (typeof current !== "number" || Number.isNaN(current)) return 10;
  return Math.min(100, current + 5);
}

async function bumpProfileStats(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("completed_swaps, completion_rate, trust_score")
    .eq("user_id", userId)
    .maybeSingle();

  const stats = (data ?? {}) as ProfileStats;
  await supabase
    .from("profiles")
    .update({
      completed_swaps: (stats.completed_swaps ?? 0) + 1,
      completion_rate: nextCompletionRate(stats.completion_rate),
      trust_score: nextTrustScore(stats.trust_score),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
}

export async function completeSwap(
  supabase: SupabaseClient,
  swapId: string,
  actorId: string,
): Promise<CompleteSwapResult | null> {
  const { data: swap, error: swapError } = await supabase
    .from("swaps")
    .select("id, requester_id, responder_id, offered_item_id, requested_item_id, status, conversation_id")
    .eq("id", swapId)
    .maybeSingle();

  if (swapError || !swap) {
    console.error("completeSwap lookup failed", swapError);
    return null;
  }

  const row = swap as SwapRow;
  if (actorId !== row.requester_id && actorId !== row.responder_id) {
    console.error("completeSwap actor is not a participant");
    return null;
  }

  if (!["accepted", "in_progress"].includes(row.status)) {
    console.error("completeSwap invalid status", row.status);
    return null;
  }

  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase
    .from("swaps")
    .update({
      status: "completed",
      completed_at: now,
      updated_at: now,
    })
    .eq("id", row.id)
    .select("id, status")
    .single();

  if (updateError || !updated) {
    console.error("completeSwap update failed", updateError);
    return null;
  }

  const itemIds = [row.offered_item_id, row.requested_item_id].filter(Boolean) as string[];
  if (itemIds.length > 0) {
    await supabase
      .from("items")
      .update({ status: "traded", is_active: false, updated_at: now })
      .in("id", itemIds);
  }

  if (row.conversation_id) {
    await supabase
      .from("conversations")
      .update({ status: "completed", updated_at: now })
      .eq("id", row.conversation_id);
  }

  await Promise.all([
    bumpProfileStats(supabase, row.requester_id),
    bumpProfileStats(supabase, row.responder_id),
  ]);

  await supabase.from("notifications").insert([
    {
      user_id: row.requester_id,
      type: "feedback_requested",
      title: "Swap completed",
      body: "Please leave feedback for this completed swap.",
      data: { swap_id: row.id, conversation_id: row.conversation_id },
      read: false,
      is_read: false,
      priority: "normal",
    },
    {
      user_id: row.responder_id,
      type: "feedback_requested",
      title: "Swap completed",
      body: "Please leave feedback for this completed swap.",
      data: { swap_id: row.id, conversation_id: row.conversation_id },
      read: false,
      is_read: false,
      priority: "normal",
    },
  ]);

  return updated as CompleteSwapResult;
}
