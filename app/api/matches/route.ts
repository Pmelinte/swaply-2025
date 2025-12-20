// src/app/api/matches/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { MatchPreview } from "@/features/chat/types";

type ApiResponse =
  | { ok: true; matches: MatchPreview[] }
  | { ok: false; error: string };

export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const supabase = createServerClient();

    // 1) User autentificat
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

    // 2) Match-urile userului
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

    // 3) Calculăm interlocutorii (otherUserIds) pentru toate match-urile
    const otherUserIds = Array.from(
      new Set(
        matches
          .map((m: any) => (m.userAId === userId ? m.userBId : m.userAId))
          .filter(Boolean)
      )
    );

    // 4) Luăm profile-urile într-o singură query
    //    Ne bazăm pe coloanele standard din profiles: user_id, name, avatar_url
    const profilesByUserId = new Map<string, { name: string | null; avatar_url: string | null }>();

    if (otherUserIds.length > 0) {
      const { data: profiles, error: profErr } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url")
        .in("user_id", otherUserIds);

      if (profErr) {
        console.error("[MATCHES_PROFILES_FETCH_ERROR]", profErr);
      } else {
        for (const p of profiles ?? []) {
          profilesByUserId.set(p.user_id, {
            name: p.name ?? null,
            avatar_url: p.avatar_url ?? null,
          });
        }
      }
    }

    // 5) Pentru fiecare match: ultimul mesaj + unreadCount + profil interlocutor
    const results: MatchPreview[] = [];

    for (const m of matches as any[]) {
      const matchId = m.id as string;
      const otherUserId = m.userAId === userId ? m.userBId : m.userAId;

      const otherProfile = otherUserId
        ? profilesByUserId.get(otherUserId) ?? null
        : null;

      // --- ultimul mesaj ---
      const { data: lastMsgRows, error: lastErr } = await supabase
        .from("messages")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (lastErr) {
        console.error("[MATCH_LAST_MESSAGE_ERROR]", lastErr);
      }

      const lastMessage = lastMsgRows?.[0] ?? null;

      // --- unreadCount ---
      const { count: unreadCount, error: unreadErr } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("match_id", matchId)
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

        otherUserName: otherProfile?.name ?? "Utilizator Swaply",
        otherUserAvatar: otherProfile?.avatar_url ?? null,

        lastMessage,
        unreadCount: unreadCount ?? 0,
      } as any);
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