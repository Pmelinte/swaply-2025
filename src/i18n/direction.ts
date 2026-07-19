import type { Locale } from "./config";

export type TextDirection = "ltr" | "rtl";

export const rtlLocales = ["ar", "fa", "yi"] as const satisfies readonly Locale[];

const rtlLocaleSet = new Set<Locale>(rtlLocales);

export function getLocaleDirection(locale: Locale): TextDirection {
  return rtlLocaleSet.has(locale) ? "rtl" : "ltr";
}
