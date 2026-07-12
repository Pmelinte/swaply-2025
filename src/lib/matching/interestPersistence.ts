import type { SupabaseClient } from "@supabase/supabase-js";

export type ExpressedInterestRow = {
  id: string;
  target_user_id: string;
  target_item_id: string;
  ai_score: number | null;
};

export async function fetchExpressedInterests(
  supabase: SupabaseClient,
  userId: string,
): Promise<ExpressedInterestRow[]> {
  const { data, error } = await supabase
    .from("matches")
    .select("id, target_user_id, target_item_id, ai_score")
    .eq("initiator_id", userId)
    .eq("status", "interest_expressed")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchExpressedInterests failed", error);
    return [];
  }

  return (data ?? []) as ExpressedInterestRow[];
}

export async function withdrawExpressedInterest(
  supabase: SupabaseClient,
  matchId: string,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("matches")
    .update({
      status: "withdrawn",
      dismissed_by: userId,
      dismissed_at: new Date().toISOString(),
      dismiss_reason: "interest_withdrawn",
      updated_at: new Date().toISOString(),
    })
    .eq("id", matchId)
    .eq("initiator_id", userId)
    .eq("status", "interest_expressed")
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("withdrawExpressedInterest failed", error);
    return false;
  }

  return Boolean(data);
}
