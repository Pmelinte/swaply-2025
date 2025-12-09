// src/app/api/matches/[id]/messages/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { ChatMessage } from "@/features/chat/types";

/**
 * Returnează toate mesajele dintr-un match.
 *
 * GET /api/matches/:id/messages
 */
export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
): Promise<
  NextResponse<
    | { ok: true; messages: ChatMessage[] }
    | { ok: false; error: string }
  >
> {
  try {
    const matchId = context.params.id;

    if (!matchId) {
      return NextResponse.json(
        { ok: false, error: "missing_match_id" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // --------------------------
    // 1. Verificăm user-ul
    // --------------------------
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

    // --------------------------
    // 2. Verificăm dacă user-ul
    //    face parte din match
    // --------------------------
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

    // --------------------------
    // 3. Luăm mesajele ordonate
    // --------------------------
    const { data: messages, error: msgErr } = await supabase
      .from("messages")
      .select("*")
      .eq("matchId", matchId)
      .order("createdAt", { ascending: true });

    if (msgErr) {
      console.error("[MATCH_MESSAGES_ERROR]", msgErr);
      return NextResponse.json(
        { ok: false, error: "db_error_fetch_messages" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, messages: messages ?? [] });
  } catch (err) {
    console.error("[MATCH_MESSAGES_UNEXPECTED_ERROR]", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}
