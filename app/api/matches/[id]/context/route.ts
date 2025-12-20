// src/app/api/matches/[id]/context/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const matchId = context.params.id;
    const supabase = createServerClient();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
    }

    const userId = user.id;

    const { data: match, error: matchErr } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .maybeSingle();

    if (matchErr || !match) {
      return NextResponse.json({ ok: false, error: "match_not_found" }, { status: 404 });
    }

    if (match.userAId !== userId && match.userBId !== userId) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const myItemId = match.userAId === userId ? match.userAItemId : match.userBItemId;
    const otherItemId = match.userAId === userId ? match.userBItemId : match.userAItemId;

    const { data: items } = await supabase
      .from("items")
      .select("id, title, images")
      .in("id", [myItemId, otherItemId].filter(Boolean));

    const myItem = items?.find((i) => i.id === myItemId) ?? null;
    const otherItem = items?.find((i) => i.id === otherItemId) ?? null;

    return NextResponse.json({
      ok: true,
      status: match.status,
      myItem,
      otherItem,
    });
  } catch (err) {
    console.error("[MATCH_CONTEXT_ERROR]", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}