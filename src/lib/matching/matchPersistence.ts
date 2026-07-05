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

export async function persistMatchCandidate(
  supabase: SupabaseClient,
  input: PersistMatchInput,
): Promise<PersistedMatch | null> {
  const payload = {
    initiator_id: input.userId,
    target_user_id: input.candidate.item.owner_id,
    initiator_item_id: input.sourceItem?.id ?? null,
    target_item_id: input.candidate.item.id,
    match_type: "engine",
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
    message: "Someone expressed interest in your item.",
    data: {
      match_id: data.id,
      item_id: input.candidate.item.id,
      score: input.candidate.score,
    },
    read: false,
    priority: "normal",
  });

  return data as PersistedMatch;
}

export async function dismissMatch(
  supabase: SupabaseClient,
  matchId: string,
  userId: string,
  reason = "dismissed_by_user",
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
