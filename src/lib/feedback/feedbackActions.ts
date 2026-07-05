import type { SupabaseClient } from "@supabase/supabase-js";

export type FeedbackRating = 1 | 2 | 3 | 4 | 5;

export type SubmitFeedbackInput = {
  swapId: string;
  reviewerId: string;
  rating: FeedbackRating;
  comment?: string;
};

type SwapFeedbackRow = {
  id: string;
  requester_id: string;
  responder_id: string;
  status: string;
};

type ProfileFeedbackStats = {
  rating?: number | null;
  rating_count?: number | null;
  trust_score?: number | null;
};

function clampRating(value: number): FeedbackRating {
  return Math.min(5, Math.max(1, Math.round(value))) as FeedbackRating;
}

async function updateReviewedProfile(
  supabase: SupabaseClient,
  reviewedUserId: string,
  rating: FeedbackRating,
) {
  const { data } = await supabase
    .from("profiles")
    .select("rating, rating_count, trust_score")
    .eq("user_id", reviewedUserId)
    .maybeSingle();

  const stats = (data ?? {}) as ProfileFeedbackStats;
  const count = stats.rating_count ?? 0;
  const current = stats.rating ?? 0;
  const nextCount = count + 1;
  const nextRating = Number(((current * count + rating) / nextCount).toFixed(2));
  const trustBoost = rating >= 4 ? 3 : rating === 3 ? 1 : -4;

  await supabase
    .from("profiles")
    .update({
      rating: nextRating,
      rating_count: nextCount,
      trust_score: Math.max(0, Math.min(100, (stats.trust_score ?? 0) + trustBoost)),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", reviewedUserId);
}

export async function submitSwapFeedback(
  supabase: SupabaseClient,
  input: SubmitFeedbackInput,
): Promise<{ id: string } | null> {
  const rating = clampRating(input.rating);
  const { data: swap, error: swapError } = await supabase
    .from("swaps")
    .select("id, requester_id, responder_id, status")
    .eq("id", input.swapId)
    .maybeSingle();

  if (swapError || !swap) {
    console.error("submitSwapFeedback swap lookup failed", swapError);
    return null;
  }

  const row = swap as SwapFeedbackRow;
  if (row.status !== "completed") {
    console.error("submitSwapFeedback requires completed swap");
    return null;
  }

  if (input.reviewerId !== row.requester_id && input.reviewerId !== row.responder_id) {
    console.error("submitSwapFeedback reviewer is not participant");
    return null;
  }

  const reviewedUserId = input.reviewerId === row.requester_id ? row.responder_id : row.requester_id;

  const { data: existing } = await supabase
    .from("feedback")
    .select("id")
    .eq("swap_id", input.swapId)
    .eq("reviewer_id", input.reviewerId)
    .maybeSingle();

  if (existing?.id) return existing as { id: string };

  const { data, error } = await supabase
    .from("feedback")
    .insert({
      swap_id: input.swapId,
      reviewer_id: input.reviewerId,
      reviewed_user_id: reviewedUserId,
      rating,
      comment: input.comment?.trim() || null,
      feedback_type: "swap",
      is_public: true,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("submitSwapFeedback insert failed", error);
    return null;
  }

  await updateReviewedProfile(supabase, reviewedUserId, rating);

  await supabase.from("notifications").insert({
    user_id: reviewedUserId,
    type: "feedback_received",
    title: "New feedback received",
    body: `You received a ${rating}/5 review for a completed swap.`,
    data: { swap_id: input.swapId, feedback_id: data.id, rating },
    read: false,
    is_read: false,
    priority: "normal",
  });

  return data as { id: string };
}
