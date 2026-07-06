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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isDatabaseItemId(itemId: string) {
  return UUID_RE.test(itemId);
}

/**
 * Hook that auto-translates item title/description when locale !== "ro".
 * Fetches from /api/translate/item which uses DB cache + DeepL/Google.
 * Demo/local items do not exist in the DB, so they intentionally keep original text.
 */
export function useItemTranslation(
  itemId: string,
  originalTitle: string,
  originalDescription: string,
): UseItemTranslationResult {
  const locale = useLocale();
  const canRequestTranslation = locale !== "ro" && !!itemId && isDatabaseItemId(itemId);
  const [translation, setTranslation] = useState<ItemTranslation | null>(null);
  const [isLoading, setIsLoading] = useState(canRequestTranslation);
  const [showingOriginal, setShowingOriginal] = useState(false);

  useEffect(() => {
    setTranslation(null);
    setIsLoading(canRequestTranslation);

    // Don't translate Romanian, missing ids, or local/demo ids that cannot exist in the DB.
    if (!canRequestTranslation) return;

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
  }, [itemId, locale, canRequestTranslation]);

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
