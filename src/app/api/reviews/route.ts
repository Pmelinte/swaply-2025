import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase as createServiceClient } from "@/lib/supabase/service";
import { z } from "zod";

const reviewSchema = z.object({
  swap_id: z.string().min(1),
  reviewed_id: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).default(""),
  tags: z.array(z.string()).max(5).default([]),
  photos: z.array(z.string().url()).max(3).default([]),
});

/** POST — submit a review */
export async function POST(req: NextRequest) {
  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const reviewerId = req.headers.get("x-user-id");
  if (!reviewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify the swap exists and is completed
  const { data: swap } = await supabase
    .from("swap_intents")
    .select("id, requester_id, responder_id, status")
    .eq("id", parsed.data.swap_id)
    .single();

  if (!swap) {
    return NextResponse.json({ error: "Swap not found" }, { status: 404 });
  }
  if (swap.status !== "completed") {
    return NextResponse.json({ error: "Swap not completed" }, { status: 400 });
  }
  if (swap.requester_id !== reviewerId && swap.responder_id !== reviewerId) {
    return NextResponse.json({ error: "Not a participant" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      swap_id: parsed.data.swap_id,
      reviewer_id: reviewerId,
      reviewed_id: parsed.data.reviewed_id,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      tags: parsed.data.tags,
      photos: parsed.data.photos,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Already reviewed" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ review: data }, { status: 201 });
}

/** GET — get reviews for a user */
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

  const [
    { data: reviews, error: reviewsError },
    { data: ratingData, error: ratingError },
  ] = await Promise.all([
    supabase
      .from("reviews")
      .select("*")
      .eq("reviewed_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.rpc("get_user_rating", { target_user_id: userId }),
  ]);

  if (reviewsError || ratingError) {
    return NextResponse.json({ error: (reviewsError ?? ratingError)?.message }, { status: 500 });
  }

  const rating = Array.isArray(ratingData) && ratingData.length > 0
    ? ratingData[0]
    : { avg_rating: 0, review_count: 0 };

  return NextResponse.json({
    reviews: reviews ?? [],
    avgRating: Number(rating.avg_rating),
    reviewCount: Number(rating.review_count),
  });
}
