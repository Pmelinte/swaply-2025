
// src/features/chat/server/chat-repository.ts

import { createServerClient } from "@/lib/supabase/server";
import type { ChatMessage, ChatThread, CreateMessageInput } from "../types";

/**
 * Transformă un row din DB într-un ChatMessage
 */
const mapDbMessage = (row: any): ChatMessage => {
  return {
    id: row.id,
    matchId: row.match_id,
    senderId: row.sender_id,
    content: row.content,
    createdAt: row.created_at,
  };
};

export const chatRepository = {
  /**
   * Returnează toate mesajele dintr-un match.
   * Userul trebuie să participe în match (verificare basic în actions).
   */
  async getThread(matchId: string): Promise<ChatThread> {
    const supabase = createServerClient();

    const { data: rows, error } = await supabase
      .from("messages")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("getThread error:", error);
      throw new Error("Nu s-a putut încărca conversația.");
    }

    const messages = (rows ?? []).map(mapDbMessage);

    return {
      matchId,
      messages,
    };
  },

  /**
   * Creează un mesaj nou într-un match.
   */
  async createMessage(input: CreateMessageInput, senderId: string): Promise<ChatMessage> {
    const supabase = createServerClient();

    const payload = {
      match_id: input.matchId,
      sender_id: senderId,
      content: input.content,
    };

    const { data, error } = await supabase
      .from("messages")
      .insert(payload)
      .select("*")
      .single();

    if (error || !data) {
      console.error("createMessage error:", error);
      throw new Error("Nu s-a putut trimite mesajul.");
    }

    return mapDbMessage(data);
  },

  /**
   * Returnează ultimul mesaj dintr-un match.
   */
  async getLastMessage(matchId: string): Promise<ChatMessage | null> {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("getLastMessage error:", error);
      return null;
    }

    if (!data || data.length === 0) return null;

    return mapDbMessage(data[0]);
  },
};
