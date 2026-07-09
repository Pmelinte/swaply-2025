export type LanguageFallbackMode =
  | "exact_locale"
  | "user_preferred_locale"
  | "language_family"
  | "default_global"
  | "first_available"
  | "original_content";

export type TranslationSurface =
  | "public_page"
  | "item_listing"
  | "matching"
  | "chat"
  | "exchange"
  | "blog"
  | "story"
  | "legal";

export interface LanguageFallbackRequest {
  requestedLocale?: string | null;
  userPreferredLocale?: string | null;
  availableLocales: string[];
  defaultLocale: string;
  surface: TranslationSurface;
}

export interface LanguageFallbackResult {
  resolvedLocale: string;
  fallbackMode: LanguageFallbackMode;
  shouldShowOriginal: boolean;
  translationNeeded: boolean;
  pageCanRender: true;
  reasons: string[];
}

export interface TranslationDisplayPolicy {
  surface: TranslationSurface;
  canUseMachineTranslation: boolean;
  mustPreserveOriginal: boolean;
  requiresHumanReview: boolean;
}

export const GLOBAL_DEFAULT_LOCALE = "en";

export const CORE_PUBLIC_LOCALES = ["en", "ro", "fr", "es", "de"] as const;

export const TRANSLATION_SURFACES: readonly TranslationSurface[] = [
  "public_page",
  "item_listing",
  "matching",
  "chat",
  "exchange",
  "blog",
  "story",
  "legal",
] as const;
