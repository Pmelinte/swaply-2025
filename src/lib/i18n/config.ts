// src/lib/i18n/config.ts

/**
 * Config minim i18n folosit de LanguageProvider.
 * Dacă ulterior vrei lista completă de limbi, o extindem aici.
 */

export const LOCALES = ["ro", "en", "fr", "es", "de"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ro";
