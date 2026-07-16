import { locales } from "@/i18n/config";

export type LanguageFallbackMode =
  | "exact_locale"
  | "user_preferred_locale"
  | "user_primary"
  | "user_secondary"
  | "user_tertiary"
  | "route_locale"
  | "browser_locale"
  | "source_locale"
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
  /**
   * Legacy requested locale. New call sites should prefer routeLocale.
   * Kept to avoid breaking existing public-content integrations.
   */
  requestedLocale?: string | null;
  /** Legacy single preference. New call sites should provide primaryLocale. */
  userPreferredLocale?: string | null;
  primaryLocale?: string | null;
  secondaryLocale?: string | null;
  tertiaryLocale?: string | null;
  routeLocale?: string | null;
  browserLocale?: string | null;
  sourceLocale?: string | null;
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
  attemptedLocales: string[];
}

export interface TranslationDisplayPolicy {
  surface: TranslationSurface;
  canUseMachineTranslation: boolean;
  mustPreserveOriginal: boolean;
  requiresHumanReview: boolean;
}

export const GLOBAL_DEFAULT_LOCALE = "en";

/** Stable legacy subset used by older public-page tests and content tooling. */
export const CORE_PUBLIC_LOCALES = ["en", "ro", "fr", "es", "de"] as const;

/** Canonical global-first registry. It must stay aligned with i18n/config.ts. */
export const ACTIVE_PUBLIC_LOCALES = locales;

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
