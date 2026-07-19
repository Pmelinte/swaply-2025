"use client";

/**
 * Failure-safe client contract for on-demand chat translation.
 *
 * The original message is never replaced by fallback/error copy. Successful
 * translations are cached in-memory for the current browser session, while
 * provider fallbacks are deliberately not cached so a later retry can recover.
 */

export type ChatTranslationStatus = "translated" | "same_language" | "fallback";

export interface ChatTranslationResult {
  originalText: string;
  translatedText: string | null;
  sourceLang: string;
  targetLang: string;
  status: ChatTranslationStatus;
  source: "network" | "server_cache" | "memory_cache" | "same_language" | "fallback";
}

interface TranslationApiPayload {
  translated?: unknown;
  status?: unknown;
  source?: unknown;
}

interface TranslateMessageOptions {
  sourceLang?: string;
  request?: typeof fetch;
}

const translationMemoryCache = new Map<string, ChatTranslationResult>();

function normalizeLocale(locale: string): string {
  return locale.trim().toLowerCase().split("-")[0] || "en";
}

export function detectLikelyMessageLanguage(text: string): string {
  if (/[ăâîșț]/i.test(text)) return "ro";
  if (/[ñ¿¡]/i.test(text)) return "es";
  if (/[äöüß]/i.test(text)) return "de";
  if (/[àâçéèêëîïôûùüÿœ]/i.test(text)) return "fr";
  if (/[Ѐ-ӿ]/u.test(text)) return "ru";
  if (/[Ͱ-Ͽ]/u.test(text)) return "el";
  if (/[֐-׿]/u.test(text)) return "yi";
  if (/[؀-ۿ]/u.test(text)) return "ar";
  if (/[぀-ヿ]/u.test(text)) return "ja";
  if (/[一-鿿]/u.test(text)) return "zh";
  if (/[가-힯]/u.test(text)) return "ko";
  return "auto";
}

export function createChatTranslationCacheKey(
  text: string,
  sourceLang: string,
  targetLang: string,
): string {
  return JSON.stringify([
    normalizeLocale(sourceLang),
    normalizeLocale(targetLang),
    text,
  ]);
}

export function clearChatTranslationMemoryCache(): void {
  translationMemoryCache.clear();
}

export async function translateMessage(
  text: string,
  targetLang: string,
  options: TranslateMessageOptions = {},
): Promise<ChatTranslationResult> {
  const originalText = text;
  const normalizedTarget = normalizeLocale(targetLang);
  const sourceLang = normalizeLocale(
    options.sourceLang ?? detectLikelyMessageLanguage(originalText),
  );
  const key = createChatTranslationCacheKey(originalText, sourceLang, normalizedTarget);
  const cached = translationMemoryCache.get(key);

  if (cached) {
    return { ...cached, source: "memory_cache" };
  }

  const request = options.request ?? fetch;
  const response = await request("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: originalText,
      from: sourceLang,
      to: normalizedTarget,
    }),
  });

  if (!response.ok) {
    throw new Error(`Translation request failed with HTTP ${response.status}`);
  }

  const payload = await response.json() as TranslationApiPayload;
  const apiStatus = typeof payload.status === "string" ? payload.status : "";
  const apiTranslation = typeof payload.translated === "string"
    ? payload.translated
    : null;

  if (apiStatus === "fallback") {
    return {
      originalText,
      translatedText: null,
      sourceLang,
      targetLang: normalizedTarget,
      status: "fallback",
      source: "fallback",
    };
  }

  if (apiStatus === "same_language") {
    const result: ChatTranslationResult = {
      originalText,
      translatedText: null,
      sourceLang,
      targetLang: normalizedTarget,
      status: "same_language",
      source: "same_language",
    };
    translationMemoryCache.set(key, result);
    return result;
  }

  if (apiStatus !== "ok" || !apiTranslation?.trim()) {
    throw new Error("Translation response was malformed");
  }

  const result: ChatTranslationResult = {
    originalText,
    translatedText: apiTranslation,
    sourceLang,
    targetLang: normalizedTarget,
    status: "translated",
    source: payload.source === "cache" ? "server_cache" : "network",
  };

  translationMemoryCache.set(key, result);
  return result;
}

/**
 * Conservative hint used only to decide whether a translate affordance may be
 * useful. It never changes or hides the original message.
 */
export function likelyNeedsTranslation(
  text: string,
  userLocale: string,
): boolean {
  const detected = detectLikelyMessageLanguage(text);
  const target = normalizeLocale(userLocale);
  return detected === "auto" || detected !== target;
}
