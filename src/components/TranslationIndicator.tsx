"use client";

import { Globe, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface TranslationIndicatorProps {
  isTranslated: boolean;
  isLoading: boolean;
  showingOriginal: boolean;
  onToggle: () => void;
}

/**
 * Small globe icon with tooltip indicating auto-translated content.
 * Click toggles between translated and original text.
 */
export function TranslationIndicator({
  isTranslated,
  isLoading,
  showingOriginal,
  onToggle,
}: TranslationIndicatorProps) {
  const t = useTranslations("translate");

  if (!isTranslated && !isLoading) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      disabled={isLoading}
      className="inline-flex items-center gap-0.5 text-[10px] text-zinc-400 transition hover:text-blue-600 disabled:opacity-50 dark:text-zinc-500 dark:hover:text-blue-400"
      title={showingOriginal ? t("translate") : t("autoTranslated")}
    >
      {isLoading ? (
        <Loader2 className="h-2.5 w-2.5 animate-spin" />
      ) : (
        <Globe className="h-2.5 w-2.5" />
      )}
      {isLoading
        ? t("translating")
        : showingOriginal
          ? t("translate")
          : t("autoTranslated")}
    </button>
  );
}
