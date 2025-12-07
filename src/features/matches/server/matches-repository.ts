// src/features/matches/server/matches-repository.ts

import { createServerClient } from "@/lib/supabase/server";
import { getUserRatingSummaryAction } from "@/features/reviews/server/reviews-actions";

export const matchRepository = {
  /**
   * Returnează match-urile ordonate după reputație.
   * Trusted users → sus.
   * Rating slab → jos.
   */
  async listMatchesForUser(userId: string) {
    const supabase = createServerClient();

    const { data: rows, error } = await supabase
      .from("matches")
      .select(`
        id,
        user_a_id,
        user_b_id,
        users:other_user (
          id,
          name,
          avatar_url
        )
      `)
      .eq("user_a_id", userId);

    if (error) {
      console.error("listMatchesForUser error", error);
      return [];
    }

    const matches = [];

    for (const m of rows ?? []) {
      const other = m.users;

      const rating = await getUserRatingSummaryAction(other.id);

      // Calculează scorul de vizibilitate
      const { average, total } = rating;

      let score = average;

      // Boost pentru trusted
      if (average >= 4.5 && total >= 5) {
        score += 1.0; // prioritate mare
      }

      // Deboost pentru rating slab
      if (average < 3.0 && total >= 3) {
        score -= 2.0; // împins mult în jos
      }

      matches.push({
        id: m.id,
        otherUser: {
          id: other.id,
          name: other.name,
          avatar_url: other.avatar_url,
          rating,
          visibilityScore: score,
        },
      });
    }

    // Sortare descrescătoare după scor
    matches.sort((a, b) => b.otherUser.visibilityScore - a.otherUser.visibilityScore);

    return matches;
  },
};
