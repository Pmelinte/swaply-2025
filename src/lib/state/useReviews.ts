/**
 * Reviews hook — post-swap public rating & feedback system.
 */
import { useCallback, useMemo, useState } from "react";
import type { Review, ReviewTag, UserRating } from "../types";
import { nanoid } from "nanoid";

interface UseReviewsParams {
  userId: string | null;
  swaps: Array<{ id: string; requesterId: string; responderId: string; status: string }>;
  trackEvent: (event: string, properties?: Record<string, string | number | boolean>) => void;
}

export function useReviews({ userId, swaps, trackEvent }: UseReviewsParams) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews] = useState(false);

  /** Submit a review for a completed swap */
  const submitReview = useCallback(
    async (params: {
      swapId: string;
      reviewedId: string;
      rating: number;
      comment: string;
      tags?: ReviewTag[];
      photos?: string[];
    }): Promise<{ error?: string }> => {
      if (!userId) return { error: "Trebuie să fii autentificat." };

      const swap = swaps.find((s) => s.id === params.swapId);
      if (!swap) return { error: "Schimbul nu a fost găsit." };
      if (swap.status !== "completed") return { error: "Poți lăsa un review doar după finalizarea schimbului." };

      const isParticipant = swap.requesterId === userId || swap.responderId === userId;
      if (!isParticipant) return { error: "Nu ești participant la acest schimb." };

      if (params.rating < 1 || params.rating > 5) return { error: "Rating-ul trebuie să fie între 1 și 5." };

      // Check for duplicate
      const existing = reviews.find((r) => r.swapId === params.swapId && r.reviewerId === userId);
      if (existing) return { error: "Ai lăsat deja un review pentru acest schimb." };

      const review: Review = {
        id: nanoid(),
        swapId: params.swapId,
        reviewerId: userId,
        reviewedId: params.reviewedId,
        rating: params.rating,
        comment: params.comment,
        tags: params.tags ?? [],
        photos: params.photos ?? [],
        createdAt: new Date().toISOString(),
      };

      setReviews((prev) => [review, ...prev]);

      trackEvent("review_submitted", {
        rating: params.rating,
        hasComment: params.comment.length > 0,
        tagCount: (params.tags ?? []).length,
      });

      return {};
    },
    [userId, swaps, reviews, trackEvent],
  );

  /** Respond to a review you received */
  const respondToReview = useCallback(
    async (reviewId: string, response: string): Promise<{ error?: string }> => {
      if (!userId) return { error: "Trebuie să fii autentificat." };

      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId && r.reviewedId === userId
            ? { ...r, response }
            : r,
        ),
      );

      trackEvent("review_response", { reviewId });
      return {};
    },
    [userId, trackEvent],
  );

  /** Get aggregated rating for a user */
  const getUserRating = useCallback(
    (targetUserId: string): UserRating => {
      const userReviews = reviews.filter((r) => r.reviewedId === targetUserId);
      const avgRating =
        userReviews.length > 0
          ? userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length
          : 0;

      const tagCounts: Partial<Record<ReviewTag, number>> = {};
      for (const review of userReviews) {
        for (const tag of review.tags) {
          tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
        }
      }

      return {
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: userReviews.length,
        reviews: userReviews,
        tagCounts,
      };
    },
    [reviews],
  );

  /** Reviews given by current user */
  const myReviews = useMemo(
    () => reviews.filter((r) => r.reviewerId === userId),
    [reviews, userId],
  );

  /** Reviews received by current user */
  const receivedReviews = useMemo(
    () => reviews.filter((r) => r.reviewedId === userId),
    [reviews, userId],
  );

  /** Check if user can leave review for a swap */
  const canReview = useCallback(
    (swapId: string): boolean => {
      if (!userId) return false;
      const swap = swaps.find((s) => s.id === swapId);
      if (!swap || swap.status !== "completed") return false;
      const isParticipant = swap.requesterId === userId || swap.responderId === userId;
      if (!isParticipant) return false;
      return !reviews.some((r) => r.swapId === swapId && r.reviewerId === userId);
    },
    [userId, swaps, reviews],
  );

  return {
    reviews,
    myReviews,
    receivedReviews,
    loadingReviews,
    submitReview,
    respondToReview,
    getUserRating,
    canReview,
  };
}
