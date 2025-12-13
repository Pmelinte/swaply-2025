// src/app/api/gamification/me/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { UserRankState, UserStats } from "@/features/gamification/types";

type ApiResponse =
  | {
      ok: true;
      rank: UserRankState;
      stats: UserStats;
    }
  | { ok: false; error: string };

/**
 * GET /api/gamification/me
 *
 * Returnează:
 *  - rangul curent
 *  - punctele
 *  - statistici de bază (swaps, wishlist, matches, trust)
 *
 * Read-only, fără side effects.
 */
export async function GET(
  req: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    const supabase = createServerClient();

    // 1) auth
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

    // 2) rank
    const { data: rankRow, error: rankErr } = await supabase
      .from("user_ranks")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (rankErr) {
      console.error("[GAMIFICATION_RANK_FETCH_ERROR]", rankErr);
      return NextResponse.json(
        { ok: false, error: "db_error_fetch_rank" },
        { status: 500 },
      );
    }

    // fallback defensiv
    const rank: UserRankState = rankRow
      ? {
          userId,
          rank: rankRow.rank,
          points: rankRow.points,
          createdAt: rankRow.created_at,
          updatedAt: rankRow.updated_at,
        }
      : {
          userId,
          rank: "bronze",
          points: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

    // 3) stats
    const { data: statsRow, error: statsErr } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (statsErr) {
      console.error("[GAMIFICATION_STATS_FETCH_ERROR]", statsErr);
      return NextResponse.json(
        { ok: false, error: "db_error_fetch_stats" },
        { status: 500 },
      );
    }

    const stats: UserStats = statsRow
      ? {
          userId,
          points: statsRow.points,
          swapsCount: statsRow.swaps_count,
          wishlistCount: statsRow.wishlist_count,
          matchesCount: statsRow.matches_count,
          trustScore: statsRow.trust_score,
          createdAt: statsRow.created_at,
          updatedAt: statsRow.updated_at,
        }
      : {
          userId,
          points: 0,
          swapsCount: 0,
          wishlistCount: 0,
          matchesCount: 0,
          trustScore: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

    return NextResponse.json(
      {
        ok: true,
        rank,
        stats,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[GAMIFICATION_ME_UNEXPECTED]", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 },
    );
  }
}