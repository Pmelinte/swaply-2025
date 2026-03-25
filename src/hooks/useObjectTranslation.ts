"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";

interface TranslatedFields {
  title: string;
  description: string;
}

interface UseObjectTranslationResult {
  /** Translated title (or original if not translated) */
  title: string;
  /** Translated description (or original if not translated) */
  description: string;
  /** Whether currently showing a translation */
  isTranslated: boolean;
  /** Whether translation is loading */
  isLoading: boolean;
  /** Toggle between original and translated */
  toggleOriginal: () => void;
}

export function useObjectTranslation(
  objectId: string,
  originalTitle: string,
  originalDescription: string,
): UseObjectTranslationResult {
  const locale = useLocale();
  const [translated, setTranslated] = useState<TranslatedFields | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Only translate if current locale is not Romanian (source language)
  const needsTranslation = locale !== "ro";

  useEffect(() => {
    if (!needsTranslation || !objectId) return;

    let cancelled = false;
    setIsLoading(true);

    fetch("/api/translate-object", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ objectId, targetLocale: locale }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.title) {
          setTranslated({ title: data.title, description: data.description });
        }
      })
      .catch(() => {
        // Translation is non-critical
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [objectId, locale, needsTranslation]);

  const toggleOriginal = useCallback(() => {
    setShowOriginal((prev) => !prev);
  }, []);

  const isTranslated = needsTranslation && translated !== null && !showOriginal;

  return {
    title: isTranslated ? translated!.title : originalTitle,
    description: isTranslated ? translated!.description : originalDescription,
    isTranslated,
    isLoading,
    toggleOriginal,
  };
}
