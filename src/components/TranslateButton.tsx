"use client";

import { useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Globe, Undo2, Loader2 } from "lucide-react";

interface TranslateButtonProps {
  /** The original text to translate */
  text: string;
  /** ISO language code of the source text (e.g. "ro", "de") */
  sourceLang?: string;
  /** Callback with translated text */
  onTranslated: (translated: string) => void;
  /** Callback when toggling back to original */
  onShowOriginal: () => void;
  /** Whether currently showing translated text */
  showingTranslation: boolean;
  /** Size variant */
  size?: "sm" | "md";
}

export function TranslateButton({
  text,
  sourceLang,
  onTranslated,
  onShowOriginal,
  showingTranslation,
  size = "md",
}: TranslateButtonProps) {
  const locale = useLocale();
  const t = useTranslations("translate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleTranslate = useCallback(async () => {
    if (showingTranslation) {
      onShowOriginal();
      return;
    }

    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          from: sourceLang || "en",
          to: locale,
        }),
      });
      const data = await res.json();
      if (data.translated && data.status !== "fallback") {
        onTranslated(data.translated);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [text, sourceLang, locale, showingTranslation, onTranslated, onShowOriginal]);

  const isSmall = size === "sm";

  if (showingTranslation) {
    return (
      <button
        type="button"
        onClick={handleTranslate}
        className={`inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 ${
          isSmall ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
        }`}
      >
        <Undo2 className={isSmall ? "h-2.5 w-2.5" : "h-3 w-3"} />
        {t("showOriginal")}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleTranslate}
      disabled={loading}
      className={`inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white font-medium text-zinc-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-blue-700 dark:hover:bg-blue-900/30 dark:hover:text-blue-300 ${
        isSmall ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      }`}
    >
      {loading ? (
        <Loader2 className={`animate-spin ${isSmall ? "h-2.5 w-2.5" : "h-3 w-3"}`} />
      ) : (
        <Globe className={isSmall ? "h-2.5 w-2.5" : "h-3 w-3"} />
      )}
      {loading ? t("translating") : error ? t("retryTranslate") : t("translate")}
    </button>
  );
}

// ── Inline translate hook for simpler use cases ─────────────────────
export function useInlineTranslation() {
  const locale = useLocale();
  const [translations, setTranslations] = useState<
    Record<string, { translated: string; showTranslation: boolean }>
  >({});

  const translate = useCallback(
    async (key: string, text: string, sourceLang?: string) => {
      const existing = translations[key];
      if (existing) {
        // Toggle
        setTranslations((prev) => ({
          ...prev,
          [key]: { ...prev[key], showTranslation: !prev[key].showTranslation },
        }));
        return;
      }

      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            from: sourceLang || "en",
            to: locale,
          }),
        });
        const data = await res.json();
        if (data.translated && data.status !== "fallback") {
          setTranslations((prev) => ({
            ...prev,
            [key]: { translated: data.translated, showTranslation: true },
          }));
        }
      } catch {
        // Silently fail
      }
    },
    [locale, translations],
  );

  const getText = useCallback(
    (key: string, original: string): string => {
      const entry = translations[key];
      if (entry?.showTranslation) return entry.translated;
      return original;
    },
    [translations],
  );

  const isTranslated = useCallback(
    (key: string): boolean => {
      return translations[key]?.showTranslation ?? false;
    },
    [translations],
  );

  return { translate, getText, isTranslated };
}
