"use client";

/**
 * Client-side chat translation helpers.
 * Calls the existing /api/translate endpoint (Claude Haiku) with caching.
 */

const translationMemoryCache = new Map<string, string>();

function cacheKey(text: string, targetLang: string): string {
  return `${targetLang}::${text.slice(0, 200)}`;
}

/**
 * Translate a message using the /api/translate endpoint.
 * Results are cached in-memory for the session.
 */
export async function translateMessage(
  text: string,
  targetLang: string,
): Promise<string> {
  const key = cacheKey(text, targetLang);
  const cached = translationMemoryCache.get(key);
  if (cached) return cached;

  // Auto-detect source language from content heuristics
  const fromLang =
    /[ăâîșț]/i.test(text) ? "ro"
    : /[ñáéíóú]/i.test(text) ? "es"
    : /[äöüß]/i.test(text) ? "de"
    : /[éèêàùûî]/i.test(text) ? "fr"
    : "en";

  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, from: fromLang, to: targetLang }),
  });

  if (!res.ok) throw new Error("Translation failed");

  const data = await res.json() as { translated?: string };
  const translated = data.translated ?? text;

  translationMemoryCache.set(key, translated);
  return translated;
}

/**
 * Detect if two strings are in different languages (simple heuristic).
 */
export function likelyNeedsTranslation(
  text: string,
  userLocale: string,
): boolean {
  if (userLocale.startsWith("en") && /[ăâîșțäöüéèêçñ]/i.test(text)) return true;
  if (userLocale.startsWith("ro") && !/[ăâîșț]/i.test(text) && /[a-z]{5,}/i.test(text)) return true;
  return false;
}
