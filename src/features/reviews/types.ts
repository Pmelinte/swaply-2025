// src/features/reviews/types.ts

export interface Review {
  id: string;
  exchangeId: string;
  reviewerId: string;     // cine dă ratingul
  targetUserId: string;   // cine primește ratingul
  stars: number;          // 1–5
  comment?: string;       // opțional
  createdAt: string;
}

export interface CreateReviewInput {
  exchangeId: string;
  stars: number;          // 1–5
  comment?: string;
}

export interface UserRatingSummary {
  userId: string;
  averageStars: number;
  totalReviews: number;
}
