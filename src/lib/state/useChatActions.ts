"use client";

import { useCallback } from "react";
import { nanoid } from "nanoid";
import type { ChatMessage, UserProfile } from "../types";
import { makeDmConversationId, safeBadgeTier, safeString } from "./helpers";
import type { SharedDeps } from "./shared-deps";

export function useChatActions(deps: Pick<SharedDeps, "user" | "dataSource" | "supabase" | "setLastError" | "mapMessage" | "conversations" | "setConversations">) {
  const { user, dataSource, supabase, setLastError, mapMessage, conversations, setConversations } = deps;

  const ensureConversation = useCallback(
    async (participantId: string) => {
      if (!user?.id || !participantId || participantId === user.id) return null;
      const conversationId = makeDmConversationId(user.id, participantId);
      if (conversations.some((c) => c.id === conversationId)) return conversationId;

      let participantName = `Utilizator ${participantId.slice(0, 8)}`;
      let participantBadge: UserProfile["badge"] = "free";

      if (dataSource === "supabase" && supabase) {
        const { data, error } = await supabase.from("profiles")
          .select("user_id, display_name, badge").eq("user_id", participantId).maybeSingle();
        if (error) setLastError(error.message);
        else if (data) {
          participantName = safeString(data.display_name, participantName);
          participantBadge = safeBadgeTier(data.badge, participantBadge);
        }
      }

      setConversations((prev) => [{
        id: conversationId, participantId, participantName, participantBadge,
        lastMessage: "", updatedAt: new Date().toISOString(), messages: [], translationEnabled: false,
      }, ...prev]);
      return conversationId;
    },
    [conversations, dataSource, supabase, user?.id, setLastError, setConversations],
  );

  const addMessage = useCallback(
    async (conversationId: string, content: string) => {
      if (!user?.id) return;
      setLastError(null);

      const now = new Date().toISOString();
      const optimisticMessage: ChatMessage = {
        id: nanoid(), conversationId, senderId: user.id, content, createdAt: now, attachments: [],
      };

      setConversations((prev) => prev.map((c) =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, optimisticMessage], lastMessage: content, updatedAt: now }
          : c,
      ));

      if (dataSource === "supabase" && supabase) {
        const { data, error } = await supabase.from("messages")
          .insert({ conversation_id: conversationId, sender_id: user.id,
            content, attachments: [] })
          .select("*").maybeSingle();

        if (error) {
          setLastError(error.message);
          setConversations((prev) => prev.map((c) =>
            c.id === conversationId
              ? { ...c, messages: c.messages.filter((m) => m.id !== optimisticMessage.id) }
              : c,
          ));
          return;
        }

        if (data) {
          const inserted = mapMessage(data);
          setConversations((prev) => prev.map((c) =>
            c.id === conversationId
              ? { ...c, messages: c.messages.map((m) => m.id === optimisticMessage.id ? inserted : m),
                  lastMessage: inserted.content, updatedAt: inserted.createdAt }
              : c,
          ));
        }
      }
    },
    [dataSource, mapMessage, supabase, user?.id, setLastError, setConversations],
  );

  const toggleConversationTranslation = useCallback((conversationId: string) => {
    setConversations((prev) => prev.map((c) =>
      c.id === conversationId ? { ...c, translationEnabled: !c.translationEnabled } : c,
    ));
  }, [setConversations]);

  return { ensureConversation, addMessage, toggleConversationTranslation };
}
