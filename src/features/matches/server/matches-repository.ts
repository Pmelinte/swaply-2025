
// src/features/matches/server/matches-repository.ts

import { createServerClient } from "@/lib/supabase/server";
import type { MatchPreview, ChatMessage } from "@/features/chat/types";

/**
 * Map DB row → MatchPreview (fără mesaje)
 */
const mapDbMatch = (row: any): MatchPreview => {
  return {
    id: row.id,
    userAId: row.user_a_id,
    userBId: row.user_b_id,
    userAItemId: row.user_a_item_id,
    userBItemId: row.user_b_item_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // acestea se vor completa separat
    otherUserName: undefined,
    otherUserAvatar: undefined,
    lastMessage: null,
  };
};

export const matchesRepository = {
  /**
   * Returnează toate match-urile unui user + ultimul mesaj din fiecare.
   */
  async listUserMatches(userId: string): Promise<MatchPreview[]> {
    const supabase = createServerClient();

    const { data: matchRows, error } = await supabase
      .from("matches")
      .select("*")
      .or(
        `user_a_id.eq.${userId},user_b_id.eq.${userId}`
      )
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("listUserMatches error:", error);
      throw new Error("Nu s-au putut încărca match-urile.");
    }

    const matches = (matchRows ?? []).map(mapDbMatch);

    // Pentru fiecare match, încărcăm ultimul mesaj
    for (const match of matches) {
      const { data: msgRows, error: msgError } = await supabase
        .from("messages")
        .select("*")
        .eq("match_id", match.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!msgError && msgRows && msgRows.length > 0) {
        match.lastMessage = {
          id: msgRows[0].id,
          matchId: msgRows[0].match_id,
          senderId: msgRows[0].sender_id,
          content: msgRows[0].content,
          createdAt: msgRows[0].created_at,
        };
      }

      // Preluăm și numele + avatarul celuilalt user
      const otherUserId =
        match.userAId === userId ? match.userBId : match.userAId;

      const { data: profileRows } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("user_id", otherUserId)
        .limit(1)
        .single();

      if (profileRows) {
        match.otherUserName = profileRows.name ?? "Utilizator";
        match.otherUserAvatar = profileRows.avatar_url ?? null;
      }
    }

    return matches;
  },

  /**
   * Returnează un match (pentru chat).
   * Include verificarea că userul are acces la acest match.
   */
  async getMatchById(matchId: string, userId: string): Promise<MatchPreview | null> {
    const supabase = createServerClient();

    const { data: matchRow, error } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (error || !matchRow) {
      console.error("getMatchById error:", error);
      return null;
    }

    // verificăm că userul chiar participă la acest match
    if (matchRow.user_a_id !== userId && matchRow.user_b_id !== userId) {
      return null;
    }

    const match = mapDbMatch(matchRow);

    // Preluăm ultimul mesaj
    const { data: msgRows } = await supabase
      .from("messages")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (msgRows && msgRows.length > 0) {
      match.lastMessage = {
        id: msgRows[0].id,
        matchId: msgRows[0].match_id,
        senderId: msgRows[0].sender_id,
        content: msgRows[0].content,
        createdAt: msgRows[0].created_at,
      };
    }

    // Profilul celuilalt user
    const otherUserId =
      match.userAId === userId ? match.userBId : match.userAId;

    const { data: profileRows } = await supabase
      .from("profiles")
      .select("name, avatar_url")
      .eq("user_id", otherUserId)
      .single();

    if (profileRows) {
      match.otherUserName = profileRows.name ?? "Utilizator";
      match.otherUserAvatar = profileRows.avatar_url ?? null;
    }

    return match;
  },

  /**
   * Setează statusul match-ului.
   */
  async updateMatchStatus(
    matchId: string,
    status: "pending" | "active" | "closed",
  ): Promise<void> {
    const supabase = createServerClient();

    const { error } = await supabase
      .from("matches")
      .update({ status })
      .eq("id", matchId);

    if (error) {
      console.error("updateMatchStatus error:", error);
      throw new Error("Nu am putut actualiza statusul match-ului.");
    }
  },
};
