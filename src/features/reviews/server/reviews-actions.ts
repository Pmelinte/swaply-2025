// src/features/reviews/server/reviews-actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { reviewsRepository } from "./reviews-repository";
import type { CreateReviewInput, UserRatingSummary } from "@/features/reviews/types";

/**
 * Helper: obține user-ul autentificat sau aruncă eroare.
 */
async function requireUserId(): Promise<string> {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  return user.id;
}

/**
 * Creează un review pentru un schimb finalizat.
 */
export async function submitReviewAction(input: CreateReviewInput) {
  const reviewerId = await requireUserId();

  const review = await reviewsRepository.createReview(reviewerId, input);

  // Revalidăm schimbul și profilul userului
  revalidatePath(`/exchanges/${input.exchangeId}`);
  revalidatePath(`/profile/${review.targetUserId}`);

  return review;
}

/**
 * Returnează media rating-urilor pentru un user.
 */
export async function getUserRatingSummaryAction(
  userId: string
): Promise<UserRatingSummary> {
  return reviewsRepository.getUserRatingSummary(userId);
}
