import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { transitionSwapStatus, type SwapTransition } from "@/lib/swaps/swapStatus";

const ALLOWED = new Set<SwapTransition>(["accepted", "rejected", "cancelled", "completed"]);

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

  const body = (await request.json().catch(() => ({}))) as { status?: string };
  const transition = body.status as SwapTransition | undefined;

  if (!transition || !ALLOWED.has(transition)) {
    return NextResponse.json({ error: "Invalid swap status" }, { status: 400 });
  }

  const { id } = await params;
  const ok = await transitionSwapStatus(supabase, {
    swapId: id,
    actorId: user.id,
    transition,
  });

  if (!ok) {
    return NextResponse.json({ error: "Could not update swap status" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, status: transition });
}
