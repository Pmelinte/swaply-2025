// src/features/matches/server/matches-repository.ts

import { createServerClient } from "@/lib/supabase/server";
import { getUserRatingSummaryAction } from "@/features/reviews/server/reviews-actions";
import type { UserRatingSummary } from "@/features/reviews/types";

type MatchRow = {
  id: any;
  created_at?: any;
  users?: { id: any; name: any; avatar_url: any }[] | null;
};

function getAverage(summary: UserRatingSummary): number {
  // Tipurile tale nu au `average`, deci îl derivăm safe.
  // (Nu facem presupuneri tari despre schema ta de reviews.)
  const s: any = summary as any;
  const avg =
    s.average ??
    s.avg ??
    s.mean ??
    s.rating ??
    s.value ??
    0;

  const n = Number(avg);
  return Number.isFinite(n) ? n : 0;
}

function getTotal(summary: UserRatingSummary): number {
  const s: any = summary as any;
  const total =
    s.total ??
    s.count ??
    s.n ??
    s.num ??
    0;

  const n = Number(total);
  return Number.isFinite(n) ? n : 0;
}

export const matchRepository = {
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

    const { data, error } = await supabase
      .from("matches")
      .select("id, created_at, users(id,name,avatar_url)")
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("listMatchesForUser error:", error);
      return [];
    }

    const rows = (data ?? []) as MatchRow[];

    const result: any[] = [];
    for (const m of rows) {
      const usersArr = Array.isArray(m.users) ? m.users : [];
      const other = usersArr[0];
      if (!other) continue;

      const rating = await getUserRatingSummaryAction(other.id);

      const average = getAverage(rating);
      const total = getTotal(rating);

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
