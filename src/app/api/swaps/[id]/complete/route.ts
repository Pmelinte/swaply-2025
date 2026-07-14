import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { completeSwap } from "@/lib/swaps/swapCompletion";

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

  const body = (await request.json().catch(() => ({}))) as {
    idempotencyKey?: string;
  };
  const idempotencyKey =
    request.headers.get("idempotency-key") ?? body.idempotencyKey;

  const { id } = await params;
  const result = await completeSwap(supabase, id, user.id, idempotencyKey);

  if (!result) {
    return NextResponse.json({ error: "Could not complete swap" }, { status: 400 });
  }

  return NextResponse.json(result);
}
