// src/app/api/matches/[id]/summary/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { MatchPreview, ChatMessage } from "@/features/chat/types";

/**
 * GET /api/matches/:id/summary
 *
 * Returnează un MatchPreview pentru match-ul dat:
 * - verifică autentificarea
 * - verifică faptul că userul face parte din match
 * - încarcă profilul celuilalt user (nume + avatar)
 * - încarcă ultimul mesaj, dacă există
 */
export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
): Promise<
  NextResponse<
    | { ok: true; match: MatchPreview }
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

    // 1. Auth
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

    // 2. Luăm match-ul
    const { data: matchRow, error: matchErr } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .maybeSingle();

    if (matchErr || !matchRow) {
      return NextResponse.json(
        { ok: false, error: "match_not_found" },
        { status: 404 }
      );
    }

    // Verificăm că userul face parte din match
    if (matchRow.userAId !== userId && matchRow.userBId !== userId) {
      return NextResponse.json(
        { ok: false, error: "forbidden" },
        { status: 403 }
      );
    }

    const otherUserId =
      matchRow.userAId === userId ? matchRow.userBId : matchRow.userAId;

    // 3. Ultimul mesaj
    const { data: lastMsg, error: lastMsgErr } = await supabase
      .from("messages")
      .select("*")
      .eq("matchId", matchId)
      .order("createdAt", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastMsgErr) {
      console.error("[MATCH_SUMMARY_LAST_MSG_ERROR]", lastMsgErr);
    }

    // 4. Profilul celuilalt user
    const { data: otherProfile, error: profileErr } = await supabase
      .from("profiles")
      .select("name, avatar_url")
      .eq("user_id", otherUserId)
      .maybeSingle();

    if (profileErr) {
      console.error("[MATCH_SUMMARY_PROFILE_ERROR]", profileErr);
    }

    const preview: MatchPreview = {
      id: matchRow.id,
      userAId: matchRow.userAId,
      userBId: matchRow.userBId,
      userAItemId: matchRow.userAItemId,
      userBItemId: matchRow.userBItemId,
      status: matchRow.status,
      createdAt: matchRow.createdAt,
      updatedAt: matchRow.updatedAt,

      otherUserName: otherProfile?.name ?? "Utilizator Swaply",
      otherUserAvatar: otherProfile?.avatar_url ?? null,

      lastMessage: (lastMsg as ChatMessage) ?? null,
    };

    return NextResponse.json({ ok: true, match: preview }, { status: 200 });
  } catch (err) {
    console.error("[MATCH_SUMMARY_UNEXPECTED_ERROR]", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}