// src/features/matches/server/matches-repository.ts

import { createServerClient } from "@/lib/supabase/server";
import { getUserRatingSummaryAction } from "@/features/reviews/server/reviews-actions";

export const matchRepository = {
  /**
   * Returnează match-urile unui utilizator,
   * sortate în funcție de ratingul celuilalt user.
   */
  async listMatchesForUser(userId: string) {
    const supabase = createServerClient();

    // obținem match-urile brute
    const { data: rows, error } = await supabase
      .from("matches")
      .select(
        `
        id,
        user_a_id,
        user_b_id,
        users:other_user (
          id,
          name,
          avatar_url
        )
      `
      )
      .eq("user_a_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("listMatchesForUser error", error);
      return [];
    }

    // transformăm fiecare match într-o structură completă
    const matches = [];
    for (const m of rows ?? []) {
      const other = m.users;

      // luăm rating summary pentru fiecare utilizator
      const rating = await getUserRatingSummaryAction(other.id);

      matches.push({
        id: m.id,
        otherUser: {
          id: other.id,
          name: other.name,
          avatar_url: other.avatar_url,
          rating: {
            average: rating.averageStars,
            total: rating.totalReviews,
          },
        },
      });
    }

    // SORTARE după rating:
    // 1. rating mediu descrescător
    // 2. la egalitate — după numărul de review-uri
    matches.sort((a, b) => {
      if (b.otherUser.rating.average !== a.otherUser.rating.average) {
        return b.otherUser.rating.average - a.otherUser.rating.average;
      }
      return b.otherUser.rating.total - a.otherUser.rating.total;
    });

    return matches;
  },
};
