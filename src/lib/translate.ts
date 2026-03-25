/**
 * Translation utility using DeepL (primary) + Google Translate (fallback).
 * DeepL covers 29 high-quality languages; Google Translate covers the rest.
 */

// ── Languages supported by DeepL API ────────────────────────────────
const DEEPL_LANGUAGES = new Set([
  "en", "de", "fr", "es", "it", "pt", "nl", "pl", "cs", "sk",
  "hu", "bg", "hr", "sl", "et", "lv", "lt", "fi", "sv", "da",
  "nb", "uk", "ru", "ja", "zh", "ko", "tr", "id", "ro",
]);

// DeepL uses some non-standard codes
const DEEPL_LANG_MAP: Record<string, string> = {
  no: "NB",   // Norwegian → Norwegian Bokmål
  zh: "ZH",   // Chinese (simplified)
  pt: "PT-PT", // Portuguese (European)
};

function toDeepLCode(lang: string): string {
  return DEEPL_LANG_MAP[lang] ?? lang.toUpperCase();
}

function isDeepLSupported(lang: string): boolean {
  // Map 'no' → 'nb' for the check
  const normalized = lang === "no" ? "nb" : lang;
  return DEEPL_LANGUAGES.has(normalized);
}

// ── DeepL Translation ───────────────────────────────────────────────
async function translateWithDeepL(
  text: string,
  targetLang: string,
  sourceLang: string,
): Promise<string> {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) throw new Error("DEEPL_API_KEY not configured");

  const res = await fetch("https://api-free.deepl.com/v2/translate", {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: [text],
      source_lang: toDeepLCode(sourceLang),
      target_lang: toDeepLCode(targetLang),
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "unknown");
    throw new Error(`DeepL API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.translations[0].text;
}

// ── Google Translate ────────────────────────────────────────────────
async function translateWithGoogle(
  text: string,
  targetLang: string,
  sourceLang: string,
): Promise<string> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_TRANSLATE_API_KEY not configured");

  const res = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: sourceLang,
        target: targetLang,
        format: "text",
      }),
    },
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => "unknown");
    throw new Error(`Google Translate API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.data.translations[0].translatedText;
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Translate text using DeepL (if both source and target are supported)
 * or Google Translate as fallback.
 */
export async function translateText(
  text: string,
  targetLang: string,
  sourceLang = "ro",
): Promise<string> {
  if (!text.trim()) return text;
  if (targetLang === sourceLang) return text;

  // Use DeepL if both languages are supported
  if (isDeepLSupported(sourceLang) && isDeepLSupported(targetLang)) {
    try {
      return await translateWithDeepL(text, targetLang, sourceLang);
    } catch {
      // Fall through to Google Translate
    }
  }

  // Fallback: Google Translate (covers all remaining languages)
  return translateWithGoogle(text, targetLang, sourceLang);
}

/**
 * Translate multiple fields in batch (title + description).
 * Returns an object with translated fields.
 */
export async function translateItemFields(
  fields: { title: string; description: string },
  targetLang: string,
  sourceLang = "ro",
): Promise<{ title: string; description: string }> {
  const [title, description] = await Promise.all([
    translateText(fields.title, targetLang, sourceLang),
    translateText(fields.description, targetLang, sourceLang),
  ]);
  return { title, description };
}
