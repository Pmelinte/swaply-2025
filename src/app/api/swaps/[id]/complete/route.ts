import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import {
  confirmSwapCompletion,
  mapSwapCompletionErrorStatus,
} from "@/lib/swaps/swapCompletion";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 500 },
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    idempotencyKey?: string;
  };
  const idempotencyKey = (
    request.headers.get("idempotency-key") ??
    body.idempotencyKey ??
    ""
  ).trim();

  if (!idempotencyKey) {
    return NextResponse.json(
      { error: "Idempotency key is required" },
      { status: 422 },
    );
  }

  const { id } = await params;
  const result = await confirmSwapCompletion(supabase, id, idempotencyKey);

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error.message,
        code: result.error.code,
        details: result.error.details,
      },
      { status: mapSwapCompletionErrorStatus(result.error.code) },
    );
  }

  return NextResponse.json(result.data);
}
