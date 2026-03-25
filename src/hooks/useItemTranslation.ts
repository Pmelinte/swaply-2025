"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";

interface ItemTranslation {
  title: string;
  description: string;
}

interface UseItemTranslationResult {
  /** Translated title (or original if not yet translated) */
  title: string;
  /** Translated description (or original if not yet translated) */
  description: string;
  /** Whether content is auto-translated */
  isTranslated: boolean;
  /** Whether translation is loading */
  isLoading: boolean;
  /** Whether user toggled to show original */
  showingOriginal: boolean;
  /** Toggle between translated and original */
  toggleOriginal: () => void;
}

/**
 * Hook that auto-translates item title/description when locale !== "ro".
 * Fetches from /api/translate/item which uses DB cache + DeepL/Google.
 */
export function useItemTranslation(
  itemId: string,
  originalTitle: string,
  originalDescription: string,
): UseItemTranslationResult {
  const locale = useLocale();
  const needsTranslation = locale !== "ro" && !!itemId;
  const [translation, setTranslation] = useState<ItemTranslation | null>(null);
  const [isLoading, setIsLoading] = useState(needsTranslation);
  const [showingOriginal, setShowingOriginal] = useState(false);

  useEffect(() => {
    // Don't translate if already Romanian or no itemId
    if (!needsTranslation) return;

    let cancelled = false;

    fetch("/api/translate/item", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, targetLocale: locale }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.title) {
          setTranslation({ title: data.title, description: data.description ?? "" });
        }
      })
      .catch(() => {
        // Silently fail — show original content
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [itemId, locale, needsTranslation]);

  const toggleOriginal = useCallback(() => {
    setShowingOriginal((prev) => !prev);
  }, []);

  const isTranslated = translation !== null && locale !== "ro";
  const useTranslated = isTranslated && !showingOriginal;

  return {
    title: useTranslated ? translation!.title : originalTitle,
    description: useTranslated ? translation!.description : originalDescription,
    isTranslated,
    isLoading,
    showingOriginal,
    toggleOriginal,
  };
}
