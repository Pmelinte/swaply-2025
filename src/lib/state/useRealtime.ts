/**
 * Real-time chat hook using Supabase Realtime.
 * Handles live message delivery, typing indicators, and read receipts.
 */
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Conversation, Notification } from "../types";
import { createMapMessage } from "./mappers";

interface UseRealtimeParams {
  supabase: SupabaseClient | null;
  userId: string | null;
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  setSwaps?: React.Dispatch<React.SetStateAction<import("../types").SwapIntent[]>>;
  mapSwapIntent?: (row: Record<string, unknown>) => import("../types").SwapIntent;
}

export function useRealtime({
  supabase,
  userId,
  conversations,
  setConversations,
  setNotifications,
  setSwaps,
  mapSwapIntent,
}: UseRealtimeParams) {
  const mapMessage = useMemo(() => createMapMessage(), []);
  const typingTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Subscribe to new messages in user's conversations
  useEffect(() => {
    if (!supabase || !userId) return;

    const channel = supabase
      .channel(`messages:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=like.%${userId}%`,
        },
        (payload) => {
          const newMsg = mapMessage(payload.new as Record<string, unknown>);

          // Don't add our own messages (already added optimistically)
          if (newMsg.senderId === userId) return;

          setConversations((prev) => {
            const idx = prev.findIndex((c) => c.id === newMsg.conversationId);
            if (idx === -1) return prev;

            const next = [...prev];
            const existing = next[idx];

            // Avoid duplicates
            if (existing.messages.some((m) => m.id === newMsg.id)) return prev;

            next[idx] = {
              ...existing,
              messages: [...existing.messages, newMsg],
              lastMessage: newMsg.content,
              updatedAt: newMsg.createdAt,
            };
            return next;
          });

          // Generate notification for incoming message
          setNotifications((prev) => [
            {
              id: `msg-${newMsg.id}`,
              userId,
              type: "new_message",
              message: `Mesaj nou: ${newMsg.content.slice(0, 50)}${newMsg.content.length > 50 ? "..." : ""}`,
              read: false,
              priority: "info",
              createdAt: newMsg.createdAt,
            },
            ...prev,
          ]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId, mapMessage, setConversations, setNotifications]);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!supabase || !userId) return;

    const channel = supabase
      .channel(`typing:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "typing_indicators",
        },
        (payload) => {
          const data = (payload.new || payload.old) as {
            conversation_id?: string;
            user_id?: string;
            is_typing?: boolean;
          };

          if (!data.conversation_id || data.user_id === userId) return;

          setConversations((prev) =>
            prev.map((c) =>
              c.id === data.conversation_id
                ? { ...c, participantTyping: data.is_typing ?? false }
                : c,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId, setConversations]);

  // Subscribe to notifications
  useEffect(() => {
    if (!supabase || !userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const data = payload.new as Record<string, unknown>;
          setNotifications((prev) => [
            {
              id: String(data.id ?? ""),
              userId,
              type: String(data.type ?? "info"),
              message: String(data.message ?? ""),
              read: false,
              priority: (data.priority === "warning" || data.priority === "success") ? data.priority : "info",
              createdAt: String(data.created_at ?? new Date().toISOString()),
            },
            ...prev,
          ]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId, setNotifications]);

  // Subscribe to swap intent updates (status changes)
  useEffect(() => {
    if (!supabase || !userId || !setSwaps || !mapSwapIntent) return;

    const channel = supabase
      .channel(`swaps:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "swap_intents",
        },
        (payload) => {
          const data = payload.new as Record<string, unknown>;
          const requesterId = String(data.requester_id ?? "");
          const responderId = String(data.responder_id ?? "");

          // Only process swaps the user is part of
          if (requesterId !== userId && responderId !== userId) return;

          const updated = mapSwapIntent(data);

          setSwaps((prev) => {
            const idx = prev.findIndex((s) => s.id === updated.id);
            if (idx === -1) return [updated, ...prev];
            const next = [...prev];
            next[idx] = updated;
            return next;
          });

          // Status-specific notifications
          const statusLabels: Record<string, string> = {
            accepted: "Schimbul a fost acceptat!",
            completed: "Schimbul a fost finalizat!",
            cancelled: "Schimbul a fost anulat.",
            disputed: "A fost deschisă o dispută.",
          };

          const status = String(data.status ?? "");
          const label = statusLabels[status];
          if (label) {
            setNotifications((prev) => [
              {
                id: `swap-${updated.id}-${status}`,
                userId,
                type: `swap_${status}`,
                message: label,
                read: false,
                priority: status === "completed" ? "success" : status === "disputed" ? "warning" : "info",
                createdAt: new Date().toISOString(),
              },
              ...prev,
            ]);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "swap_intents",
        },
        (payload) => {
          const data = payload.new as Record<string, unknown>;
          const responderId = String(data.responder_id ?? "");

          // Notify responder of new swap proposal
          if (responderId === userId) {
            const newSwap = mapSwapIntent(data);
            setSwaps((prev) => {
              if (prev.some((s) => s.id === newSwap.id)) return prev;
              return [newSwap, ...prev];
            });

            setNotifications((prev) => [
              {
                id: `swap-new-${newSwap.id}`,
                userId,
                type: "swap_proposal",
                message: "Ai primit o propunere de schimb nouă!",
                read: false,
                priority: "success",
                createdAt: new Date().toISOString(),
              },
              ...prev,
            ]);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId, setSwaps, mapSwapIntent, setNotifications]);

  // Send typing indicator
  const setTyping = useCallback(
    async (conversationId: string, isTyping: boolean) => {
      if (!supabase || !userId) return;

      // Debounce: clear existing timeout
      const existing = typingTimeouts.current.get(conversationId);
      if (existing) clearTimeout(existing);

      // Auto-clear typing after 3 seconds
      if (isTyping) {
        const timeout = setTimeout(async () => {
          if (!supabase || !userId) return;
          await supabase
            .from("typing_indicators")
            .upsert({
              conversation_id: conversationId,
              user_id: userId,
              is_typing: false,
              updated_at: new Date().toISOString(),
            });
        }, 3000);
        typingTimeouts.current.set(conversationId, timeout);
      }

      await supabase
        .from("typing_indicators")
        .upsert({
          conversation_id: conversationId,
          user_id: userId,
          is_typing: isTyping,
          updated_at: new Date().toISOString(),
        });
    },
    [supabase, userId],
  );

  // Mark messages as read
  const markMessagesRead = useCallback(
    async (conversationId: string) => {
      if (!supabase || !userId) return;

      const conversation = conversations.find((c) => c.id === conversationId);
      if (!conversation) return;

      const unreadMsgIds = conversation.messages
        .filter((m) => m.senderId !== userId && !(m.readBy ?? []).includes(userId))
        .map((m) => m.id);

      if (unreadMsgIds.length === 0) return;

      // Update read_by array for each unread message
      for (const msgId of unreadMsgIds) {
        await supabase.rpc("append_read_by", {
          msg_id: msgId,
          reader_id: userId,
        }).then(() => {
          // Also update local state
          setConversations((prev) =>
            prev.map((c) =>
              c.id === conversationId
                ? {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === msgId
                        ? { ...m, readBy: [...(m.readBy ?? []), userId] }
                        : m,
                    ),
                  }
                : c,
            ),
          );
        });
      }
    },
    [supabase, userId, conversations, setConversations],
  );

  return { setTyping, markMessagesRead };
}
