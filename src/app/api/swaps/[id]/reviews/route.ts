import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase/server";
import {
  ReviewAuthorityError,
  submitCanonicalReview,
} from "@/lib/reviews/reviewServer";

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).default(""),
  tags: z.array(z.string().trim().min(1).max(40)).max(5).default([]),
  photos: z.array(z.string().url()).max(3).default([]),
  idempotencyKey: z.string().trim().min(8).max(200).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

async function authenticatedSession() {
  const supabase = await getServerSupabase();
  if (!supabase) {
    return { error: NextResponse.json({ error: "Supabase is not configured" }, { status: 500 }) };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  }

  return { supabase, user };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await authenticatedSession();
  if ("error" in session) return session.error;

  const { id } = await params;
  const { data, error } = await session.supabase
    .from("reviews")
    .select("id, swap_id, reviewer_id, reviewed_id, rating, comment, tags, photos, response, created_at, updated_at")
    .eq("swap_id", id)
    .eq("reviewer_id", session.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ review: data ?? null });
}

export async function POST(request: Request, { params }: RouteContext) {
  const session = await authenticatedSession();
  if ("error" in session) return session.error;

  const body = await request.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid review" },
      { status: 400 },
    );
  }

  const { id } = await params;
  const headerKey = request.headers.get("idempotency-key")?.trim();
  const idempotencyKey =
    headerKey ||
    parsed.data.idempotencyKey ||
    `review:${id}:${session.user.id}`;

  try {
    const result = await submitCanonicalReview(session.supabase, {
      swapId: id,
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

    console.error("Canonical review submission failed", error);
    return NextResponse.json({ error: "Could not submit review" }, { status: 500 });
  }
}
