import type { SupabaseClient } from "@supabase/supabase-js";

export type SwapDecision = "accepted" | "rejected";

export type SwapDecisionResult = {
  id: string;
  status: string;
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

async function notifyParticipants(
  supabase: SupabaseClient,
  swap: SwapRow,
  decision: SwapDecision,
) {
  const title = decision === "accepted" ? "Swap accepted" : "Swap rejected";
  const body =
    decision === "accepted"
      ? "A swap was accepted. You can continue to exchange details."
      : "A swap was rejected and the items remain available.";

  await supabase.from("notifications").insert([
    {
      user_id: swap.requester_id,
      type: decision === "accepted" ? "swap_accepted" : "swap_rejected",
      title,
      body,
      data: { swap_id: swap.id, conversation_id: swap.conversation_id },
      read: false,
      is_read: false,
      priority: "normal",
    },
    {
      user_id: swap.responder_id,
      type: decision === "accepted" ? "swap_accepted" : "swap_rejected",
      title,
      body,
      data: { swap_id: swap.id, conversation_id: swap.conversation_id },
      read: false,
      is_read: false,
      priority: "normal",
    },
  ]);
}

export async function decideSwap(
  supabase: SupabaseClient,
  swapId: string,
  actorId: string,
  decision: SwapDecision,
): Promise<SwapDecisionResult | null> {
  const { data: swap, error: swapError } = await supabase
    .from("swaps")
    .select("id, requester_id, responder_id, offered_item_id, requested_item_id, status, conversation_id")
    .eq("id", swapId)
    .maybeSingle();

  if (swapError || !swap) {
    console.error("decideSwap lookup failed", swapError);
    return null;
  }

  const row = swap as SwapRow;
  if (actorId !== row.requester_id && actorId !== row.responder_id) {
    console.error("decideSwap actor is not a participant");
    return null;
  }

  if (!["pending", "proposed", "pending_chat"].includes(row.status)) {
    console.error("decideSwap invalid status", row.status);
    return null;
  }

  const nextStatus = decision === "accepted" ? "accepted" : "rejected";
  const now = new Date().toISOString();

  const { data: updated, error: updateError } = await supabase
    .from("swaps")
    .update({
      status: nextStatus,
      ...(decision === "accepted" ? { accepted_at: now } : { rejected_at: now }),
      updated_at: now,
    })
    .eq("id", row.id)
    .select("id, status")
    .single();

  if (updateError || !updated) {
    console.error("decideSwap update failed", updateError);
    return null;
  }

  if (decision === "accepted") {
    const itemIds = [row.offered_item_id, row.requested_item_id].filter(Boolean) as string[];
    if (itemIds.length > 0) {
      await supabase
        .from("items")
        .update({ status: "reserved", is_active: false, updated_at: now })
        .in("id", itemIds);
    }

    await supabase
      .from("conversations")
      .update({ status: "accepted", updated_at: now })
      .eq("id", row.conversation_id);
  }

  if (decision === "rejected") {
    await supabase
      .from("conversations")
      .update({ status: "rejected", updated_at: now })
      .eq("id", row.conversation_id);
  }

  await notifyParticipants(supabase, row, decision);

  return updated as SwapDecisionResult;
}
