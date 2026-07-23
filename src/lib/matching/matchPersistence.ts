import type { SupabaseClient } from "@supabase/supabase-js";
import type { MatchingItemRow } from "@/lib/matching/matchQueries";

export type MatchScoreBreakdown = {
  categoryMatch: number;
  valueMatch: number;
  typeMatch: number;
  geoScore: number;
  trustScore: number;
  activityScore: number;
  total: number;
};

export type PersistableMatchCandidate = {
  item: MatchingItemRow;
  score: number;
  breakdown: MatchScoreBreakdown;
};

export type PersistedMatch = {
  id: string;
  status: string;
  converted_swap_id: string | null;
};

export type PersistMatchInput = {
  userId: string;
  sourceItem: MatchingItemRow | null;
  candidate: PersistableMatchCandidate;
  slotPosition?: number | null;
};

export type ConvertedMatchResult = {
  matchId: string;
  swapId: string;
  conversationId: string;
};

type MatchRow = {
  id: string;
  initiator_id: string;
  target_user_id: string;
  initiator_item_id: string | null;
  target_item_id: string;
  ai_score: number | null;
  ai_reasoning: string | null;
  converted_swap_id: string | null;
  status: string;
};

const ACTIVE_MATCH_STATUSES = ["pending_chat", "converted_to_swap", "accepted"];
const ACTIVE_SWAP_STATUSES = ["pending", "proposed", "accepted"];

function buildReasoning(candidate: PersistableMatchCandidate): string {
  const parts = [
    `score=${candidate.score}`,
    `category=${candidate.breakdown.categoryMatch}`,
    `value=${candidate.breakdown.valueMatch}`,
    `wishlist=${candidate.breakdown.typeMatch}`,
    `geo=${candidate.breakdown.geoScore}`,
    `trust=${candidate.breakdown.trustScore}`,
    `activity=${candidate.breakdown.activityScore}`,
  ];

  return parts.join("; ");
}

async function findExistingMatch(
  supabase: SupabaseClient,
  input: PersistMatchInput,
): Promise<PersistedMatch | null> {
  if (!input.sourceItem?.id) return null;

  const { data, error } = await supabase
    .from("matches")
    .select("id, status, converted_swap_id")
    .eq("initiator_id", input.userId)
    .eq("target_user_id", input.candidate.item.owner_id)
    .eq("initiator_item_id", input.sourceItem.id)
    .eq("target_item_id", input.candidate.item.id)
    .in("status", ACTIVE_MATCH_STATUSES)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("findExistingMatch failed", error);
    return null;
  }

  return data as PersistedMatch | null;
}

async function findExistingSwap(
  supabase: SupabaseClient,
  offeredItemId: string,
  requestedItemId: string,
): Promise<{ id: string; conversation_id: string | null } | null> {
  const { data, error } = await supabase
    .from("swaps")
    .select("id, conversation_id")
    .eq("offered_item_id", offeredItemId)
    .eq("requested_item_id", requestedItemId)
    .in("status", ACTIVE_SWAP_STATUSES)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("findExistingSwap failed", error);
    return null;
  }

  return data as { id: string; conversation_id: string | null } | null;
}

export async function persistMatchCandidate(
  supabase: SupabaseClient,
  input: PersistMatchInput,
): Promise<PersistedMatch | null> {
  const existing = await findExistingMatch(supabase, input);
  if (existing) return existing;

  const payload = {
    initiator_id: input.userId,
    target_user_id: input.candidate.item.owner_id,
    initiator_item_id: input.sourceItem?.id ?? null,
    target_item_id: input.candidate.item.id,
    match_type: "ai",
    status: "pending_chat",
    ai_score: input.candidate.score,
    ai_reasoning: buildReasoning(input.candidate),
    slot_position: input.slotPosition ?? null,
  };

  const { data, error } = await supabase
    .from("matches")
    .insert(payload)
    .select("id, status, converted_swap_id")
    .single();

  if (error) {
    console.error("persistMatchCandidate failed", error);
    return null;
  }

  await supabase.from("notifications").insert({
    user_id: input.candidate.item.owner_id,
    type: "match_new",
    title: "New Swaply match",
    body: "Someone expressed interest in your item.",
    data: {
      match_id: data.id,
      item_id: input.candidate.item.id,
      score: input.candidate.score,
    },
    read: false,
    is_read: false,
    priority: "normal",
  });

  return data as PersistedMatch;
}

export async function convertMatchToSwap(
  supabase: SupabaseClient,
  matchId: string,
  actorId: string,
): Promise<ConvertedMatchResult | null> {
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select(
      "id, initiator_id, target_user_id, initiator_item_id, target_item_id, ai_score, ai_reasoning, converted_swap_id, status",
    )
    .eq("id", matchId)
    .maybeSingle();

  if (matchError || !match) {
    console.error("convertMatchToSwap match lookup failed", matchError);
    return null;
  }

  const row = match as MatchRow;
  if (actorId !== row.initiator_id && actorId !== row.target_user_id) {
    console.error("convertMatchToSwap actor is not a participant");
    return null;
  }

  if (row.converted_swap_id) {
    const { data: existingSwap } = await supabase
      .from("swaps")
      .select("id, conversation_id")
      .eq("id", row.converted_swap_id)
      .maybeSingle();

    return {
      matchId: row.id,
      swapId: row.converted_swap_id,
      conversationId: (existingSwap as { conversation_id?: string | null } | null)?.conversation_id ?? "",
    };
  }

  if (!row.initiator_item_id) {
    console.error("convertMatchToSwap requires an initiator item");
    return null;
  }

  const existingSwap = await findExistingSwap(supabase, row.initiator_item_id, row.target_item_id);
  if (existingSwap) {
    await supabase
      .from("matches")
      .update({
        status: "converted_to_swap",
        converted_swap_id: existingSwap.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    return {
      matchId: row.id,
      swapId: existingSwap.id,
      conversationId: existingSwap.conversation_id ?? "",
    };
  }

  const { data: swap, error: swapError } = await supabase
    .from("swaps")
    .insert({
      requester_id: row.initiator_id,
      responder_id: row.target_user_id,
      offered_item_id: row.initiator_item_id,
      requested_item_id: row.target_item_id,
      status: "pending",
      message_initial: row.ai_reasoning ?? "Created from a Swaply match.",
      swap_type: "object",
      swap_metadata: {
        match_id: row.id,
        ai_score: row.ai_score,
        source: "matching_engine",
      },
    })
    .select("id")
    .single();

  if (swapError || !swap) {
    console.error("convertMatchToSwap swap insert failed", swapError);
    return null;
  }

  const swapId = (swap as { id: string }).id;

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .insert({
      swap_id: swapId,
      match_id: row.id,
      participant_ids: [row.initiator_id, row.target_user_id],
      item_ids: [row.initiator_item_id, row.target_item_id],
      status: "active",
      agenda_state: {
        source: "matching_engine",
        match_id: row.id,
        next_step: "chat",
      },
    })
    .select("id")
    .single();

  if (conversationError || !conversation) {
    console.error("convertMatchToSwap conversation insert failed", conversationError);
    return null;
  }

  const conversationId = (conversation as { id: string }).id;

  await supabase
    .from("swaps")
    .update({ conversation_id: conversationId, updated_at: new Date().toISOString() })
    .eq("id", swapId);

  await supabase
    .from("matches")
    .update({
      status: "converted_to_swap",
      converted_swap_id: swapId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  await supabase.from("notifications").insert([
    {
      user_id: row.initiator_id,
      type: "swap_proposed",
      title: "Swap created",
      body: "Your match was converted into a swap conversation.",
      data: { match_id: row.id, swap_id: swapId, conversation_id: conversationId },
      read: false,
      is_read: false,
      priority: "normal",
    },
    {
      user_id: row.target_user_id,
      type: "swap_proposed",
      title: "Swap proposed",
      body: "A match involving your item is ready for chat.",
      data: { match_id: row.id, swap_id: swapId, conversation_id: conversationId },
      read: false,
      is_read: false,
      priority: "normal",
    },
  ]);

  return { matchId: row.id, swapId, conversationId };
}

export async function dismissMatch(
  supabase: SupabaseClient,
  matchId: string,
  userId: string,
  reason = "not_interested",
): Promise<boolean> {
  const { error } = await supabase
    .from("matches")
    .update({
      status: "dismissed",
      dismissed_by: userId,
      dismissed_at: new Date().toISOString(),
      dismiss_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", matchId);

  return !error;
}
