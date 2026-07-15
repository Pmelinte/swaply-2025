import type { SupabaseClient } from "@supabase/supabase-js";

export type CanonicalReviewRow = {
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
  updated_at?: string | null;
};

export type CanonicalReviewResult = {
  review: CanonicalReviewRow;
  replayed: boolean;
  idempotency_key?: string;
};

export type SubmitCanonicalReviewInput = {
  swapId: string;
  rating: number;
  comment?: string;
  tags?: string[];
  photos?: string[];
  idempotencyKey: string;
};

export class ReviewAuthorityError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "ReviewAuthorityError";
    this.status = status;
    this.code = code;
  }
}

function statusForDatabaseCode(code: string): number {
  if (code === "P0002") return 404;
  if (code === "42501") return 403;
  if (code === "23505") return 409;
  if (code === "22023" || code === "23514") return 400;
  return 500;
}

function isReviewRow(value: unknown): value is CanonicalReviewRow {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.swap_id === "string" &&
    typeof row.reviewer_id === "string" &&
    typeof row.reviewed_id === "string" &&
    typeof row.rating === "number" &&
    typeof row.comment === "string" &&
    typeof row.created_at === "string"
  );
}

function parseAuthorityResult(value: unknown): CanonicalReviewResult {
  if (!value || typeof value !== "object") {
    throw new ReviewAuthorityError("Invalid review authority response", 500, "INVALID_RESPONSE");
  }

  const payload = value as Record<string, unknown>;
  if (!isReviewRow(payload.review) || typeof payload.replayed !== "boolean") {
    throw new ReviewAuthorityError("Invalid review authority response", 500, "INVALID_RESPONSE");
  }

  return {
    review: payload.review,
    replayed: payload.replayed,
    idempotency_key:
      typeof payload.idempotency_key === "string"
        ? payload.idempotency_key
        : undefined,
  };
}

export async function submitCanonicalReview(
  supabase: SupabaseClient,
  input: SubmitCanonicalReviewInput,
): Promise<CanonicalReviewResult> {
  const { data, error } = await supabase.rpc("submit_swap_review_v1", {
    p_swap_id: input.swapId,
    p_rating: input.rating,
    p_comment: input.comment ?? "",
    p_tags: input.tags ?? [],
    p_photos: input.photos ?? [],
    p_idempotency_key: input.idempotencyKey,
  });

  if (error) {
    throw new ReviewAuthorityError(
      error.message,
      statusForDatabaseCode(error.code ?? ""),
      error.code ?? "DATABASE_ERROR",
    );
  }

  return parseAuthorityResult(data);
}

export async function respondToCanonicalReview(
  supabase: SupabaseClient,
  reviewId: string,
  response: string,
): Promise<CanonicalReviewResult> {
  const { data, error } = await supabase.rpc("respond_to_swap_review_v1", {
    p_review_id: reviewId,
    p_response: response,
  });

  if (error) {
    throw new ReviewAuthorityError(
      error.message,
      statusForDatabaseCode(error.code ?? ""),
      error.code ?? "DATABASE_ERROR",
    );
  }

  return parseAuthorityResult(data);
}
