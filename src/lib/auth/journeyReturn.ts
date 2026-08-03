import {sanitizeAuthRedirect} from "./registration";

const LOCALE_PREFIX = /^\/[a-z]{2,3}(?=\/|$)/i;

export function sanitizeJourneyReturn(
  value: string | null | undefined,
  fallback = "/profile",
): string {
  const safe = sanitizeAuthRedirect(value, fallback);
  const withoutLocale = safe.replace(LOCALE_PREFIX, "") || "/";
  return sanitizeAuthRedirect(withoutLocale, fallback);
}

export function buildLocalizedJourneyReturn(
  locale: string,
  value: string | null | undefined,
  fallback = "/profile",
): string {
  const safeLocale = /^[a-z]{2,3}$/i.test(locale) ? locale.toLowerCase() : "en";
  return `/${safeLocale}${sanitizeJourneyReturn(value, fallback)}`;
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
