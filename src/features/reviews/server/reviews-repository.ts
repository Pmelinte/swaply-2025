// src/features/reviews/server/reviews-repository.ts

import { createServerClient } from "@/lib/supabase/server";
import type {
  Review,
  CreateReviewInput,
  UserRatingSummary,
} from "@/features/reviews/types";

/**
 * Map row din DB → Review
 */
const mapDbReview = (row: any): Review => ({
  id: row.id,
  exchangeId: row.exchange_id,
  reviewerId: row.reviewer_id,
  targetUserId: row.target_user_id,
  stars: row.stars,
  comment: row.comment ?? undefined,
  createdAt: row.created_at,
});

export const reviewsRepository = {
  /**
   * Creează un review nou pentru un schimb finalizat.
   *
   * Verificări:
   *  - schimbul există
   *  - userul face parte din schimb
   *  - schimbul este COMPLETED
   *  - userul nu a lăsat deja review pentru acest schimb
   */
  async createReview(
    reviewerId: string,
    input: CreateReviewInput,
  ): Promise<Review> {
    const supabase = createServerClient();

    // 1) Luăm schimbul
    const { data: exchRow, error: exchError } = await supabase
      .from("exchanges")
      .select("*")
      .eq("id", input.exchangeId)
      .single();

    if (exchError || !exchRow) {
      console.error("createReview: exchange not found", exchError);
      throw new Error("Schimbul nu există.");
    }

    // 2) Verificăm că userul participă la acest schimb
    if (
      exchRow.user_a_id !== reviewerId &&
      exchRow.user_b_id !== reviewerId
    ) {
      throw new Error("Nu poți lăsa review pentru un schimb la care nu ai participat.");
    }

    // 3) Verificăm că schimbul este finalizat
    if (exchRow.status !== "completed") {
      throw new Error("Poți lăsa review doar după finalizarea schimbului.");
    }

    // 4) Determinăm userul care primește rating-ul
    const targetUserId =
      exchRow.user_a_id === reviewerId ? exchRow.user_b_id : exchRow.user_a_id;

    // 5) Verificăm dacă există deja review de la acest user pentru acest schimb
    const { data: existing, error: existingError } = await supabase
      .from("reviews")
      .select("id")
      .eq("exchange_id", input.exchangeId)
      .eq("reviewer_id", reviewerId)
      .limit(1);

    if (existingError) {
      console.error("createReview: check existing error", existingError);
    }

    if (existing && existing.length > 0) {
      throw new Error("Ai lăsat deja un review pentru acest schimb.");
    }

    // 6) Inserăm review-ul
    const payload = {
      exchange_id: input.exchangeId,
      reviewer_id: reviewerId,
      target_user_id: targetUserId,
      stars: input.stars,
      comment: input.comment ?? null,
    };

    const { data: reviewRow, error: reviewError } = await supabase
      .from("reviews")
      .insert(payload)
      .select("*")
      .single();

    if (reviewError || !reviewRow) {
      console.error("createReview: insert error", reviewError);
      throw new Error("Nu am putut salva review-ul.");
    }

    return mapDbReview(reviewRow);
  },

  /**
   * Returnează toate review-urile primite de un user.
   */
  async listReviewsForUser(userId: string): Promise<Review[]> {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("target_user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("listReviewsForUser error:", error);
      throw new Error("Nu am putut încărca review-urile.");
    }

    return (data ?? []).map(mapDbReview);
  },

  /**
   * Returnează review-urile pentru un anumit schimb (de obicei max 2).
   */
  async listReviewsForExchange(exchangeId: string): Promise<Review[]> {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("exchange_id", exchangeId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("listReviewsForExchange error:", error);
      throw new Error("Nu am putut încărca review-urile pentru acest schimb.");
    }

    return (data ?? []).map(mapDbReview);
  },

  /**
   * Rezumatul rating-ului unui user (media și numărul de review-uri).
   */
  async getUserRatingSummary(userId: string): Promise<UserRatingSummary> {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("reviews")
      .select("stars")
      .eq("target_user_id", userId);

    if (error) {
      console.error("getUserRatingSummary error:", error);
      throw new Error("Nu am putut calcula rating-ul utilizatorului.");
    }

    const rows = data ?? [];

    if (rows.length === 0) {
      return {
        userId,
        averageStars: 0,
        totalReviews: 0,
      };
    }

    const total = rows.reduce((sum, r: any) => sum + (r.stars as number), 0);
    const average = total / rows.length;

    return {
      userId,
      averageStars: Number(average.toFixed(2)),
      totalReviews: rows.length,
    };
  },
};
