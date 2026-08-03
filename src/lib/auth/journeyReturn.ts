import { defaultLocale, locales, type Locale } from "@/i18n/config";
import { sanitizeAuthRedirect } from "./registration";

const localeSet = new Set<string>(locales);

function splitPathSegments(value: string): string[] {
  return value.split("/");
}

function stripConfiguredLocalePrefix(value: string): string {
  const segments = splitPathSegments(value);
  const firstSegment = segments[1]?.toLowerCase();

  if (!firstSegment || !localeSet.has(firstSegment)) {
    return value;
  }

  const withoutLocale = `/${segments.slice(2).join("/")}`;
  return withoutLocale === "/" ? "/" : withoutLocale;
}

function resolveLocale(locale: string): Locale {
  const normalized = locale.toLowerCase();
  return localeSet.has(normalized) ? (normalized as Locale) : defaultLocale;
}

export function sanitizeJourneyReturn(
  value: string | null | undefined,
  fallback = "/profile",
): string {
  const safe = sanitizeAuthRedirect(value, fallback);
  const withoutLocale = stripConfiguredLocalePrefix(safe);
  return sanitizeAuthRedirect(withoutLocale, fallback);
}

export function buildLocalizedJourneyReturn(
  locale: string,
  value: string | null | undefined,
  fallback = "/profile",
): string {
  return `/${resolveLocale(locale)}${sanitizeJourneyReturn(value, fallback)}`;
}

export function buildOAuthCallbackUrl(
  origin: string,
  locale: string,
  value: string | null | undefined,
): string {
  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("next", buildLocalizedJourneyReturn(locale, value));
  return callback.toString();
}
