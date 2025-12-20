// src/app/api/matches/[id]/read/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * Marchează mesajele ca "citite" pentru userul curent.
 *
 * POST /api/matches/:id/read
 */
export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const matchId = context.params.id;

    if (!matchId) {
      return NextResponse.json(
        { ok: false, error: "missing_match_id" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // 1. Luăm user-ul
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

    // 2. Marcăm mesajele ca citite (doar cele primite, nu și trimise)
    const { error: updateErr } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("match_id", matchId)
      .neq("sender_id", userId);

    if (updateErr) {
      console.error("[MARK_READ_ERROR]", updateErr);
      return NextResponse.json(
        { ok: false, error: "db_error_mark_read" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[MARK_READ_UNEXPECTED_ERROR]", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}