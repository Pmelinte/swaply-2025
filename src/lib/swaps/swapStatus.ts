import type { SupabaseClient } from "@supabase/supabase-js";

export type SwapTransition = "accepted" | "rejected" | "cancelled" | "completed";

const ALLOWED_TRANSITIONS: Record<SwapTransition, string[]> = {
  accepted: ["pending"],
  rejected: ["pending", "accepted", "in_progress"],
  cancelled: ["pending", "accepted", "in_progress"],
  completed: ["accepted", "in_progress"],
};

type SwapRow = {
  id: string;
  requester_id: string;
  responder_id: string;
  offered_item_id: string | null;
  requested_item_id: string | null;
  status: string;
};

function canActorTransition(row: SwapRow, actorId: string, transition: SwapTransition): boolean {
  if (actorId !== row.requester_id && actorId !== row.responder_id) return false;
  if (transition === "accepted") return actorId === row.responder_id;
  return true;
}

async function releaseItems(
  supabase: SupabaseClient,
  row: SwapRow,
): Promise<void> {
  const itemIds = [row.offered_item_id, row.requested_item_id].filter(Boolean) as string[];
  if (itemIds.length === 0) return;

  await supabase
    .from("items")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .in("id", itemIds);
}

async function completeItems(
  supabase: SupabaseClient,
  row: SwapRow,
): Promise<void> {
  const itemIds = [row.offered_item_id, row.requested_item_id].filter(Boolean) as string[];
  if (itemIds.length === 0) return;

  await supabase
    .from("items")
    .update({ status: "exchanged", is_active: false, updated_at: new Date().toISOString() })
    .in("id", itemIds);
}

export async function transitionSwapStatus(
  supabase: SupabaseClient,
  input: {
    swapId: string;
    actorId: string;
    transition: SwapTransition;
  },
): Promise<boolean> {
  const { data, error } = await supabase
    .from("swaps")
    .select("id, requester_id, responder_id, offered_item_id, requested_item_id, status")
    .eq("id", input.swapId)
    .maybeSingle();

  if (error || !data) {
    console.error("transitionSwapStatus lookup failed", error);
    return false;
  }

  const row = data as SwapRow;
  if (!canActorTransition(row, input.actorId, input.transition)) return false;
  if (!ALLOWED_TRANSITIONS[input.transition].includes(row.status)) return false;

  const nextStatus = input.transition;
  const { error: updateError } = await supabase
    .from("swaps")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", input.swapId);

  if (updateError) {
    console.error("transitionSwapStatus update failed", updateError);
    return false;
  }

  if (nextStatus === "accepted") {
    const itemIds = [row.offered_item_id, row.requested_item_id].filter(Boolean) as string[];
    if (itemIds.length > 0) {
      await supabase
        .from("items")
        .update({ status: "reserved", updated_at: new Date().toISOString() })
        .in("id", itemIds);
    }
  }

  if (nextStatus === "rejected" || nextStatus === "cancelled") {
    await releaseItems(supabase, row);
  }

  if (nextStatus === "completed") {
    await completeItems(supabase, row);
  }

  const otherUserId = input.actorId === row.requester_id ? row.responder_id : row.requester_id;
  await supabase.from("notifications").insert({
    user_id: otherUserId,
    type: `swap_${nextStatus}`,
    title: `Swap ${nextStatus}`,
    body: `A swap was marked as ${nextStatus}.`,
    data: { swap_id: row.id, status: nextStatus },
    read: false,
    is_read: false,
    priority: nextStatus === "completed" ? "high" : "normal",
  });

  return true;
}
