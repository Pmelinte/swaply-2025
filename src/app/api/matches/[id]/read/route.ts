// src/app/api/matches/[id]/read/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * POST /api/matches/:id/read
 * Marchează toate mesajele celuilalt user ca "citite".
 */
export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const matchId = context.params.id;

    if (!matchId) {
      return NextResponse.json(
        { ok: false, error: "missing_match_id" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // ----------------------------
    // 1. Auth
    // ----------------------------
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json(
        { ok: false, error: "not_authenticated" },
        { status: 401 }
      );
    }

    const userId = user.id;

    // ----------------------------
    // 2. Confirm că user aparține match-ului
    // ----------------------------
    const { data: match, error: matchErr } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .maybeSingle();

    if (matchErr || !match) {
      return NextResponse.json(
        { ok: false, error: "match_not_found" },
        { status: 404 }
      );
    }

    if (match.userAId !== userId && match.userBId !== userId) {
      return NextResponse.json(
        { ok: false, error: "forbidden" },
        { status: 403 }
      );
    }

    // ----------------------------
    // 3. Marchează mesajele
    // ----------------------------
    const { error: updateErr } = await supabase
      .from("messages")
      .update({ isRead: true })
      .eq("matchId", matchId)
      .neq("senderId", userId);

    if (updateErr) {
      console.error("[MESSAGE_READ_UPDATE_ERROR]", updateErr);
      return NextResponse.json(
        { ok: false, error: "db_error_update_read" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[MESSAGE_READ_UNEXPECTED_ERROR]", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}
