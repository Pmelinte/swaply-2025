import type { SupabaseClient } from "@supabase/supabase-js";

export type SwapFeedbackInput = {
  swapId: string;
  reviewerId: string;
  rating: number;
  comment?: string;
  wouldSwapAgain?: boolean;
  tags?: string[];
};

export type SwapFeedbackRow = {
  id: string;
  swap_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  would_swap_again: boolean | null;
  tags: string[] | null;
  created_at: string;
};

type SwapRow = {
  id: string;
  requester_id: string;
  responder_id: string;
  status: string;
};

function clampRating(value: number): number {
  if (!Number.isFinite(value)) return 5;
  return Math.max(1, Math.min(5, Math.round(value)));
}

async function recomputeProfileReputation(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("swap_feedback")
    .select("rating")
    .eq("reviewee_id", userId);

  if (error || !data) return;

  const ratings = data.map((entry) => Number(entry.rating)).filter(Number.isFinite);
  if (ratings.length === 0) return;

  const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  const trustScore = Math.round(Math.min(100, Math.max(0, average * 20)));

  await supabase
    .from("profiles")
    .update({
      rating: Number(average.toFixed(2)),
      rating_count: ratings.length,
      trust_score: trustScore,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
}

export async function submitSwapFeedback(
  supabase: SupabaseClient,
  input: SwapFeedbackInput,
): Promise<SwapFeedbackRow | null> {
  const { data: swap, error: swapError } = await supabase
    .from("swaps")
    .select("id, requester_id, responder_id, status")
    .eq("id", input.swapId)
    .maybeSingle();

  if (swapError || !swap) {
    console.error("submitSwapFeedback swap lookup failed", swapError);
    return null;
  }

  const row = swap as SwapRow;
  if (row.status !== "completed") {
    console.error("submitSwapFeedback requires completed swap", row.status);
    return null;
  }

  if (input.reviewerId !== row.requester_id && input.reviewerId !== row.responder_id) {
    console.error("submitSwapFeedback reviewer is not a swap participant");
    return null;
  }

  const revieweeId = input.reviewerId === row.requester_id ? row.responder_id : row.requester_id;

  const payload = {
    swap_id: input.swapId,
    reviewer_id: input.reviewerId,
    reviewee_id: revieweeId,
    rating: clampRating(input.rating),
    comment: input.comment?.trim() || null,
    would_swap_again: input.wouldSwapAgain ?? true,
    tags: input.tags ?? [],
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("swap_feedback")
    .upsert(payload, { onConflict: "swap_id,reviewer_id" })
    .select("id, swap_id, reviewer_id, reviewee_id, rating, comment, would_swap_again, tags, created_at")
    .single();

  if (error || !data) {
    console.error("submitSwapFeedback upsert failed", error);
    return null;
  }

  await recomputeProfileReputation(supabase, revieweeId);

  await supabase.from("notifications").insert({
    user_id: revieweeId,
    type: "feedback_received",
    title: "New feedback received",
    body: `You received a ${payload.rating}/5 rating for a completed swap.`,
    data: { swap_id: input.swapId, feedback_id: data.id, rating: payload.rating },
    read: false,
    is_read: false,
    priority: "normal",
  });

  return data as SwapFeedbackRow;
}

export async function fetchSwapFeedback(
  supabase: SupabaseClient,
  swapId: string,
): Promise<SwapFeedbackRow[]> {
  const { data, error } = await supabase
    .from("swap_feedback")
    .select("id, swap_id, reviewer_id, reviewee_id, rating, comment, would_swap_again, tags, created_at")
    .eq("swap_id", swapId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchSwapFeedback failed", error);
    return [];
  }

  return (data ?? []) as SwapFeedbackRow[];
}
