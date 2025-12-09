// src/app/api/matches/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { MatchPreview, ChatMessage } from "@/features/chat/types";

/**
 * Returnează lista de match-uri ale userului curent,
 * fiecare cu ultimul mesaj atașat (dacă există).
 *
 * GET /api/matches
 */
export async function GET(
  req: NextRequest
): Promise<NextResponse<{ ok: true; matches: MatchPreview[] } | { ok: false; error: string }>> {
  try {
    const supabase = createServerClient();

    // ---------------------------------------------------
    // 1. Aflăm utilizatorul authentificat
    // ---------------------------------------------------
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

    // ---------------------------------------------------
    // 2. Luăm match-urile userului
    // ---------------------------------------------------
    const { data: matches, error: matchErr } = await supabase
      .from("matches")
      .select("*")
      .or(`userAId.eq.${userId},userBId.eq.${userId}`)
      .order("updatedAt", { ascending: false });

    if (matchErr) {
      console.error("[MATCHES_FETCH_ERROR]", matchErr);
      return NextResponse.json(
        { ok: false, error: "db_error_fetch_matches" },
        { status: 500 }
      );
    }

    if (!matches || matches.length === 0) {
      return NextResponse.json({ ok: true, matches: [] }, { status: 200 });
    }

    // ---------------------------------------------------
    // 3. Luăm ultimul mesaj pentru fiecare match
    // ---------------------------------------------------
    const results: MatchPreview[] = [];

    for (const m of matches) {
      const { data: lastMsg, error: msgErr } = await supabase
        .from("messages")
        .select("*")
        .eq("matchId", m.id)
        .order("createdAt", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (msgErr) {
        console.error("[MATCH_LAST_MESSAGE_ERROR]", msgErr);
      }

      const preview: MatchPreview = {
        id: m.id,
        userAId: m.userAId,
        userBId: m.userBId,
        userAItemId: m.userAItemId,
        userBItemId: m.userBItemId,
        status: m.status,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        lastMessage: lastMsg ?? null,
      };

      results.push(preview);
    }

    return NextResponse.json({ ok: true, matches: results }, { status: 200 });
  } catch (err) {
    console.error("[MATCHES_UNEXPECTED_ERROR]", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}
