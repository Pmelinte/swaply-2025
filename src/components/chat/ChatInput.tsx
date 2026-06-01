"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Send, Globe, Shield, MapPin, Plus, X } from "lucide-react";
import { ChatMediaUpload } from "./ChatMediaUpload";
import { moderateMessageText } from "@/lib/chat/chatModeration";
import type { PendingMedia } from "./ChatMediaUpload";

interface Props {
  onSend: (text: string, media: PendingMedia | null) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
  loginRequired?: boolean;
}

export function ChatInput({ onSend, onTyping, disabled, loginRequired }: Props) {
  const t = useTranslations("chat");
  const tInput = useTranslations("chat.input");
  const [text, setText] = useState("");
  const [pendingMedia, setPendingMedia] = useState<PendingMedia | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setText(value);
    setWarning(null);
    onTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTyping(false), 2000);
  }

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed && !pendingMedia) return;

    if (trimmed) {
      const { warning: mod } = moderateMessageText(trimmed);
      if (mod) { setWarning(t(mod as keyof object)); }
    }

    onTyping(false);
    onSend(trimmed, pendingMedia);
    setText("");
    setPendingMedia(null);
    setWarning(null);
    setAttachOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const isDisabled = disabled || loginRequired;
  const placeholder = loginRequired ? tInput("loginRequired") : tInput("placeholder");

  return (
    <div className="shrink-0 border-t border-zinc-100 bg-white px-3 py-2">
      {warning && (
        <div className="mb-2 rounded-xl bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
          ⚠️ {warning}
        </div>
      )}

      {/* Attachment sheet — expands above the input row */}
      {attachOpen && (
        <div className="mb-2 rounded-xl border border-zinc-100 bg-zinc-50 p-3">
          <div className="grid grid-cols-3 gap-2">
            {/* Media upload tiles (image / audio / video) */}
            <ChatMediaUpload
              pending={pendingMedia}
              onMediaSelected={(media) => {
                setPendingMedia(media);
                setAttachOpen(false);
              }}
              onClear={() => setPendingMedia(null)}
              tileLayout
            />

            {/* Location */}
            <button
              type="button"
              disabled={isDisabled}
              className="flex flex-col items-center gap-1.5 rounded-xl p-3 text-xs text-zinc-600 hover:bg-white disabled:opacity-40"
              aria-label={t("shareLocation")}
            >
              <MapPin className="h-5 w-5 text-blue-500" />
              <span>{t("shareLocation")}</span>
            </button>

            {/* Translate */}
            <button
              type="button"
              disabled={isDisabled}
              className="flex flex-col items-center gap-1.5 rounded-xl p-3 text-xs text-zinc-600 hover:bg-white disabled:opacity-40"
              aria-label={t("translate")}
            >
              <Globe className="h-5 w-5 text-green-500" />
              <span>{t("translate")}</span>
            </button>

            {/* Moderation */}
            <button
              type="button"
              disabled={isDisabled}
              className="flex flex-col items-center gap-1.5 rounded-xl p-3 text-xs text-zinc-600 hover:bg-white disabled:opacity-40"
              aria-label={t("moderation")}
              title={t("moderation")}
            >
              <Shield className="h-5 w-5 text-orange-400" />
              <span>{t("moderation")}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main input row */}
      <div className="flex items-center gap-1">
        {/* + attachment toggle */}
        <button
          type="button"
          disabled={isDisabled}
          onClick={() => setAttachOpen((o) => !o)}
          aria-label={t("attach")}
          aria-expanded={attachOpen}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 disabled:opacity-40 ${attachOpen ? "bg-zinc-100 text-blue-600" : ""}`}
        >
          <Plus className="h-4 w-4" />
        </button>

        <textarea
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isDisabled}
          rows={1}
          aria-label={tInput("placeholder")}
          className="flex-1 resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-800 placeholder-zinc-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ maxHeight: 72, overflowY: "auto" }}
        />

        {/* Pending media badge */}
        {pendingMedia && (
          <div className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
            {pendingMedia.type === "image" ? "📷" : pendingMedia.type === "audio" ? "🎤" : "🎬"}
            <span className="max-w-20 truncate">{pendingMedia.file.name}</span>
            <button type="button" onClick={() => setPendingMedia(null)} aria-label={t("removeFile")}>
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Send */}
        <button
          type="button"
          onClick={handleSend}
          disabled={isDisabled || (!text.trim() && !pendingMedia)}
          aria-label={tInput("send")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
