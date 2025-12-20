import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  context: { params: { id: string } },
) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const swapId = context.params.id;
  const { data: swap, error } = await supabase
    .from("swaps")
    .select("*")
    .eq("id", swapId)
    .maybeSingle();

  if (error || !swap) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  if (swap.from_user !== user.id && swap.to_user !== user.id) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const itemIds = [swap.from_item, swap.to_item].filter(Boolean);
  const { data: items } = await supabase
    .from("items")
    .select("id,title")
    .in("id", itemIds);
  const itemsById = new Map((items ?? []).map((it: any) => [it.id, it]));

  return NextResponse.json({
    ok: true,
    swap: {
      ...swap,
      from_item: itemsById.get(swap.from_item)?.title ?? swap.from_item,
      to_item: itemsById.get(swap.to_item)?.title ?? swap.to_item,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } },
) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const swapId = context.params.id;
  const body = await req.json().catch(() => ({}));
  const action = body?.action as string | undefined;

  const { data: swap, error } = await supabase
    .from("swaps")
    .select("*")
    .eq("id", swapId)
    .maybeSingle();

  if (error || !swap) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  if (swap.from_user !== user.id && swap.to_user !== user.id) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  if (!action) {
    return NextResponse.json({ ok: false, error: "missing_action" }, { status: 400 });
  }

  const isReceiver = swap.to_user === user.id;

  if (action === "accept") {
    if (!isReceiver) {
      return NextResponse.json({ ok: false, error: "only_receiver_can_accept" }, { status: 403 });
    }
    const { error: updateErr } = await supabase
      .from("swaps")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", swapId);

    if (updateErr) {
      return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, status: "accepted" });
  }

  if (action === "reject") {
    if (!isReceiver) {
      return NextResponse.json({ ok: false, error: "only_receiver_can_reject" }, { status: 403 });
    }
    const { error: updateErr } = await supabase
      .from("swaps")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", swapId);

    if (updateErr) {
      return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, status: "rejected" });
  }

  if (action === "cancel") {
    const { error: updateErr } = await supabase
      .from("swaps")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", swapId);

    if (updateErr) {
      return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, status: "cancelled" });
  }

  if (action === "confirm") {
    const { error: msgErr } = await supabase.from("swap_messages").insert({
      swap_id: swapId,
      sender_id: user.id,
      message: "[swap_confirm]",
    });

    if (msgErr) {
      return NextResponse.json({ ok: false, error: "confirm_failed" }, { status: 500 });
    }

    const { data: confirmations } = await supabase
      .from("swap_messages")
      .select("sender_id")
      .eq("swap_id", swapId)
      .eq("message", "[swap_confirm]");

    const uniqueConfirmers = new Set((confirmations ?? []).map((c: any) => c.sender_id));

    if (uniqueConfirmers.has(swap.from_user) && uniqueConfirmers.has(swap.to_user)) {
      await supabase
        .from("swaps")
        .update({ status: "complete", updated_at: new Date().toISOString() })
        .eq("id", swapId);

      await supabase
        .from("items")
        .update({ is_active: false })
        .in("id", [swap.from_item, swap.to_item]);

      const updateTrust = async (userId: string) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("trust_score")
          .eq("user_id", userId)
          .maybeSingle();
        const nextScore = (profile?.trust_score ?? 50) + 1;
        await supabase.from("profiles").update({ trust_score: nextScore }).eq("user_id", userId);
      };

      await updateTrust(swap.from_user);
      await updateTrust(swap.to_user);

      return NextResponse.json({ ok: true, status: "complete" });
    }

    return NextResponse.json({ ok: true, status: "pending_confirmation" });
  }

  return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
}
