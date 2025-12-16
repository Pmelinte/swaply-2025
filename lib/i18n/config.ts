// src/lib/i18n/config.ts

export const i18nConfig = {
  defaultLocale: "en",
  locales: ["en", "ro", "fr", "de", "es"],
} as const;

export type Locale = (typeof i18nConfig.locales)[number];

// Exporturi extra (compat) dacă ai cod care le folosește:
export const LOCALES = i18nConfig.locales;
export const DEFAULT_LOCALE: Locale = i18nConfig.defaultLocale;
