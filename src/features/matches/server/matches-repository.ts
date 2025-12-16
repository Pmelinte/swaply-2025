// src/features/matches/server/matches-repository.ts

import { createServerClient } from "@/lib/supabase/server";
import { getUserRatingSummaryAction } from "@/features/reviews/server/reviews-actions";
import type { UserRatingSummary } from "@/features/reviews/types";

type MatchRow = {
  id: any;
  user_a_id?: any;
  user_b_id?: any;
  created_at?: any;

  // join: poate veni ca array
  users?: { id: any; name: any; avatar_url: any }[] | null;
};

export const matchRepository = {
  /**
   * Listează match-urile pentru un user + info “other user”.
   */
  async listMatchesForUser(userId: string): Promise<
    {
      id: any;
      otherUser: {
        id: any;
        name: any;
        avatar_url: any;
        rating: UserRatingSummary;
        visibilityScore: any;
      };
    }[]
  > {
    const supabase = createServerClient();

    // NOTE:
    // Nu știu exact cum ai făcut join-ul în schema ta, dar problema din log e clară:
    // `m.users` vine ca array. Îl tratăm defensiv.
    const { data, error } = await supabase
      .from("matches")
      .select("id, users(id,name,avatar_url)")
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("listMatchesForUser error:", error);
      return [];
    }

    const rows = (data ?? []) as MatchRow[];

    const result = [];
    for (const m of rows) {
      const usersArr = Array.isArray(m.users) ? m.users : [];
      const other = usersArr[0]; // ✅ FIX: e array, luăm primul (other user)

      if (!other) continue;

      const rating = await getUserRatingSummaryAction(other.id);

      const { average, total } = rating;
      const visibilityScore = total >= 5 ? average : average * 0.8;

      result.push({
        id: m.id,
        otherUser: {
          id: other.id,
          name: other.name,
          avatar_url: other.avatar_url,
          rating,
          visibilityScore,
        },
      });
    }

    return result;
  },
};
