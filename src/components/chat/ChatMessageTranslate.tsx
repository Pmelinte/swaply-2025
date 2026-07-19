"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  translateMessage,
  type ChatTranslationResult,
} from "@/lib/chat/chatTranslation";

interface Props {
  text: string;
  isMe: boolean;
}

export function ChatMessageTranslate({ text, isMe }: Props) {
  const t = useTranslations("chat");
  const locale = useLocale();
  const [result, setResult] = useState<ChatTranslationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translationFailed, setTranslationFailed] = useState(false);

  async function handleTranslate() {
    if (result?.status === "translated") {
      setShowTranslation((value) => !value);
      return;
    }

    setLoading(true);
    setTranslationFailed(false);

    try {
      const nextResult = await translateMessage(text, locale);
      setResult(nextResult);
      setShowTranslation(nextResult.status === "translated");
      setTranslationFailed(nextResult.status === "fallback");
    } catch {
      setResult(null);
      setShowTranslation(false);
      setTranslationFailed(true);
    } finally {
      setLoading(false);
    }
  }

  if (isMe) return null;

  return (
    <div className="mt-1">
      {result?.status === "translated" && showTranslation && result.translatedText ? (
        <p className="rounded-lg bg-purple-50 px-2 py-1 text-sm italic text-purple-800 dark:bg-purple-950/30 dark:text-purple-200">
          {result.translatedText}
        </p>
      ) : null}

      {translationFailed ? (
        <p
          role="status"
          className="mt-1 text-[11px] text-amber-700 dark:text-amber-300"
        >
          {t("translationError")}
        </p>
      ) : null}

      {result?.status !== "same_language" ? (
        <button
          type="button"
          onClick={() => void handleTranslate()}
          disabled={loading}
          className="mt-0.5 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 hover:bg-zinc-200 disabled:cursor-wait disabled:opacity-60 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
        >
          {loading
            ? "..."
            : result?.status === "translated"
              ? showTranslation
                ? t("showOriginal")
                : t("showTranslation")
              : `🌐 ${t("translate")}`}
        </button>
      ) : null}
    </div>
  );
}
