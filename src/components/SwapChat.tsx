"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";

interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface SenderInfo {
  display_name: string;
  avatar_url: string | null;
}

interface SwapChatProps {
  swapId: string;
  currentUserId: string;
  /** The other party's user ID (for RLS-filtered realtime) */
  partnerId: string;
}

export function SwapChat({ swapId, currentUserId, partnerId }: SwapChatProps) {
  const t = useTranslations("change");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, SenderInfo>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  const conversationId = `swap:${swapId}`;

  // ── Load profiles for both participants ──
  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) return;

    sb.from("profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", [currentUserId, partnerId])
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, SenderInfo> = {};
        for (const p of data) {
          map[p.user_id] = {
            display_name: p.display_name || "User",
            avatar_url: p.avatar_url,
          };
        }
        setProfiles(map);
      });
  }, [currentUserId, partnerId]);

  // ── Load existing messages ──
  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) return;

    sb.from("messages")
      .select("id, sender_id, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(200)
      .then(({ data }) => {
        if (data) setMessages(data);
      });
  }, [conversationId]);

  // ── Subscribe to new messages via Supabase Realtime ──
  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) return;

    const channel = sb
      .channel(`swap-chat:${swapId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = payload.new as ChatMessage;
          // Skip if already added optimistically
          setMessages((prev) =>
            prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
          );
        },
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [swapId, conversationId]);

  // ── Auto-scroll on new messages ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // ── Send message ──
  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setInput("");

    // Optimistic insert
    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      sender_id: currentUserId,
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    const sb = getSupabaseClient();
    if (!sb) {
      setSending(false);
      return;
    }

    const { data, error } = await sb
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: text,
      })
      .select("id, sender_id, content, created_at")
      .single();

    if (error) {
      // Rollback optimistic insert
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } else if (data) {
      // Replace temp with real
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? data : m)),
      );
    }

    setSending(false);
  }, [input, sending, currentUserId, conversationId]);

  const getInitial = (userId: string) => {
    const name = profiles[userId]?.display_name || "?";
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {t("swapChat") ?? "Swap Chat"}
        </h3>
      </div>

      {/* Messages */}
      <div className="flex max-h-80 min-h-[12rem] flex-col gap-2 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="py-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
            {t("chatEmpty") ?? "No messages yet. Start the conversation!"}
          </p>
        )}

        {messages.map((msg) => {
          const isOwn = msg.sender_id === currentUserId;
          const avatar = profiles[msg.sender_id]?.avatar_url;

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
            >
              {/* Avatar */}
              {avatar ? (
                <img
                  src={avatar}
                  alt=""
                  className="h-6 w-6 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  {getInitial(msg.sender_id)}
                </div>
              )}

              {/* Bubble */}
              <div
                className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                  isOwn
                    ? "rounded-br-md bg-blue-600 text-white"
                    : "rounded-bl-md bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                }`}
              >
                <p className="break-words">{msg.content}</p>
                <p
                  className={`mt-0.5 text-[10px] ${
                    isOwn
                      ? "text-blue-200"
                      : "text-zinc-400 dark:text-zinc-500"
                  }`}
                >
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-100 px-3 py-2 dark:border-zinc-800">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("chatPlaceholder") ?? "Type a message..."}
            maxLength={2000}
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
