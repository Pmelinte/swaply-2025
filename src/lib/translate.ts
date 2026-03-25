/**
 * DeepL + Google Translate service for auto-translating user-generated content.
 * DeepL handles 29 high-quality languages; Google Translate covers the remaining 14.
 */

// Languages supported by DeepL API (free tier)
const DEEPL_LANGUAGES = new Set([
  "en", "de", "fr", "es", "it", "pt", "nl", "pl", "cs", "sk",
  "hu", "bg", "hr", "sl", "et", "lv", "lt", "fi", "sv", "da",
  "nb", "uk", "ru", "ja", "zh", "ko", "tr", "id", "ro",
]);

// Map Swaply locale codes to DeepL target language codes (where they differ)
const DEEPL_CODE_MAP: Record<string, string> = {
  no: "NB",    // Norwegian → Norwegian Bokmål
  pt: "PT-PT", // Portuguese (Portugal)
  zh: "ZH-HANS", // Chinese Simplified (DeepL v2 supports ZH-HANS)
};

function deeplCode(locale: string): string {
  return DEEPL_CODE_MAP[locale] ?? locale.toUpperCase();
}

/**
 * Translate a single text string to the target language.
 * Uses DeepL for supported languages, Google Translate for the rest.
 */
export async function translateText(
  text: string,
  targetLang: string,
  sourceLang = "ro",
): Promise<string | null> {
  if (!text.trim()) return null;

  // Try DeepL first for supported languages
  if (DEEPL_LANGUAGES.has(targetLang)) {
    const result = await translateWithDeepL(text, targetLang, sourceLang);
    if (result) return result;
    // Fall through to Google if DeepL fails
  }

  // Google Translate for unsupported DeepL languages or DeepL failures
  return translateWithGoogle(text, targetLang, sourceLang);
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

// ── DeepL API ─────────────────────────────────────────────────────────
async function translateWithDeepL(
  text: string,
  targetLang: string,
  sourceLang: string,
): Promise<string | null> {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) return null;

  // Determine API URL (free vs pro key)
  const baseUrl = apiKey.endsWith(":fx")
    ? "https://api-free.deepl.com"
    : "https://api.deepl.com";

  try {
    const res = await fetch(`${baseUrl}/v2/translate`, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: [text],
        source_lang: deeplCode(sourceLang),
        target_lang: deeplCode(targetLang),
      }),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      translations?: Array<{ text: string }>;
    };
    return data.translations?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

// ── Google Translate API ──────────────────────────────────────────────
async function translateWithGoogle(
  text: string,
  targetLang: string,
  sourceLang: string,
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) return null;

  // Map locale codes to Google Translate codes where they differ
  const googleLangMap: Record<string, string> = {
    no: "no",   // Norwegian
    fil: "tl",  // Filipino → Tagalog
    yi: "yi",   // Yiddish
    mn: "mn",   // Mongolian
    zh: "zh-CN", // Chinese Simplified
  };

  const target = googleLangMap[targetLang] ?? targetLang;
  const source = googleLangMap[sourceLang] ?? sourceLang;

  try {
    const res = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: text,
          source,
          target,
          format: "text",
        }),
      },
    );

    if (!res.ok) return null;

    const data = (await res.json()) as {
      data?: { translations?: Array<{ translatedText: string }> };
    };
    return data.data?.translations?.[0]?.translatedText ?? null;
  } catch {
    return null;
  }
}
