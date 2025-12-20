// src/app/api/matches/[id]/summary/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { MatchPreview, ChatMessage } from "@/features/chat/types";

type ApiResponse =
  | { ok: true; match: MatchPreview }
  | { ok: false; error: string };

function mapDbMessage(row: any): ChatMessage {
  return {
    id: row.id,
    matchId: row.match_id,
    senderId: row.sender_id,
    content: row.content,
    createdAt: row.created_at,
  };
}

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
  context: { params: { id: string } },
): Promise<NextResponse<ApiResponse>> {
  try {
    const matchId = context.params.id;

    if (!matchId) {
      return NextResponse.json(
        { ok: false, error: "missing_match_id" },
        { status: 400 },
      );
    }

    const supabase = createServerClient();

    // 1) Auth
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json(
        { ok: false, error: "not_authenticated" },
        { status: 401 },
      );
    }

    const userId = user.id;

    // 2) Match-ul
    const { data: matchRow, error: matchErr } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .maybeSingle();

    if (matchErr || !matchRow) {
      return NextResponse.json(
        { ok: false, error: "match_not_found" },
        { status: 404 },
      );
    }

    // user trebuie să fie participant
    if (matchRow.userAId !== userId && matchRow.userBId !== userId) {
      return NextResponse.json(
        { ok: false, error: "forbidden" },
        { status: 403 },
      );
    }

    const otherUserId =
      matchRow.userAId === userId ? matchRow.userBId : matchRow.userAId;

    // 3) Ultimul mesaj (snake_case)
    const { data: lastMsgRow, error: lastMsgErr } = await supabase
      .from("messages")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastMsgErr) {
      console.error("[MATCH_SUMMARY_LAST_MSG_ERROR]", lastMsgErr);
    }

    const lastMessage = lastMsgRow ? mapDbMessage(lastMsgRow) : null;

    // 4) Profilul celuilalt user
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

      lastMessage,
    };

    return NextResponse.json({ ok: true, match: preview }, { status: 200 });
  } catch (err) {
    console.error("[MATCH_SUMMARY_UNEXPECTED_ERROR]", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 },
    );
  }
}