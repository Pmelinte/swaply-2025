/**
 * RTL (Right-to-Left) support for Arabic, Persian, and Hebrew locales.
 * Provides utilities for detecting RTL languages and applying direction.
 */

const RTL_LOCALES = new Set(["ar", "fa", "he", "ur"]);

/**
 * Check if a locale requires RTL text direction.
 */
export function isRtlLocale(locale: string): boolean {
  return RTL_LOCALES.has(locale);
}

/**
 * Get the text direction for a locale.
 */
export function getTextDirection(locale: string): "ltr" | "rtl" {
  return isRtlLocale(locale) ? "rtl" : "ltr";
}

/**
 * Get CSS class names for RTL support.
 * Returns Tailwind-compatible classes.
 */
export function getRtlClasses(locale: string): string {
  if (!isRtlLocale(locale)) return "";
  return "rtl";
}

/**
 * Mirror a CSS property value for RTL layouts.
 * e.g., "left" → "right", "ml-4" → "mr-4"
 */
export function mirrorForRtl(
  value: string,
  locale: string,
): string {
  if (!isRtlLocale(locale)) return value;

  return value
    .replace(/\bleft\b/g, "__RTL_RIGHT__")
    .replace(/\bright\b/g, "left")
    .replace(/__RTL_RIGHT__/g, "right")
    .replace(/\bml-/g, "__RTL_MR__")
    .replace(/\bmr-/g, "ml-")
    .replace(/__RTL_MR__/g, "mr-")
    .replace(/\bpl-/g, "__RTL_PR__")
    .replace(/\bpr-/g, "pl-")
    .replace(/__RTL_PR__/g, "pr-");
}
