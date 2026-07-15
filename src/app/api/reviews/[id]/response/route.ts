import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase/server";
import {
  respondToCanonicalReview,
  ReviewAuthorityError,
} from "@/lib/reviews/reviewServer";

const responseSchema = z.object({
  response: z.string().max(1000),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = responseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid response" },
      { status: 400 },
    );
  }

  const { id } = await params;

  try {
    const result = await respondToCanonicalReview(
      supabase,
      id,
      parsed.data.response,
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ReviewAuthorityError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }

    console.error("Canonical review response failed", error);
    return NextResponse.json({ error: "Could not save response" }, { status: 500 });
  }
}
