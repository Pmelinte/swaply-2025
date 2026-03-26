/**
 * Claude API translation service for user-generated content.
 * Uses claude-haiku-4-5-20251001 for fast, accurate translations.
 * Results are cached in DB — Claude is called once per text per language.
 */

import { locales } from "@/i18n/config";

const LOCALE_NAMES: Record<string, string> = {
  en: "English", ro: "Romanian", fr: "French", de: "German",
  es: "Spanish", it: "Italian", pt: "Portuguese", nl: "Dutch",
  pl: "Polish", el: "Greek", hu: "Hungarian", bg: "Bulgarian",
  cs: "Czech", sk: "Slovak", hr: "Croatian", sl: "Slovenian",
  sr: "Serbian", sv: "Swedish", da: "Danish", fi: "Finnish",
  no: "Norwegian", lt: "Lithuanian", lv: "Latvian", et: "Estonian",
  ga: "Irish", mt: "Maltese", ru: "Russian", tr: "Turkish",
  ar: "Arabic", zh: "Chinese (Simplified)", hi: "Hindi", bn: "Bengali",
  ja: "Japanese", ko: "Korean", vi: "Vietnamese", th: "Thai",
  id: "Indonesian", ms: "Malay", fil: "Filipino", fa: "Persian",
  mn: "Mongolian", uk: "Ukrainian", yi: "Yiddish",
};

function getLocaleName(code: string): string {
  return LOCALE_NAMES[code] ?? code;
}

/**
 * Translate text using Claude Haiku API.
 */
async function translateWithClaude(
  text: string,
  targetLocale: string,
  sourceLang = "ro",
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const targetName = getLocaleName(targetLocale);
  const sourceName = getLocaleName(sourceLang);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system:
          "You are a professional translator for Swaply, a global barter/swap marketplace. " +
          "Translate naturally and accurately into the target language. " +
          "Preserve the meaning in the context of object exchange and bartering. " +
          "Return ONLY the translated text, nothing else. " +
          "Do not add explanations, quotes, or prefixes.",
        messages: [
          {
            role: "user",
            content: `Translate the following from ${sourceName} to ${targetName}:\n\n${text}`,
          },
        ],
      }),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      content?: Array<{ type: string; text: string }>;
    };
    return data.content?.[0]?.text?.trim() ?? null;
  } catch {
    return null;
  }
}

/**
 * Translate a single text string to the target language using Claude.
 */
export async function translateText(
  text: string,
  targetLang: string,
  sourceLang = "ro",
): Promise<string | null> {
  if (!text.trim()) return null;
  if (targetLang === sourceLang) return text;

  return translateWithClaude(text, targetLang, sourceLang);
}

/**
 * Translate title + description for an item. Returns null fields on failure.
 */
export async function translateItemContent(
  title: string,
  description: string,
  targetLang: string,
  sourceLang = "ro",
): Promise<{ title: string | null; description: string | null }> {
  const [translatedTitle, translatedDescription] = await Promise.all([
    translateText(title, targetLang, sourceLang),
    description ? translateText(description, targetLang, sourceLang) : Promise.resolve(null),
  ]);

  return { title: translatedTitle, description: translatedDescription };
}

/** Check if a locale code is valid */
export function isValidLocale(code: string): boolean {
  return (locales as readonly string[]).includes(code);
}
