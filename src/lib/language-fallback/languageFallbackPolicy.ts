import type {
  LanguageFallbackRequest,
  LanguageFallbackResult,
  TranslationDisplayPolicy,
  TranslationSurface,
} from "./languageFallbackTypes";
import { GLOBAL_DEFAULT_LOCALE } from "./languageFallbackTypes";

export function normalizeLocale(locale?: string | null) {
  return locale?.trim().replace("_", "-").toLowerCase() ?? "";
}

export function getLanguageFamily(locale?: string | null) {
  return normalizeLocale(locale).split("-")[0] ?? "";
}

export function resolveLanguageFallback(request: LanguageFallbackRequest): LanguageFallbackResult {
  const availableLocales = normalizeLocaleList(request.availableLocales);
  const requestedLocale = normalizeLocale(request.requestedLocale);
  const preferredLocale = normalizeLocale(request.userPreferredLocale);
  const defaultLocale = normalizeLocale(request.defaultLocale) || GLOBAL_DEFAULT_LOCALE;
  const reasons: string[] = [];

  const exact = chooseExactLocale(requestedLocale, availableLocales);
  if (exact) {
    reasons.push("Requested locale is available.");
    return buildResult(exact, "exact_locale", false, false, reasons);
  }

  const preferred = chooseExactLocale(preferredLocale, availableLocales);
  if (preferred) {
    reasons.push("User preferred locale is available.");
    return buildResult(preferred, "user_preferred_locale", requestedLocale !== preferred, requestedLocale !== preferred, reasons);
  }

  const family = chooseLanguageFamily(requestedLocale || preferredLocale, availableLocales);
  if (family) {
    reasons.push("A locale from the same language family is available.");
    return buildResult(family, "language_family", true, true, reasons);
  }

  const defaultMatch = chooseExactLocale(defaultLocale, availableLocales);
  if (defaultMatch) {
    reasons.push("Default global locale is used because requested content is missing.");
    return buildResult(defaultMatch, "default_global", true, true, reasons);
  }

  const firstAvailable = availableLocales[0];
  if (firstAvailable) {
    reasons.push("First available locale is used to avoid blocking the public page.");
    return buildResult(firstAvailable, "first_available", true, true, reasons);
  }

  reasons.push("No localized content is available, so original content fallback is used.");
  return buildResult(defaultLocale, "original_content", true, true, reasons);
}

export function canRenderPublicPageWithoutExactTranslation() {
  return true;
}

export function shouldBlockPageForMissingTranslation() {
  return false;
}

export function canHideOriginalChatMessage() {
  return false;
}

export function getTranslationDisplayPolicy(surface: TranslationSurface): TranslationDisplayPolicy {
  if (surface === "legal") {
    return {
      surface,
      canUseMachineTranslation: false,
      mustPreserveOriginal: true,
      requiresHumanReview: true,
    };
  }

  if (surface === "chat" || surface === "story" || surface === "exchange") {
    return {
      surface,
      canUseMachineTranslation: true,
      mustPreserveOriginal: true,
      requiresHumanReview: surface !== "chat",
    };
  }

  return {
    surface,
    canUseMachineTranslation: true,
    mustPreserveOriginal: false,
    requiresHumanReview: false,
  };
}

export function normalizeLocaleList(locales: readonly string[]) {
  return Array.from(new Set(locales.map(normalizeLocale).filter(Boolean)));
}

function chooseExactLocale(locale: string, availableLocales: readonly string[]) {
  if (!locale) return null;
  return availableLocales.includes(locale) ? locale : null;
}

function chooseLanguageFamily(locale: string, availableLocales: readonly string[]) {
  const family = getLanguageFamily(locale);
  if (!family) return null;
  return availableLocales.find((availableLocale) => getLanguageFamily(availableLocale) === family) ?? null;
}

function buildResult(
  resolvedLocale: string,
  fallbackMode: LanguageFallbackResult["fallbackMode"],
  shouldShowOriginal: boolean,
  translationNeeded: boolean,
  reasons: string[],
): LanguageFallbackResult {
  return {
    resolvedLocale,
    fallbackMode,
    shouldShowOriginal,
    translationNeeded,
    pageCanRender: true,
    reasons,
  };
}
