"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Send, Camera, Mic, Globe, Shield } from "lucide-react";
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

      {/* Row 1: Quick action icons + textarea + send */}
      <div className="flex items-center gap-1">
        <ChatMediaUpload
          pending={pendingMedia}
          onMediaSelected={setPendingMedia}
          onClear={() => setPendingMedia(null)}
        />

        <button
          type="button"
          disabled={isDisabled}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 disabled:opacity-40"
          aria-label="Photo"
        >
          <Camera className="h-4 w-4" />
        </button>

        <button
          type="button"
          disabled={isDisabled}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 disabled:opacity-40"
          aria-label="Voice message"
        >
          <Mic className="h-4 w-4" />
        </button>

        <button
          type="button"
          disabled={isDisabled}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 disabled:opacity-40"
          aria-label="Translate"
        >
          <Globe className="h-4 w-4" />
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

      {/* Row 2: Request moderation */}
      <div className="mt-2">
        <button
          type="button"
          disabled={isDisabled}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
        >
          <Shield className="h-3.5 w-3.5" />
          Request moderation
        </button>
      </div>
    </div>
  );
}
