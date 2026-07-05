export type ChatTranslation = {
  source_language: string;
  target_language: string;
  translated_text: string;
  provider: "fallback" | "manual" | "external";
  created_at: string;
};

export type MessageTranslationMetadata = {
  translations?: Record<string, ChatTranslation>;
  detected_language?: string;
};

const ROMANIAN_HINTS = ["salut", "multumesc", "mulțumesc", "schimb", "obiect", "curier", "gata"];
const ENGLISH_HINTS = ["hello", "thanks", "exchange", "item", "shipping", "ready"];
const FRENCH_HINTS = ["bonjour", "merci", "échange", "objet", "livraison"];
const SPANISH_HINTS = ["hola", "gracias", "intercambio", "objeto", "envío"];
const GERMAN_HINTS = ["hallo", "danke", "tausch", "gegenstand", "versand"];

function includesAny(text: string, hints: string[]): boolean {
  return hints.some((hint) => text.includes(hint));
}

export function detectMessageLanguage(text: string): string {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return "unknown";

  if (includesAny(normalized, ROMANIAN_HINTS)) return "ro";
  if (includesAny(normalized, ENGLISH_HINTS)) return "en";
  if (includesAny(normalized, FRENCH_HINTS)) return "fr";
  if (includesAny(normalized, SPANISH_HINTS)) return "es";
  if (includesAny(normalized, GERMAN_HINTS)) return "de";

  if (/[ăâîșţț]/i.test(normalized)) return "ro";
  if (/[éèêàçù]/i.test(normalized)) return "fr";
  if (/[ñáéíóú]/i.test(normalized)) return "es";
  if (/[äöüß]/i.test(normalized)) return "de";

  return "unknown";
}

export function getCachedTranslation(
  metadata: MessageTranslationMetadata | null | undefined,
  targetLanguage: string,
): ChatTranslation | null {
  return metadata?.translations?.[targetLanguage] ?? null;
}

export async function translateMessageFallback(input: {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
}): Promise<ChatTranslation> {
  const source = input.sourceLanguage || detectMessageLanguage(input.text);

  return {
    source_language: source,
    target_language: input.targetLanguage,
    translated_text:
      source === input.targetLanguage
        ? input.text
        : `[${source || "unknown"} → ${input.targetLanguage}] ${input.text}`,
    provider: "fallback",
    created_at: new Date().toISOString(),
  };
}

export function mergeTranslationMetadata(
  metadata: Record<string, unknown> | null | undefined,
  translation: ChatTranslation,
): Record<string, unknown> {
  const existingTranslations =
    metadata?.translations && typeof metadata.translations === "object"
      ? (metadata.translations as Record<string, ChatTranslation>)
      : {};

  return {
    ...(metadata ?? {}),
    detected_language: translation.source_language,
    translations: {
      ...existingTranslations,
      [translation.target_language]: translation,
    },
  };
}
