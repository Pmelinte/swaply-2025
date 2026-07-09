import type { LanguageFallbackRequest } from "./languageFallbackTypes";

export const LANGUAGE_FALLBACK_EXAMPLES = [
  {
    requestedLocale: "ro",
    userPreferredLocale: null,
    availableLocales: ["en", "ro", "fr"],
    defaultLocale: "en",
    surface: "public_page",
  },
  {
    requestedLocale: "pt-BR",
    userPreferredLocale: null,
    availableLocales: ["en", "pt-PT", "es"],
    defaultLocale: "en",
    surface: "item_listing",
  },
  {
    requestedLocale: "nl",
    userPreferredLocale: "de",
    availableLocales: ["en", "de", "fr"],
    defaultLocale: "en",
    surface: "blog",
  },
  {
    requestedLocale: "ja",
    userPreferredLocale: null,
    availableLocales: [],
    defaultLocale: "en",
    surface: "public_page",
  },
  {
    requestedLocale: "es",
    userPreferredLocale: null,
    availableLocales: ["en"],
    defaultLocale: "en",
    surface: "chat",
  },
] as const satisfies readonly LanguageFallbackRequest[];
