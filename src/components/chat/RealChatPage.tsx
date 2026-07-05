"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppState } from "@/lib/state";
import { getSupabaseClient } from "@/lib/supabase/client";
import { ExchangeLogisticsPanel } from "@/components/exchange/ExchangeLogisticsPanel";
import { SwapFeedbackPanel } from "@/components/feedback/SwapFeedbackPanel";
import {
  fetchConversationMessages,
  fetchUserConversations,
  sendConversationMessage,
  type ConversationRow,
  type MessageRow,
} from "@/lib/chat/chatQueries";

interface Props {
  conversationId?: string | null;
}

function formatTime(value: string | null | undefined): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("ro-RO", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

export function RealChatPage({ conversationId }: Props) {
  const { user } = useAppState();
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(conversationId ?? null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [decisionStatus, setDecisionStatus] = useState<string | null>(null);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeId) ?? null,
    [conversations, activeId],
  );

  const visibleStatus = decisionStatus ?? activeConversation?.status ?? "active";

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchUserConversations(supabase, user.id).then((rows) => {
      if (cancelled) return;
      setConversations(rows);
      if (!activeId && rows[0]) setActiveId(rows[0].id);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user, activeId]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !activeId) return;

    let cancelled = false;
    fetchConversationMessages(supabase, activeId).then((rows) => {
      if (!cancelled) setMessages(rows);
    });

    const channel = supabase
      .channel(`real-chat:${activeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeId}`,
        },
        (payload) => {
          const next = payload.new as MessageRow;
          setMessages((prev) => (prev.some((message) => message.id === next.id) ? prev : [...prev, next]));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [activeId]);

  async function handleSend() {
    const supabase = getSupabaseClient();
    if (!supabase || !user || !activeConversation || draft.trim().length === 0 || sending) return;

    setSending(true);
    const sent = await sendConversationMessage(supabase, {
      conversation: activeConversation,
      senderId: user.id,
      content: draft,
    });

    if (sent) {
      setMessages((prev) => (prev.some((message) => message.id === sent.id) ? prev : [...prev, sent]));
      setDraft("");
    }
    setSending(false);
  }

  async function decide(decision: "accepted" | "rejected") {
    if (!activeConversation?.swap_id || deciding) return;

    setDeciding(true);
    const response = await fetch(`/api/swaps/${activeConversation.swap_id}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });

    if (response.ok) {
      const result = (await response.json()) as { status: string };
      setDecisionStatus(result.status);
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === activeConversation.id
            ? { ...conversation, status: result.status, updated_at: new Date().toISOString() }
            : conversation,
        ),
      );
    }
    setDeciding(false);
  }

  async function completeActiveSwap() {
    if (!activeConversation?.swap_id || completing) return;

    setCompleting(true);
    const response = await fetch(`/api/swaps/${activeConversation.swap_id}/complete`, {
      method: "POST",
    });

    if (response.ok) {
      const result = (await response.json()) as { status: string };
      setDecisionStatus(result.status);
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === activeConversation.id
            ? { ...conversation, status: result.status, updated_at: new Date().toISOString() }
            : conversation,
        ),
      );
    }
    setCompleting(false);
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        Please sign in to see real Swaply conversations.
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-4 px-4 pb-24 pt-4 md:grid-cols-[320px_1fr]">
      <aside className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Conversations</h1>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Real conversations created from accepted matches.
        </p>

        <div className="mt-4 space-y-2">
          {loading ? (
            <p className="text-sm text-zinc-500">Loading...</p>
          ) : conversations.length === 0 ? (
            <p className="text-sm text-zinc-500">No real conversations yet.</p>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => setActiveId(conversation.id)}
                className={`w-full rounded-xl border px-3 py-3 text-left text-sm transition ${
                  conversation.id === activeId
                    ? "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100"
                    : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
                }`}
              >
                <span className="block font-semibold">Conversation</span>
                <span className="block truncate text-xs opacity-75">{conversation.id}</span>
                <span className="mt-1 block text-xs opacity-75">{formatTime(conversation.updated_at)}</span>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="flex min-h-[70vh] flex-col rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {activeConversation ? "Swap conversation" : "Select a conversation"}
              </h2>
              {activeConversation && (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Swap: {activeConversation.swap_id ?? "not linked"} · Status: {visibleStatus}
                </p>
              )}
            </div>

            {activeConversation?.swap_id && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={deciding || visibleStatus === "completed"}
                  onClick={() => void decide("rejected")}
                  className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:text-red-300"
                >
                  Reject
                </button>
                <button
                  type="button"
                  disabled={deciding || visibleStatus === "completed"}
                  onClick={() => void decide("accepted")}
                  className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
                >
                  Accept swap
                </button>
                <button
                  type="button"
                  disabled={completing || visibleStatus === "completed"}
                  onClick={() => void completeActiveSwap()}
                  className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
                >
                  {visibleStatus === "completed" ? "Completed" : completing ? "Completing..." : "Complete swap"}
                </button>
              </div>
            )}
          </div>
        </div>

        {activeConversation?.swap_id && (
          <div className="space-y-4 border-b border-zinc-200 p-4 dark:border-zinc-800">
            <ExchangeLogisticsPanel swapId={activeConversation.swap_id} />
            <SwapFeedbackPanel swapId={activeConversation.swap_id} visible={visibleStatus === "completed"} />
          </div>
        )}

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {!activeConversation ? (
            <p className="text-sm text-zinc-500">Choose a conversation from the left.</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-zinc-500">No messages yet. Start the conversation.</p>
          ) : (
            messages.map((message) => {
              const own = message.sender_id === user.id;
              return (
                <div key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      own
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                    }`}
                  >
                    <p>{message.content}</p>
                    <p className={`mt-1 text-[10px] ${own ? "text-blue-100" : "text-zinc-500"}`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleSend();
              }}
              disabled={!activeConversation || sending}
              placeholder="Write a message..."
              className="min-w-0 flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
            <button
              type="button"
              disabled={!activeConversation || sending || draft.trim().length === 0}
              onClick={() => void handleSend()}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
            >
              Send
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
