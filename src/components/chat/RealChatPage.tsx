"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
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

type VisibleTranslation = {
  target_language: string;
  translated_text: string;
  source_language: string;
  provider: string;
};

function formatTime(value: string | null | undefined): string {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

function getModerationMeta(message: MessageRow): {
  risk: number;
  action: string;
} | null {
  const moderation = message.metadata?.moderation;
  if (!moderation || typeof moderation !== "object") return null;

  return {
    risk: Number((moderation as Record<string, unknown>).risk_score ?? 0),
    action: String(
      (moderation as Record<string, unknown>).recommended_action ?? "allow",
    ),
  };
}

function getCachedVisibleTranslation(
  message: MessageRow,
  targetLanguage: string,
): VisibleTranslation | null {
  const translations = message.metadata?.translations;
  if (!translations || typeof translations !== "object") return null;
  const translation = (translations as Record<string, unknown>)[targetLanguage];
  if (!translation || typeof translation !== "object") return null;
  return translation as VisibleTranslation;
}

export function RealChatPage({ conversationId }: Props) {
  const tChat = useTranslations("chat");
  const tCommon = useTranslations("common");
  const tDesk = useTranslations("desk");
  const { user } = useAppState();
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(
    conversationId ?? null,
  );
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [visibleTranslations, setVisibleTranslations] = useState<
    Record<string, VisibleTranslation>
  >({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [activeItemTitles, setActiveItemTitles] = useState<string[]>([]);

  const activeConversation = useMemo(
    () =>
      conversations.find((conversation) => conversation.id === activeId) ??
      null,
    [conversations, activeId],
  );

  const isMatchConversation = Boolean(activeConversation?.match_id);
  const visibleStatus = activeConversation?.status ?? "active";
  const itemIdsKey = activeConversation?.item_ids.join(",") ?? "";

  useEffect(() => {
    setActiveId(conversationId ?? null);
  }, [conversationId]);

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
      setActiveId((current) => current ?? rows[0]?.id ?? null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !activeId) {
      setMessages([]);
      return;
    }

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
          setMessages((previous) =>
            previous.some((message) => message.id === next.id)
              ? previous
              : [...previous, next],
          );
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [activeId]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    const itemIds = activeConversation?.item_ids ?? [];

    if (!supabase || itemIds.length === 0) {
      setActiveItemTitles([]);
      return;
    }

    let cancelled = false;

    supabase
      .from("items")
      .select("id, title")
      .in("id", itemIds)
      .then(({ data, error }) => {
        if (cancelled) return;

        if (error) {
          console.error("RealChatPage item title lookup failed", error);
          setActiveItemTitles([]);
          return;
        }

        const titleById = new Map(
          (data ?? []).map((row) => [String(row.id), String(row.title ?? "")]),
        );
        setActiveItemTitles(
          itemIds.map((itemId) => titleById.get(itemId) ?? itemId.slice(0, 8)),
        );
      });

    return () => {
      cancelled = true;
    };
  }, [activeConversation?.id, itemIdsKey]);

  async function handleSend() {
    const supabase = getSupabaseClient();
    if (
      !supabase ||
      !user ||
      !activeConversation ||
      draft.trim().length === 0 ||
      sending
    ) {
      return;
    }

    setSending(true);
    const sent = await sendConversationMessage(supabase, {
      conversation: activeConversation,
      senderId: user.id,
      content: draft,
    });

    if (sent) {
      setMessages((previous) =>
        previous.some((message) => message.id === sent.id)
          ? previous
          : [...previous, sent],
      );
      setDraft("");
      setConversations((previous) =>
        previous.map((conversation) =>
          conversation.id === activeConversation.id
            ? { ...conversation, updated_at: sent.created_at }
            : conversation,
        ),
      );
    }

    setSending(false);
  }

  async function handleTranslate(message: MessageRow) {
    if (isMatchConversation) return;

    const cached = getCachedVisibleTranslation(message, targetLanguage);
    if (cached) {
      setVisibleTranslations((previous) => ({
        ...previous,
        [message.id]: cached,
      }));
      return;
    }

    setTranslatingId(message.id);
    const response = await fetch(`/api/messages/${message.id}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetLanguage }),
    });

    if (response.ok) {
      const payload = (await response.json()) as {
        translation: VisibleTranslation;
      };
      setVisibleTranslations((previous) => ({
        ...previous,
        [message.id]: payload.translation,
      }));
      setMessages((previous) =>
        previous.map((entry) => {
          if (entry.id !== message.id) return entry;
          const translations =
            entry.metadata?.translations &&
            typeof entry.metadata.translations === "object"
              ? (entry.metadata.translations as Record<
                  string,
                  VisibleTranslation
                >)
              : {};

          return {
            ...entry,
            metadata: {
              ...(entry.metadata ?? {}),
              detected_language: payload.translation.source_language,
              translations: {
                ...translations,
                [payload.translation.target_language]: payload.translation,
              },
            },
          };
        }),
      );
    }

    setTranslatingId(null);
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        {tChat("signInRequired")}
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-4 px-4 pb-24 pt-4 md:grid-cols-[320px_1fr]">
      <aside className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {tChat("conversations")}
        </h1>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {tChat("description")}
        </p>

        <div className="mt-4 space-y-2">
          {loading ? (
            <p className="text-sm text-zinc-500">{tCommon("loading")}</p>
          ) : conversations.length === 0 ? (
            <p className="text-sm text-zinc-500">{tChat("noConversations")}</p>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                data-testid={`conversation-select-${conversation.id}`}
                onClick={() => {
                  setActiveId(conversation.id);
                }}
                className={`w-full rounded-xl border px-3 py-3 text-left text-sm transition ${
                  conversation.id === activeId
                    ? "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100"
                    : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
                }`}
              >
                <span className="block font-semibold">
                  {conversation.match_id ? tChat("secureChat") : tChat("title")}
                </span>
                <span className="block truncate text-xs opacity-75">
                  {conversation.id}
                </span>
                <span className="mt-1 block text-xs opacity-75">
                  {formatTime(conversation.updated_at)}
                </span>
              </button>
            ))
          )}
        </div>
      </aside>

      <section
        data-testid="real-chat-workspace"
        className="flex min-h-[70vh] flex-col rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  data-testid={
                    isMatchConversation
                      ? "match-conversation-header"
                      : "swap-conversation-header"
                  }
                  className="text-base font-semibold text-zinc-900 dark:text-zinc-50"
                >
                  {activeConversation
                    ? tChat("secureChat")
                    : tChat("selectConversation")}
                </h2>
                {isMatchConversation ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
                    {tDesk("status_accepted")}
                  </span>
                ) : null}
              </div>

              {activeConversation ? (
                <>
                  <p
                    data-testid="match-conversation-items"
                    className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-200"
                  >
                    {activeItemTitles.length > 0
                      ? activeItemTitles.join(" ↔ ")
                      : activeConversation.item_ids
                          .map((itemId) => itemId.slice(0, 8))
                          .join(" ↔ ")}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {isMatchConversation
                      ? `Match: ${activeConversation.match_id}`
                      : `Swap: ${activeConversation.swap_id ?? tCommon("unknown")}`} {" "}
                    · {visibleStatus}
                  </p>
                </>
              ) : null}
            </div>

            {!isMatchConversation && activeConversation ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  {tChat("translation")}
                </span>
                <select
                  value={targetLanguage}
                  onChange={(event) => setTargetLanguage(event.target.value)}
                  className="rounded-xl border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-950"
                >
                  <option value="en">EN</option>
                  <option value="ro">RO</option>
                  <option value="fr">FR</option>
                  <option value="es">ES</option>
                  <option value="de">DE</option>
                </select>
              </div>
            ) : null}
          </div>
        </div>

        {activeConversation?.swap_id ? (
          <div className="space-y-4 border-b border-zinc-200 p-4 dark:border-zinc-800">
            <ExchangeLogisticsPanel swapId={activeConversation.swap_id} />
            <SwapFeedbackPanel
              swapId={activeConversation.swap_id}
              visible={visibleStatus === "completed"}
            />
          </div>
        ) : null}

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {!activeConversation ? (
            <p className="text-sm text-zinc-500">
              {tChat("selectConversation")}
            </p>
          ) : messages.length === 0 ? (
            <p
              data-testid="match-conversation-empty"
              className="text-sm text-zinc-500"
            >
              {tChat("noMessages")}
            </p>
          ) : (
            messages.map((message) => {
              const own = message.sender_id === user.id;
              const moderation = isMatchConversation
                ? null
                : getModerationMeta(message);
              const translation = visibleTranslations[message.id];

              return (
                <div
                  key={message.id}
                  data-testid={`conversation-message-${message.id}`}
                  className={`flex ${own ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      own
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                    }`}
                  >
                    <p
                      data-testid={`conversation-message-content-${message.id}`}
                    >
                      {message.content}
                    </p>

                    {translation ? (
                      <div className="mt-2 rounded-xl bg-white/20 p-2 text-xs">
                        <p className="font-semibold opacity-80">
                          {translation.source_language} → {" "}
                          {translation.target_language}
                        </p>
                        <p className="mt-1">{translation.translated_text}</p>
                      </div>
                    ) : null}

                    {moderation && moderation.risk >= 30 ? (
                      <div className="mt-2 rounded-lg bg-amber-500/20 px-2 py-1 text-[10px] font-semibold text-amber-100">
                        {moderation.risk}% · {moderation.action}
                      </div>
                    ) : null}

                    <div
                      className={`mt-2 flex items-center justify-between gap-2 text-[10px] ${
                        own ? "text-blue-100" : "text-zinc-500"
                      }`}
                    >
                      <span>{formatTime(message.created_at)}</span>
                      {!isMatchConversation ? (
                        <button
                          type="button"
                          onClick={() => void handleTranslate(message)}
                          disabled={translatingId === message.id}
                          className="rounded-full bg-white/20 px-2 py-1 font-semibold hover:bg-white/30 disabled:opacity-60"
                        >
                          {translatingId === message.id
                            ? tCommon("loading")
                            : translation
                              ? tChat("translated")
                              : tChat("translate")}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex gap-2">
            <input
              data-testid="match-message-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleSend();
              }}
              disabled={!activeConversation || sending}
              placeholder={tChat("writeMessage")}
              className="min-w-0 flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
            <button
              type="button"
              data-testid="match-message-send"
              disabled={
                !activeConversation || sending || draft.trim().length === 0
              }
              onClick={() => void handleSend()}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
            >
              {sending ? tCommon("loading") : tCommon("send")}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
