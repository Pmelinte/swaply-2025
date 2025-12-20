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
  const { data: swap } = await supabase
    .from("swaps")
    .select("from_user,to_user")
    .eq("id", swapId)
    .maybeSingle();

  if (!swap || (swap.from_user !== user.id && swap.to_user !== user.id)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const { data: messages, error } = await supabase
    .from("swap_messages")
    .select("*")
    .eq("swap_id", swapId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, messages: messages ?? [] });
}

export async function POST(
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
  const message = body?.message ?? body?.content;

  if (!message || typeof message !== "string") {
    return NextResponse.json({ ok: false, error: "missing_message" }, { status: 400 });
  }

  const { data: swap } = await supabase
    .from("swaps")
    .select("from_user,to_user")
    .eq("id", swapId)
    .maybeSingle();

  if (!swap || (swap.from_user !== user.id && swap.to_user !== user.id)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const { data: inserted, error } = await supabase
    .from("swap_messages")
    .insert({
      swap_id: swapId,
      sender_id: user.id,
      message,
    })
    .select("*")
    .single();

  if (error || !inserted) {
    return NextResponse.json({ ok: false, error: "send_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: inserted });
}
