// src/app/api/exchange/[id]/items/route.ts

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  // încărcăm schimbul pentru a vedea cine e celălalt user
  const { data: exchangeRow } = await supabase
    .from("exchanges")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!exchangeRow) {
    return NextResponse.json({ ok: false, error: "Exchange not found" }, { status: 404 });
  }

  const otherUserId =
    exchangeRow.user_a_id === user.id
      ? exchangeRow.user_b_id
      : exchangeRow.user_a_id;

  // obiectele tale
  const { data: myItems } = await supabase
    .from("items")
    .select("*")
    .eq("owner_id", user.id)
    .eq("status", "active");

  // obiectele celuilalt
  const { data: otherItems } = await supabase
    .from("items")
    .select("*")
    .eq("owner_id", otherUserId)
    .eq("status", "active");

  return NextResponse.json({
    ok: true,
    myItems: myItems ?? [],
    otherItems: otherItems ?? [],
  });
}
