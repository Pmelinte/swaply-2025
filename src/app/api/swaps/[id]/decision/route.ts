import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { decideSwap, type SwapDecision } from "@/lib/swaps/swapActions";

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
    decision?: SwapDecision;
    idempotencyKey?: string;
  };
  if (body.decision !== "accepted" && body.decision !== "rejected") {
    return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  }

  const { id } = await params;
  const idempotencyKey =
    request.headers.get("idempotency-key") ?? body.idempotencyKey;
  const result = await decideSwap(
    supabase,
    id,
    user.id,
    body.decision,
    idempotencyKey,
  );

  if (!result) {
    return NextResponse.json({ error: "Could not update swap" }, { status: 400 });
  }

  return NextResponse.json(result);
}
