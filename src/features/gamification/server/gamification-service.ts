// src/features/gamification/server/gamification-service.ts

import { createServerClient } from "@/lib/supabase/server";
import {
  UserRank,
  UserRankState,
  UserStats,
  RANK_THRESHOLDS,
  GamificationEvent,
  GAMIFICATION_POINTS,
} from "../types";

/**
 * Calculează rangul pe baza punctelor.
 */
export function computeRank(points: number): UserRank {
  if (points >= RANK_THRESHOLDS.platinum) return "platinum";
  if (points >= RANK_THRESHOLDS.gold) return "gold";
  if (points >= RANK_THRESHOLDS.silver) return "silver";
  return "bronze";
}

/**
 * Service central pentru gamificare.
 * MVP: logică simplă, clară, fără side-effects ascunse.
 */
export const gamificationService = {
  /**
   * Asigură existența rândului de stats pentru user.
   * Se poate apela defensiv din orice endpoint.
   */
  async ensureUserStats(userId: string): Promise<UserStats> {
    const supabase = createServerClient();

    const { data: existing } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      return {
        userId: existing.user_id,
        points: existing.points,
        swapsCount: existing.swaps_count,
        wishlistCount: existing.wishlist_count,
        matchesCount: existing.matches_count,
        trustScore: existing.trust_score,
        createdAt: existing.created_at,
        updatedAt: existing.updated_at,
      };
    }

    const { data, error } = await supabase
      .from("user_stats")
      .insert({
        user_id: userId,
        points: 0,
        swaps_count: 0,
        wishlist_count: 0,
        matches_count: 0,
        trust_score: 0,
      })
      .select("*")
      .single();

    if (error || !data) {
      console.error("[GAMIFICATION_ENSURE_STATS_ERROR]", error);
      throw new Error("Nu s-a putut inițializa user_stats.");
    }

    return {
      userId: data.user_id,
      points: data.points,
      swapsCount: data.swaps_count,
      wishlistCount: data.wishlist_count,
      matchesCount: data.matches_count,
      trustScore: data.trust_score,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  /**
   * Aplică un eveniment de gamificare (adaugă puncte + recalcul rang).
   * Nu trimite notificări (asta e alt modul).
   */
  async applyEvent(
    userId: string,
    event: GamificationEvent,
  ): Promise<UserRankState> {
    const supabase = createServerClient();
    const delta = GAMIFICATION_POINTS[event] ?? 0;

    // 1) ne asigurăm că există stats
    const stats = await this.ensureUserStats(userId);

    const newPoints = stats.points + delta;
    const newRank = computeRank(newPoints);

    // 2) update stats
    const { error: updErr } = await supabase
      .from("user_stats")
      .update({
        points: newPoints,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updErr) {
      console.error("[GAMIFICATION_UPDATE_STATS_ERROR]", updErr);
      throw new Error("Nu s-au putut actualiza punctele.");
    }

    // 3) update rank (stocat separat pentru performanță)
    const { data: rankRow, error: rankErr } = await supabase
      .from("user_ranks")
      .upsert(
        {
          user_id: userId,
          rank: newRank,
          points: newPoints,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      )
      .select("*")
      .single();

    if (rankErr || !rankRow) {
      console.error("[GAMIFICATION_UPDATE_RANK_ERROR]", rankErr);
      throw new Error("Nu s-a putut actualiza rangul.");
    }

    return {
      userId,
      rank: rankRow.rank,
      points: rankRow.points,
      createdAt: rankRow.created_at,
      updatedAt: rankRow.updated_at,
    };
  },
};