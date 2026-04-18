"use client";

/**
 * Supabase Realtime helpers for the structured chat page.
 * Manages per-conversation channels with message + typing subscriptions.
 */

import type { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";

export interface RealtimeMessage {
  id: string;
  struct_conv_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  media_url?: string | null;
  media_type?: string | null;
  created_at: string;
  read_by?: string[];
}

type MessageHandler = (msg: RealtimeMessage) => void;
type TypingHandler = (userId: string, isTyping: boolean) => void;

/**
 * Subscribe to new messages in a structured conversation.
 * Returns an unsubscribe function.
 */
export function subscribeToConversation(
  supabase: SupabaseClient,
  conversationId: string,
  onMessage: MessageHandler,
  onTyping?: TypingHandler,
): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`conv:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `struct_conv_id=eq.${conversationId}`,
      },
      (payload) => {
        onMessage(payload.new as RealtimeMessage);
      },
    );

  if (onTyping) {
    channel
      .on("broadcast", { event: "typing" }, (payload) => {
        onTyping(payload.payload?.userId as string, payload.payload?.isTyping as boolean);
      });
  }

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Broadcast a typing event to the conversation channel.
 */
export function broadcastTyping(
  supabase: SupabaseClient,
  conversationId: string,
  userId: string,
  isTyping: boolean,
): void {
  supabase
    .channel(`conv:${conversationId}`)
    .send({
      type: "broadcast",
      event: "typing",
      payload: { userId, isTyping },
    })
    .catch(() => {/* non-critical */});
}

/**
 * Mark messages as read for a user (appends userId to read_by array).
 */
export async function markConversationRead(
  supabase: SupabaseClient,
  conversationId: string,
  userId: string,
): Promise<void> {
  await supabase.rpc("append_read_by", {
    p_conversation_id: conversationId,
    p_user_id: userId,
  });
}
