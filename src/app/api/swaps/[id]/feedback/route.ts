import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { submitSwapFeedback, type FeedbackRating } from "@/lib/feedback/feedbackActions";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { rating?: number; comment?: string };
  if (!body.rating || body.rating < 1 || body.rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }

  const result = await submitSwapFeedback(supabase, {
    swapId: id,
    reviewerId: user.id,
    rating: body.rating as FeedbackRating,
    comment: body.comment,
  });

  if (!result) {
    return NextResponse.json({ error: "Could not submit feedback" }, { status: 400 });
  }

  return NextResponse.json(result);
}
