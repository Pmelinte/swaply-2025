"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { translateMessage } from "@/lib/chat/chatTranslation";

interface Props {
  text: string;
  isMe: boolean;
}

export function ChatMessageTranslate({ text, isMe }: Props) {
  const t = useTranslations("chat");
  const locale = useLocale();
  const [translated, setTranslated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  async function handleTranslate() {
    if (translated) { setShowOriginal((v) => !v); return; }
    setLoading(true);
    try {
      const result = await translateMessage(text, locale);
      setTranslated(result);
    } catch {
      setTranslated(t("translationError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-1">
      {translated && !showOriginal && (
        <p className="rounded-lg bg-purple-50 px-2 py-1 text-sm italic text-purple-800 dark:bg-purple-950/30 dark:text-purple-200">
          {translated}
        </p>
      )}
      <button
        type="button"
        onClick={() => void handleTranslate()}
        disabled={loading}
        className="mt-0.5 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
      >
        {loading
          ? "..."
          : translated
            ? showOriginal
              ? t("showTranslation")
              : t("showOriginal")
            : `🌐 ${t("translate")}`}
      </button>
    </div>
  );
}
