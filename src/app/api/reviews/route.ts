import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceSupabase as createServiceClient } from "@/lib/supabase/service";
import { getServerSupabase } from "@/lib/supabase/server";
import {
  ReviewAuthorityError,
  submitCanonicalReview,
} from "@/lib/reviews/reviewServer";

const reviewSchema = z.object({
  swap_id: z.string().uuid(),
  reviewed_id: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).default(""),
  tags: z.array(z.string().trim().min(1).max(40)).max(5).default([]),
  photos: z.array(z.string().url()).max(3).default([]),
  idempotencyKey: z.string().trim().min(8).max(200).optional(),
});

/** POST — compatibility endpoint backed by the canonical Review RPC. */
export async function POST(req: NextRequest) {
  const session = await getServerSupabase();
  const {
    data: { user },
    error: userError,
  } = session
    ? await session.auth.getUser()
    : { data: { user: null }, error: null };

  if (userError || !user || !session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid review" },
      { status: 400 },
    );
  }

  const headerKey = req.headers.get("idempotency-key")?.trim();
  const idempotencyKey =
    headerKey ||
    parsed.data.idempotencyKey ||
    `review:${parsed.data.swap_id}:${user.id}`;

  try {
    const result = await submitCanonicalReview(session, {
      swapId: parsed.data.swap_id,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      tags: parsed.data.tags,
      photos: parsed.data.photos,
      idempotencyKey,
    });

    return NextResponse.json(result, { status: result.replayed ? 200 : 201 });
  } catch (error) {
    if (error instanceof ReviewAuthorityError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }

    console.error("Compatibility review submission failed", error);
    return NextResponse.json({ error: "Could not submit review" }, { status: 500 });
  }
}

/** GET — public received reviews and, for the current user, reviews they gave. */
export async function GET(req: NextRequest) {
  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const url = new URL(req.url);
  const userId = url.searchParams.get("user_id");
  if (!userId) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  const session = await getServerSupabase();
  const {
    data: { user },
  } = session
    ? await session.auth.getUser()
    : { data: { user: null } };

  const receivedQuery = supabase
    .from("reviews")
    .select("id, swap_id, reviewer_id, reviewed_id, rating, comment, tags, photos, response, created_at, updated_at")
    .eq("reviewed_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  const ratingQuery = supabase.rpc("get_user_rating", {
    target_user_id: userId,
  });

  const givenQuery =
    user?.id === userId
      ? supabase
          .from("reviews")
          .select("id, swap_id, reviewer_id, reviewed_id, rating, comment, tags, photos, response, created_at, updated_at")
          .eq("reviewer_id", userId)
          .order("created_at", { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [], error: null });

  const [receivedResult, ratingResult, givenResult] = await Promise.all([
    receivedQuery,
    ratingQuery,
    givenQuery,
  ]);

  const firstError =
    receivedResult.error ?? ratingResult.error ?? givenResult.error;
  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  const ratingData = ratingResult.data;
  const rating =
    Array.isArray(ratingData) && ratingData.length > 0
      ? ratingData[0]
      : { avg_rating: 0, review_count: 0 };

  return NextResponse.json({
    reviews: receivedResult.data ?? [],
    givenReviews: givenResult.data ?? [],
    avgRating: Number(rating.avg_rating),
    reviewCount: Number(rating.review_count),
  });
}
