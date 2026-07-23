"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";

/**
 * Client-side hook for on-demand translation of user-generated text.
 *
 * Uses the /api/translate endpoint which checks translation_cache
 * before calling Claude Haiku. Returns original text immediately,
 * then swaps in the translation once ready.
 */
export function useTranslatedText(
  originalText: string,
  sourceLang = "ro",
): string {
  const locale = useLocale();
  const shouldUseOriginal = !originalText.trim() || locale === sourceLang;
  const [translatedState, setTranslatedState] = useState({
    key: `${originalText}::${locale}::${sourceLang}`,
    value: originalText,
  });
  const cacheRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (shouldUseOriginal) return;

    // Check in-memory cache first
    const cacheKey = `${originalText}::${locale}`;
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setTranslatedState({
        key: `${originalText}::${locale}::${sourceLang}`,
        value: cached,
      });
      return;
    }

    let cancelled = false;

    fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: originalText, from: sourceLang, to: locale }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.translated) {
          cacheRef.current.set(cacheKey, data.translated);
          setTranslatedState({
            key: `${originalText}::${locale}::${sourceLang}`,
            value: data.translated,
          });
        }
      })
      .catch(() => { /* keep original */ });

    return () => { cancelled = true; };
  }, [originalText, locale, sourceLang, shouldUseOriginal]);

  if (shouldUseOriginal) return originalText;

  return translatedState.key === `${originalText}::${locale}::${sourceLang}`
    ? translatedState.value
    : originalText;
}

/**
 * Batch-translate multiple texts at once.
 * Returns a map from original text to translated text.
 * Uses a single state update for all translations.
 */
export function useTranslatedTexts(
  texts: string[],
  sourceLang = "ro",
): Map<string, string> {
  const locale = useLocale();
  const [translations, setTranslations] = useState<Map<string, string>>(new Map());
  const cacheRef = useRef<Map<string, string>>(new Map());
  const textsKey = texts.join("|");

  useEffect(() => {
    if (locale === sourceLang || texts.length === 0) return;

    let cancelled = false;

    // Filter out texts already cached
    const toTranslate = texts.filter(
      (t) => t.trim() && !cacheRef.current.has(`${t}::${locale}`),
    );

    // Apply cached translations immediately
    const initial = new Map<string, string>();
    for (const t of texts) {
      const cached = cacheRef.current.get(`${t}::${locale}`);
      if (cached) initial.set(t, cached);
    }
    if (initial.size > 0) setTranslations(new Map(initial));

    if (toTranslate.length === 0) return;

    // Translate uncached texts in parallel
    Promise.all(
      toTranslate.map((text) =>
        fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, from: sourceLang, to: locale }),
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => ({ original: text, translated: data?.translated ?? text }))
          .catch(() => ({ original: text, translated: text })),
      ),
    ).then((results) => {
      if (cancelled) return;
      const updated = new Map(cacheRef.current);
      for (const { original, translated } of results) {
        const key = `${original}::${locale}`;
        updated.set(key, translated);
        cacheRef.current.set(key, translated);
      }
      // Build output map keyed by original text
      const output = new Map<string, string>();
      for (const t of texts) {
        output.set(t, cacheRef.current.get(`${t}::${locale}`) ?? t);
      }
      setTranslations(output);
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textsKey, locale, sourceLang]);

  return translations;
}
