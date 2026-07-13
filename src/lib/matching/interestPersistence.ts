import type { SupabaseClient } from "@supabase/supabase-js";
import type { MatchingItemRow } from "@/lib/matching/matchQueries";

export type InterestSource = "browsing" | "map" | "ai";

export type ExpressedInterestRow = {
  id: string;
  to_user_id: string;
  to_item_id: string;
  match_score: number | null;
};

export type ReceivedInterestRow = {
  id: string;
  from_user_id: string;
  from_item_id: string;
  to_item_id: string;
  match_score: number | null;
  created_at: string | null;
};

export type PersistInterestInput = {
  userId: string;
  sourceItem: MatchingItemRow | null;
  candidate: {
    item: MatchingItemRow;
    score: number;
  };
  source?: InterestSource;
};

export async function fetchExpressedInterests(
  supabase: SupabaseClient,
  userId: string,
): Promise<ExpressedInterestRow[]> {
  const { data, error } = await supabase
    .from("matching_interests")
    .select("id, to_user_id, to_item_id, match_score")
    .eq("from_user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchExpressedInterests failed", error);
    return [];
  }

  return (data ?? []) as ExpressedInterestRow[];
}

export async function fetchReceivedInterests(
  supabase: SupabaseClient,
  userId: string,
): Promise<ReceivedInterestRow[]> {
  const { data, error } = await supabase
    .from("matching_interests")
    .select("id, from_user_id, from_item_id, to_item_id, match_score, created_at")
    .eq("to_user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchReceivedInterests failed", error);
    return [];
  }

  return (data ?? []) as ReceivedInterestRow[];
}

export async function persistExpressedInterest(
  supabase: SupabaseClient,
  input: PersistInterestInput,
): Promise<ExpressedInterestRow | null> {
  if (!input.sourceItem?.id) {
    console.error("persistExpressedInterest requires a source item");
    return null;
  }

  if (input.userId === input.candidate.item.owner_id) {
    console.error("persistExpressedInterest cannot target the user's own item");
    return null;
  }

  const { data: existing, error: existingError } = await supabase
    .from("matching_interests")
    .select("id, to_user_id, to_item_id, match_score")
    .eq("from_user_id", input.userId)
    .eq("to_user_id", input.candidate.item.owner_id)
    .eq("from_item_id", input.sourceItem.id)
    .eq("to_item_id", input.candidate.item.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    console.error("persistExpressedInterest lookup failed", existingError);
    return null;
  }

  if (existing) {
    return existing as ExpressedInterestRow;
  }

  const { data, error } = await supabase
    .from("matching_interests")
    .insert({
      from_user_id: input.userId,
      to_user_id: input.candidate.item.owner_id,
      from_item_id: input.sourceItem.id,
      to_item_id: input.candidate.item.id,
      match_score: input.candidate.score,
      source: input.source ?? "browsing",
      status: "pending",
    })
    .select("id, to_user_id, to_item_id, match_score")
    .single();

  if (error) {
    console.error("persistExpressedInterest failed", error);
    return null;
  }

  return data as ExpressedInterestRow;
}

export async function withdrawExpressedInterest(
  supabase: SupabaseClient,
  interestId: string,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("matching_interests")
    .update({ status: "refused" })
    .eq("id", interestId)
    .eq("from_user_id", userId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("withdrawExpressedInterest failed", error);
    return false;
  }

  return Boolean(data);
}
