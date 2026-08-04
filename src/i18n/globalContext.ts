import { defaultLocale, locales, type Locale } from "./config";

const localeSet = new Set<string>(locales);
const ISO_COUNTRY = /^[A-Z]{2}$/;
const ISO_CURRENCY = /^[A-Z]{3}$/;

export function resolveLocale(value: unknown): Locale {
  if (typeof value !== "string") return defaultLocale;

  const normalized = value.trim().toLowerCase().replace(/_/g, "-");
  if (localeSet.has(normalized)) return normalized as Locale;

  const base = normalized.split("-")[0];
  return localeSet.has(base) ? (base as Locale) : defaultLocale;
}

export function resolveLocaleChain(
  ...values: Array<string | null | undefined>
): Locale[] {
  const resolved: Locale[] = [];

  for (const value of values) {
    if (!value) continue;
    const locale = resolveLocale(value);
    if (!resolved.includes(locale)) resolved.push(locale);
  }

  if (!resolved.includes(defaultLocale)) resolved.push(defaultLocale);
  return resolved;
}

export function normalizeCountry(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return ISO_COUNTRY.test(normalized) ? normalized : null;
}

export function normalizeCurrency(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return ISO_CURRENCY.test(normalized) ? normalized : null;
}

export function formatMoney(
  amount: number,
  currency: string,
  locale: string | null | undefined,
): string {
  const canonicalCurrency = normalizeCurrency(currency) ?? "EUR";
  const canonicalLocale = resolveLocale(locale);

  return new Intl.NumberFormat(canonicalLocale, {
    style: "currency",
    currency: canonicalCurrency,
  }).format(amount);
}

export function formatDateTime(
  value: Date | string | number,
  locale: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(resolveLocale(locale), options).format(date);
}

export function buildLocalizedPath(
  locale: string | null | undefined,
  path: string,
): string {
  const canonicalLocale = resolveLocale(locale);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `/${canonicalLocale}${normalizedPath}`;
}
