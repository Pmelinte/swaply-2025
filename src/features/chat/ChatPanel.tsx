"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Conversation, ChatMessage } from "@/lib/types";
import { useAppState } from "@/lib/state";
import { formatDate } from "@/lib/utils";
import { Badge, Pill } from "@/components/ui";

function MessageBubble({
  msg,
  isMe,
  targetLang,
}: {
  msg: ChatMessage;
  isMe: boolean;
  targetLang: string;
}) {
  const t = useTranslations("chatPanel");
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);

  const handleTranslate = async () => {
    setTranslating(true);
    try {
      const detectLang = /[ăâîșț]/i.test(msg.content)
        ? "ro"
        : /[ñáéíóú]/i.test(msg.content)
          ? "es"
          : "en";
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: msg.content,
          from: detectLang,
          to: targetLang,
        }),
      });
      const data = await res.json();
      setTranslatedText(data.translated);
    } catch {
      setTranslatedText(t("translationError"));
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div
      className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${
        isMe
          ? "ml-auto bg-blue-50 dark:bg-blue-950/40"
          : "mr-auto bg-white dark:bg-zinc-900"
      }`}
    >
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>{isMe ? t("you") : t("partner")}</span>
        <span>{formatDate(msg.createdAt)}</span>
      </div>
      <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-100">{msg.content}</p>
      {translatedText ? (
        <p className="mt-1 rounded-lg bg-purple-50 p-2 text-xs text-purple-800 dark:bg-purple-950/30 dark:text-purple-200">
          {translatedText}
        </p>
      ) : null}
      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
        {msg.translated ? <Pill color="blue">{t("translated")}</Pill> : null}
        {msg.moderated ? <Pill color="amber">{t("moderated")}</Pill> : null}
        {msg.attachments?.map((att) => (
          <Pill key={att.id} color={att.safe ? "green" : "amber"}>
            {att.name}
          </Pill>
        ))}
        {!translatedText ? (
          <button
            type="button"
            onClick={() => void handleTranslate()}
            disabled={translating}
            className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {translating ? "..." : t("translate")}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function ChatPanel({
  conversations,
  initialConversationId,
}: {
  conversations: Conversation[];
  initialConversationId?: string;
}) {
  const t = useTranslations("chatPanel");
  const { addMessage, toggleConversationTranslation, language } = useAppState();
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [draft, setDraft] = useState("");
  const [moderationError, setModerationError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const effectiveActiveId =
    (selectedId && conversations.some((c) => c.id === selectedId) ? selectedId : undefined) ??
    (initialConversationId && conversations.some((c) => c.id === initialConversationId)
      ? initialConversationId
      : undefined) ??
    conversations[0]?.id;

  const active = conversations.find((c) => c.id === effectiveActiveId);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages.length]);

  const handleSend = async () => {
    if (!draft.trim() || !active) return;
    setSending(true);
    setModerationError(null);

    try {
      const modRes = await fetch("/api/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draft }),
      });
      const modData = await modRes.json();

      if (!modData.safe) {
        setModerationError(modData.message || t("blockedByModeration"));
        setSending(false);
        return;
      }

      await addMessage(active.id, draft);
      setDraft("");
    } catch {
      setModerationError(t("sendError"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      {/* Conversation list */}
      <div className="space-y-2 rounded-2xl border border-zinc-200 bg-white/80 p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{t("conversations")}</h3>
        {conversations.length === 0 ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t("noConversations")}
          </p>
        ) : null}
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => setSelectedId(conv.id)}
            className={`w-full rounded-xl border px-3 py-2 text-left ${
              conv.id === effectiveActiveId
                ? "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100"
                : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold">{conv.participantName}</div>
              <Badge tier={conv.participantBadge} />
            </div>
            <p className="line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
              {conv.lastMessage}
            </p>
          </button>
        ))}
      </div>

      {/* Active conversation */}
      <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        {active ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-zinc-500">{t("secureChat")}</p>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {active.participantName}
                </h3>
              </div>
              <button
                type="button"
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  active.translationEnabled
                    ? "bg-purple-600 text-white hover:bg-purple-700"
                    : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200"
                }`}
                onClick={() => toggleConversationTranslation(active.id)}
              >
                {t("translation")} {active.translationEnabled ? t("on") : t("off")}
              </button>
            </div>

            {/* Messages */}
            <div className="mt-3 flex-1 space-y-3 overflow-y-auto rounded-xl border border-zinc-100 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-800/50" style={{ maxHeight: "400px" }}>
              {active.messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isMe={msg.senderId !== active.participantId}
                  targetLang={language}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Moderation error */}
            {moderationError ? (
              <div className="mt-2 rounded-xl bg-red-50 p-3 text-xs text-red-800 dark:bg-red-900/30 dark:text-red-200">
                {moderationError}
              </div>
            ) : null}

            {/* Input */}
            <form
              className="mt-3 flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void handleSend();
              }}
            >
              <input
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setModerationError(null);
                }}
                placeholder={t("writeMessage")}
                disabled={sending}
                className="flex-1 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {sending ? "..." : t("send")}
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8">
            <p className="text-sm text-zinc-500 dark:text-zinc-300">
              {t("selectConversation")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
