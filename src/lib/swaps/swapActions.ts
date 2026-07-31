import type { SupabaseClient } from "@supabase/supabase-js";
import { isSwapStatus } from "./lifecycle";
import { transitionSwap } from "./transitionService";

export type SwapDecision = "accepted" | "rejected";

export type SwapDecisionResult = {
  id: string;
  status: string;
  replayed?: boolean;
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
  idempotencyKey?: string,
): Promise<SwapDecisionResult | null> {
  const { data: swap, error: swapError } = await supabase
    .from("swaps")
    .select(
      "id, requester_id, responder_id, offered_item_id, requested_item_id, status, conversation_id",
    )
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

  if (!isSwapStatus(row.status) || row.status !== "pending") {
    console.error("decideSwap invalid status", row.status);
    return null;
  }

  const transition = await transitionSwap(supabase, {
    swapId: row.id,
    expectedStatus: row.status,
    toStatus: decision,
    idempotencyKey:
      idempotencyKey ?? `decision:${row.id}:${row.status}:${decision}`,
  });

  if (!transition.ok) {
    console.error("decideSwap transition failed", transition.error);
    return null;
  }

  const now = new Date().toISOString();

  // Existing follow-up effects remain adapters after the canonical status write.
  // Atomic exactly-once effects are handled in Batch 61.3/C3.
  if (!transition.data.replayed && decision === "accepted") {
    const itemIds = [row.offered_item_id, row.requested_item_id].filter(
      Boolean,
    ) as string[];
    if (itemIds.length > 0) {
      await supabase
        .from("items")
        .update({ status: "reserved", is_active: false, updated_at: now })
        .in("id", itemIds);
    }
  }

  if (!transition.data.replayed) {
    await notifyParticipants(supabase, row, decision);
  }

  return {
    id: String(transition.data.swap.id ?? row.id),
    status: String(transition.data.swap.status ?? decision),
    replayed: transition.data.replayed,
  };
}
