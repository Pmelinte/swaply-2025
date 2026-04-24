"use client";

/**
 * Supabase Realtime helpers for the structured chat page.
 * Manages per-conversation channels with message + typing subscriptions.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Message } from "@/types/chat";

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

// ─────────────────────────────────────────────────────────────
// React hook: useRealtimeMessages
// ─────────────────────────────────────────────────────────────

interface UseRealtimeMessagesResult {
  messages: Message[];
  isConnected: boolean;
  addOptimistic: (msg: Message) => void;
  replaceOptimistic: (tempId: string, real: Message) => void;
  removeOptimistic: (tempId: string) => void;
}

/**
 * React hook that subscribes to Supabase Realtime for a given conversation.
 * Loads existing messages, subscribes to INSERT events, and exposes helpers
 * for optimistic local updates before server confirmation.
 */
export function useRealtimeMessages(conversationId: string | null | undefined): UseRealtimeMessagesResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const mapRow = useCallback((row: Record<string, unknown>): Message => ({
    id: String(row.id ?? ""),
    conversation_id: String(row.conversation_id ?? row.struct_conv_id ?? ""),
    user_id: String(row.user_id ?? row.sender_id ?? ""),
    content: (row.content as string) ?? "",
    message_type: ((row.message_type as Message["message_type"]) ?? "text"),
    media_url: (row.media_url as string | undefined) ?? undefined,
    media_type: (row.media_type as string | undefined) ?? undefined,
    translation_cache: (row.translation_cache as Record<string, string>) ?? {},
    moderation_status: (row.moderation_status as string) ?? "approved",
    read_by: (row.read_by as string[]) ?? [],
    created_at: (row.created_at as string) ?? new Date().toISOString(),
  }), []);

  useEffect(() => {
    if (!conversationId) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let cancelled = false;

    async function load() {
      const { data } = await supabase!
        .from("messages")
        .select("*")
        .or(`conversation_id.eq.${conversationId},struct_conv_id.eq.${conversationId}`)
        .order("created_at", { ascending: true })
        .limit(200);

      if (!cancelled && data) {
        setMessages(data.map((row) => mapRow(row as Record<string, unknown>)));
      }
    }

    void load();

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = mapRow(payload.new as Record<string, unknown>);
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        },
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    channelRef.current = channel;

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [conversationId, mapRow]);

  const addOptimistic = useCallback((msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const replaceOptimistic = useCallback((tempId: string, real: Message) => {
    setMessages((prev) => prev.map((m) => (m.id === tempId ? real : m)));
  }, []);

  const removeOptimistic = useCallback((tempId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== tempId));
  }, []);

  return { messages, isConnected, addOptimistic, replaceOptimistic, removeOptimistic };
}
