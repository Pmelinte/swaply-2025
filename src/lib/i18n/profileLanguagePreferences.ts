import { locales, type Locale } from "@/i18n/config";

const supportedLocales = new Set<string>(locales);

function asSupportedLocale(value: unknown): Locale | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return supportedLocales.has(normalized) ? (normalized as Locale) : null;
}

function pushUnique(target: Locale[], value: unknown) {
  const locale = asSupportedLocale(value);
  if (locale && !target.includes(locale)) target.push(locale);
}

/**
 * Reads the canonical profile language columns first, then the historical
 * `languages` array as a compatibility source. The result is always unique,
 * supported by the 43-locale registry and limited to three preferences.
 */
export function resolveProfileLanguages(
  row: Record<string, unknown>,
  fallbackLocale: string = "en",
): Locale[] {
  const resolved: Locale[] = [];

  pushUnique(resolved, row.primary_language);
  pushUnique(resolved, row.secondary_language);
  pushUnique(resolved, row.tertiary_language);

  if (Array.isArray(row.languages)) {
    for (const value of row.languages) pushUnique(resolved, value);
  }

  if (resolved.length === 0) pushUnique(resolved, fallbackLocale);
  if (resolved.length === 0) resolved.push("en");

  return resolved.slice(0, 3);
}

/** Promotes a selected locale to primary while retaining two prior fallbacks. */
export function promoteProfileLanguage(
  selectedLocale: Locale,
  currentLanguages: readonly string[] = [],
): Locale[] {
  const resolved: Locale[] = [selectedLocale];
  for (const value of currentLanguages) pushUnique(resolved, value);
  return resolved.slice(0, 3);
}
