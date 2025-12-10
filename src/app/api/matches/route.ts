// src/app/api/matches/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { MatchPreview, ChatMessage } from "@/features/chat/types";

type ApiResponse =
  | { ok: true; matches: MatchPreview[] }
  | { ok: false; error: string };

export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const supabase = createServerClient();

    // 1. Aflăm userul logat
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

    // 2. Luăm lista de match-uri
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
      return NextResponse.json({ ok: true, matches: [] });
    }

    // 3. Pentru fiecare match: ultimul mesaj + unreadCount
    const results: MatchPreview[] = [];

    for (const m of matches) {
      // --- ultimul mesaj ---
      const { data: lastMsg, error: lastErr } = await supabase
        .from("messages")
        .select("*")
        .eq("match_id", m.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (lastErr) {
        console.error("[MATCH_LAST_MESSAGE_ERROR]", lastErr);
      }

      // --- unread count ---
      const { count: unreadCount, error: unreadErr } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("match_id", m.id)
        .neq("sender_id", userId)
        .eq("is_read", false);

      if (unreadErr) {
        console.error("[MATCH_UNREAD_COUNT_ERROR]", unreadErr);
      }

      results.push({
        id: m.id,
        userAId: m.userAId,
        userBId: m.userBId,
        userAItemId: m.userAItemId,
        userBItemId: m.userBItemId,
        status: m.status,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,

        otherUserName: m.otherUserName,
        otherUserAvatar: m.otherUserAvatar,

        lastMessage: lastMsg?.[0] ?? null,
        unreadCount: unreadCount ?? 0,
      });
    }

    return NextResponse.json({ ok: true, matches: results });
  } catch (err) {
    console.error("[MATCHES_UNEXPECTED_ERROR]", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}