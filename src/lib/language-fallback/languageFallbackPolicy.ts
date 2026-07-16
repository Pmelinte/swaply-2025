import type {
  LanguageFallbackMode,
  LanguageFallbackRequest,
  LanguageFallbackResult,
  TranslationDisplayPolicy,
  TranslationSurface,
} from "./languageFallbackTypes";
import { GLOBAL_DEFAULT_LOCALE } from "./languageFallbackTypes";

interface FallbackCandidate {
  locale: string;
  exactMode: LanguageFallbackMode;
  label: string;
}

export function normalizeLocale(locale?: string | null) {
  return locale?.trim().replace("_", "-").toLowerCase() ?? "";
}

export function getLanguageFamily(locale?: string | null) {
  return normalizeLocale(locale).split("-")[0] ?? "";
}

export function resolveLanguageFallback(request: LanguageFallbackRequest): LanguageFallbackResult {
  const availableLocales = normalizeLocaleList(request.availableLocales);
  const defaultLocale = normalizeLocale(request.defaultLocale) || GLOBAL_DEFAULT_LOCALE;
  const reasons: string[] = [];
  const attemptedLocales: string[] = [];

  const primaryLocale = normalizeLocale(request.primaryLocale ?? request.userPreferredLocale);
  const hasCanonicalProfilePreference = Boolean(request.primaryLocale);
  const routeLocale = normalizeLocale(request.routeLocale ?? request.requestedLocale);

  const candidates: FallbackCandidate[] = [
    ...(primaryLocale
      ? [{
          locale: primaryLocale,
          exactMode: hasCanonicalProfilePreference ? "user_primary" as const : "user_preferred_locale" as const,
          label: hasCanonicalProfilePreference ? "User primary locale" : "Legacy user preferred locale",
        }]
      : []),
    ...(request.secondaryLocale
      ? [{
          locale: normalizeLocale(request.secondaryLocale),
          exactMode: "user_secondary" as const,
          label: "User secondary locale",
        }]
      : []),
    ...(request.tertiaryLocale
      ? [{
          locale: normalizeLocale(request.tertiaryLocale),
          exactMode: "user_tertiary" as const,
          label: "User tertiary locale",
        }]
      : []),
    ...(routeLocale
      ? [{
          locale: routeLocale,
          exactMode: request.routeLocale ? "route_locale" as const : "exact_locale" as const,
          label: request.routeLocale ? "Route locale" : "Requested locale",
        }]
      : []),
    ...(request.browserLocale
      ? [{
          locale: normalizeLocale(request.browserLocale),
          exactMode: "browser_locale" as const,
          label: "Browser locale",
        }]
      : []),
    ...(request.sourceLocale
      ? [{
          locale: normalizeLocale(request.sourceLocale),
          exactMode: "source_locale" as const,
          label: "Source locale",
        }]
      : []),
  ];

  const uniqueCandidates = dedupeCandidates(candidates);

  for (const candidate of uniqueCandidates) {
    attemptedLocales.push(candidate.locale);

    const exact = chooseExactLocale(candidate.locale, availableLocales);
    if (exact) {
      reasons.push(`${candidate.label} is available.`);
      return buildResult({
        resolvedLocale: exact,
        fallbackMode: candidate.exactMode,
        desiredLocale: primaryLocale || routeLocale || candidate.locale,
        sourceLocale: normalizeLocale(request.sourceLocale),
        reasons,
        attemptedLocales,
      });
    }

    const family = chooseLanguageFamily(candidate.locale, availableLocales);
    if (family) {
      reasons.push(`${candidate.label} is unavailable; a locale from the same language family is available.`);
      return buildResult({
        resolvedLocale: family,
        fallbackMode: "language_family",
        desiredLocale: primaryLocale || routeLocale || candidate.locale,
        sourceLocale: normalizeLocale(request.sourceLocale),
        reasons,
        attemptedLocales,
      });
    }
  }

  if (!attemptedLocales.includes(defaultLocale)) {
    attemptedLocales.push(defaultLocale);
  }

  const defaultMatch = chooseExactLocale(defaultLocale, availableLocales);
  if (defaultMatch) {
    reasons.push("Default global locale is used only after the user, route, browser and source chain is exhausted.");
    return buildResult({
      resolvedLocale: defaultMatch,
      fallbackMode: "default_global",
      desiredLocale: primaryLocale || routeLocale || defaultLocale,
      sourceLocale: normalizeLocale(request.sourceLocale),
      reasons,
      attemptedLocales,
    });
  }

  const firstAvailable = availableLocales[0];
  if (firstAvailable) {
    reasons.push("First available locale is used to avoid blocking the page after the canonical chain is exhausted.");
    return buildResult({
      resolvedLocale: firstAvailable,
      fallbackMode: "first_available",
      desiredLocale: primaryLocale || routeLocale || defaultLocale,
      sourceLocale: normalizeLocale(request.sourceLocale),
      reasons,
      attemptedLocales,
    });
  }

  reasons.push("No localized content is available, so the original-content technical fallback is used.");
  return buildResult({
    resolvedLocale: normalizeLocale(request.sourceLocale) || defaultLocale,
    fallbackMode: "original_content",
    desiredLocale: primaryLocale || routeLocale || defaultLocale,
    sourceLocale: normalizeLocale(request.sourceLocale),
    reasons,
    attemptedLocales,
  });
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

function dedupeCandidates(candidates: readonly FallbackCandidate[]) {
  const seen = new Set<string>();
  const result: FallbackCandidate[] = [];

  for (const candidate of candidates) {
    if (!candidate.locale || seen.has(candidate.locale)) continue;
    seen.add(candidate.locale);
    result.push(candidate);
  }

  return result;
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

function buildResult({
  resolvedLocale,
  fallbackMode,
  desiredLocale,
  sourceLocale,
  reasons,
  attemptedLocales,
}: {
  resolvedLocale: string;
  fallbackMode: LanguageFallbackResult["fallbackMode"];
  desiredLocale: string;
  sourceLocale: string;
  reasons: string[];
  attemptedLocales: string[];
}): LanguageFallbackResult {
  const translationNeeded = Boolean(desiredLocale && resolvedLocale !== desiredLocale);
  const shouldShowOriginal = translationNeeded || Boolean(sourceLocale && sourceLocale !== resolvedLocale);

  return {
    resolvedLocale,
    fallbackMode,
    shouldShowOriginal,
    translationNeeded,
    pageCanRender: true,
    reasons,
    attemptedLocales,
  };
}
