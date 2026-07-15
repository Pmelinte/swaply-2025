/**
 * Reviews hook — canonical post-swap public rating and response system.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Review, ReviewTag, UserRating } from "../types";

interface UseReviewsParams {
  userId: string | null;
  swaps: Array<{ id: string; requesterId: string; responderId: string; status: string }>;
  trackEvent: (event: string, properties?: Record<string, string | number | boolean>) => void;
}

type ReviewApiRow = {
  id: string;
  swap_id: string;
  reviewer_id: string;
  reviewed_id: string;
  rating: number;
  comment: string;
  tags: string[] | null;
  photos: string[] | null;
  response: string | null;
  created_at: string;
};

function mapReview(row: ReviewApiRow): Review {
  return {
    id: row.id,
    swapId: row.swap_id,
    reviewerId: row.reviewer_id,
    reviewedId: row.reviewed_id,
    rating: Number(row.rating),
    comment: row.comment ?? "",
    tags: (row.tags ?? []) as ReviewTag[],
    photos: row.photos ?? [],
    response: row.response ?? undefined,
    createdAt: row.created_at,
  };
}

function mergeReviews(current: Review[], incoming: Review[]): Review[] {
  const byId = new Map(current.map((review) => [review.id, review]));
  for (const review of incoming) byId.set(review.id, review);
  return [...byId.values()].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

export function useReviews({ userId, swaps, trackEvent }: UseReviewsParams) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    if (!userId) {
      setReviews([]);
      setLoadingReviews(false);
      return;
    }

    let cancelled = false;
    setLoadingReviews(true);

    void fetch(`/api/reviews?user_id=${encodeURIComponent(userId)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as {
          reviews?: ReviewApiRow[];
          givenReviews?: ReviewApiRow[];
        };
      })
      .then((payload) => {
        if (cancelled || !payload) return;
        const received = (payload.reviews ?? []).map(mapReview);
        const given = (payload.givenReviews ?? []).map(mapReview);
        setReviews(mergeReviews([], [...received, ...given]));
      })
      .catch((error) => {
        console.error("Review hydration failed", error);
      })
      .finally(() => {
        if (!cancelled) setLoadingReviews(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const submitReview = useCallback(
    async (params: {
      swapId: string;
      reviewedId: string;
      rating: number;
      comment: string;
      tags?: ReviewTag[];
      photos?: string[];
    }): Promise<{ error?: string }> => {
      if (!userId) return { error: "Authentication required" };

      const swap = swaps.find((entry) => entry.id === params.swapId);
      if (!swap) return { error: "Swap not found" };
      if (swap.status !== "completed") return { error: "Swap is not completed" };

      const isParticipant =
        swap.requesterId === userId || swap.responderId === userId;
      if (!isParticipant) return { error: "Not a participant" };

      if (params.rating < 1 || params.rating > 5) {
        return { error: "Rating must be between 1 and 5" };
      }

      const response = await fetch(
        `/api/swaps/${encodeURIComponent(params.swapId)}/reviews`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "idempotency-key": `review:${params.swapId}:${userId}`,
          },
          body: JSON.stringify({
            rating: params.rating,
            comment: params.comment,
            tags: params.tags ?? [],
            photos: params.photos ?? [],
            idempotencyKey: `review:${params.swapId}:${userId}`,
          }),
        },
      );

      const payload = (await response.json().catch(() => null)) as
        | { review?: ReviewApiRow; error?: string }
        | null;

      if (!response.ok || !payload?.review) {
        return { error: payload?.error ?? "Could not submit review" };
      }

      const review = mapReview(payload.review);
      setReviews((previous) => mergeReviews(previous, [review]));
      trackEvent("review_submitted", {
        rating: params.rating,
        hasComment: params.comment.length > 0,
        tagCount: (params.tags ?? []).length,
      });

      return {};
    },
    [userId, swaps, trackEvent],
  );

  const respondToReview = useCallback(
    async (reviewId: string, response: string): Promise<{ error?: string }> => {
      if (!userId) return { error: "Authentication required" };

      const result = await fetch(
        `/api/reviews/${encodeURIComponent(reviewId)}/response`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ response }),
        },
      );

      const payload = (await result.json().catch(() => null)) as
        | { review?: ReviewApiRow; error?: string }
        | null;

      if (!result.ok || !payload?.review) {
        return { error: payload?.error ?? "Could not save response" };
      }

      const updated = mapReview(payload.review);
      setReviews((previous) => mergeReviews(previous, [updated]));
      trackEvent("review_response", { reviewId });
      return {};
    },
    [userId, trackEvent],
  );

  const getUserRating = useCallback(
    (targetUserId: string): UserRating => {
      const userReviews = reviews.filter(
        (review) => review.reviewedId === targetUserId,
      );
      const avgRating =
        userReviews.length > 0
          ? userReviews.reduce((sum, review) => sum + review.rating, 0) /
            userReviews.length
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

  const myReviews = useMemo(
    () => reviews.filter((review) => review.reviewerId === userId),
    [reviews, userId],
  );

  const receivedReviews = useMemo(
    () => reviews.filter((review) => review.reviewedId === userId),
    [reviews, userId],
  );

  const canReview = useCallback(
    (swapId: string): boolean => {
      if (!userId) return false;
      const swap = swaps.find((entry) => entry.id === swapId);
      if (!swap || swap.status !== "completed") return false;
      const isParticipant =
        swap.requesterId === userId || swap.responderId === userId;
      if (!isParticipant) return false;
      return !reviews.some(
        (review) => review.swapId === swapId && review.reviewerId === userId,
      );
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
