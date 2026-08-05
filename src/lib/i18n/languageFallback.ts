import { defaultLocale, locales, type Locale } from "@/i18n/config";

const localeSet = new Set<string>(locales);

const COUNTRY_LOCALE_MAP: Record<string, Locale> = {
  ae: "ar",
  ar: "es",
  at: "de",
  au: "en",
  bd: "bn",
  be: "nl",
  bg: "bg",
  br: "pt",
  ca: "en",
  ch: "de",
  cn: "zh",
  cz: "cs",
  de: "de",
  dk: "da",
  ee: "et",
  eg: "ar",
  es: "es",
  fi: "fi",
  fr: "fr",
  gb: "en",
  gr: "el",
  hr: "hr",
  hu: "hu",
  id: "id",
  ie: "ga",
  il: "yi",
  in: "hi",
  ir: "fa",
  it: "it",
  jp: "ja",
  kr: "ko",
  lt: "lt",
  lv: "lv",
  mn: "mn",
  mt: "mt",
  my: "ms",
  nl: "nl",
  no: "no",
  ph: "fil",
  pl: "pl",
  pt: "pt",
  ro: "ro",
  rs: "sr",
  ru: "ru",
  sa: "ar",
  se: "sv",
  si: "sl",
  sk: "sk",
  th: "th",
  tr: "tr",
  ua: "uk",
  uk: "en",
  us: "en",
  vn: "vi",
};

export type LanguagePreferenceSource =
  | "primary_language"
  | "secondary_language"
  | "tertiary_language"
  | "route_locale"
  | "browser_locale"
  | "region_locale"
  | "source_locale"
  | "technical_fallback";

export interface LanguageFallbackEntry {
  locale: Locale;
  source: LanguagePreferenceSource;
}

export interface LoggedInLanguageFallbackInput {
  primaryLanguage?: string | null;
  secondaryLanguage?: string | null;
  tertiaryLanguage?: string | null;
  browserLocale?: string | null;
  routeLocale?: string | null;
  sourceLocale?: string | null;
}

export interface LoggedOutLanguageFallbackInput {
  routeLocale?: string | null;
  browserLocale?: string | null;
  regionCountryCode?: string | null;
  sourceLocale?: string | null;
}

export interface ProfileLanguageFallbackRow {
  primary_language?: string | null;
  secondary_language?: string | null;
  tertiary_language?: string | null;
  preferred_locale?: string | null;
  preferred_language?: string | null;
}

export interface ProfileLanguageFallbackContext {
  browserLocale?: string | null;
  routeLocale?: string | null;
  sourceLocale?: string | null;
}

function normalizeLocale(value?: string | null): Locale | null {
  if (!value) return null;

  const normalized = value.trim().toLowerCase().replace(/_/g, "-");
  if (!normalized) return null;

  if (localeSet.has(normalized)) {
    return normalized as Locale;
  }

  const base = normalized.split("-")[0];
  if (localeSet.has(base)) {
    return base as Locale;
  }

  return null;
}

function firstValidLocale(
  ...values: Array<string | null | undefined>
): Locale | null {
  for (const value of values) {
    const locale = normalizeLocale(value);
    if (locale) return locale;
  }

  return null;
}

function localeFromCountry(countryCode?: string | null): Locale | null {
  if (!countryCode) return null;
  return COUNTRY_LOCALE_MAP[countryCode.trim().toLowerCase()] ?? null;
}

function appendUnique(
  entries: LanguageFallbackEntry[],
  locale: Locale | null,
  source: LanguagePreferenceSource,
) {
  if (!locale) return;
  if (entries.some((entry) => entry.locale === locale)) return;
  entries.push({ locale, source });
}

export function parseAcceptLanguageHeader(header?: string | null): Locale[] {
  if (!header) return [];

  return header
    .split(",")
    .map((part) => {
      const [rawLocale, ...params] = part.trim().split(";");
      const qParam = params.find((param) => param.trim().startsWith("q="));
      const q = qParam ? Number.parseFloat(qParam.trim().slice(2)) : 1;
      return {
        locale: normalizeLocale(rawLocale),
        q: Number.isFinite(q) ? q : 0,
      };
    })
    .filter((entry): entry is { locale: Locale; q: number } => Boolean(entry.locale))
    .sort((a, b) => b.q - a.q)
    .map((entry) => entry.locale)
    .filter((locale, index, all) => all.indexOf(locale) === index);
}

export function buildLoggedInLanguageFallbackChain(
  input: LoggedInLanguageFallbackInput,
): LanguageFallbackEntry[] {
  const entries: LanguageFallbackEntry[] = [];

  appendUnique(entries, normalizeLocale(input.primaryLanguage), "primary_language");
  appendUnique(entries, normalizeLocale(input.secondaryLanguage), "secondary_language");
  appendUnique(entries, normalizeLocale(input.tertiaryLanguage), "tertiary_language");
  appendUnique(entries, normalizeLocale(input.browserLocale), "browser_locale");
  appendUnique(entries, normalizeLocale(input.routeLocale), "route_locale");
  appendUnique(entries, normalizeLocale(input.sourceLocale), "source_locale");
  appendUnique(entries, defaultLocale, "technical_fallback");

  return entries;
}

/**
 * Builds the canonical logged-in fallback chain directly from a persisted
 * profile row. Historical preferred fields are compatibility inputs only and
 * never outrank valid canonical language columns.
 */
export function buildProfileLanguageFallbackChain(
  row: ProfileLanguageFallbackRow,
  context: ProfileLanguageFallbackContext = {},
): LanguageFallbackEntry[] {
  return buildLoggedInLanguageFallbackChain({
    primaryLanguage: firstValidLocale(
      row.primary_language,
      row.preferred_language,
    ),
    secondaryLanguage: row.secondary_language,
    tertiaryLanguage: row.tertiary_language,
    browserLocale: context.browserLocale,
    routeLocale: firstValidLocale(context.routeLocale, row.preferred_locale),
    sourceLocale: context.sourceLocale,
  });
}

export function resolveProfilePreferredLocale(
  row: ProfileLanguageFallbackRow,
  context: ProfileLanguageFallbackContext = {},
): Locale {
  return buildProfileLanguageFallbackChain(row, context)[0]?.locale ?? defaultLocale;
}

export function buildLoggedOutLanguageFallbackChain(
  input: LoggedOutLanguageFallbackInput,
): LanguageFallbackEntry[] {
  const entries: LanguageFallbackEntry[] = [];

  appendUnique(entries, normalizeLocale(input.routeLocale), "route_locale");
  appendUnique(entries, normalizeLocale(input.browserLocale), "browser_locale");
  appendUnique(entries, localeFromCountry(input.regionCountryCode), "region_locale");
  appendUnique(entries, normalizeLocale(input.sourceLocale), "source_locale");
  appendUnique(entries, defaultLocale, "technical_fallback");

  return entries;
}

export function toLocaleList(entries: LanguageFallbackEntry[]): Locale[] {
  return entries.map((entry) => entry.locale);
}

export function pickLocalizedValue<T>(
  localizedValues: Partial<Record<Locale, T>>,
  fallbackChain: LanguageFallbackEntry[],
): T | undefined {
  for (const entry of fallbackChain) {
    const value = localizedValues[entry.locale];
    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return undefined;
}
