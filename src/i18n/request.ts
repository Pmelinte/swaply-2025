import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import { defaultLocale, type Locale } from "./config";

/** Deep-merge source into target; target values take precedence. */
function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...source };
  for (const key of Object.keys(target)) {
    const tVal = target[key];
    const sVal = source[key];
    if (
      tVal &&
      sVal &&
      typeof tVal === "object" &&
      typeof sVal === "object" &&
      !Array.isArray(tVal)
    ) {
      result[key] = deepMerge(
        tVal as Record<string, unknown>,
        sVal as Record<string, unknown>,
      );
    } else {
      result[key] = tVal;
    }
  }
  return result;
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale;
  }

  const baseEnglishMessages = (
    await import(`../messages/${defaultLocale}.json`)
  ).default as Record<string, unknown>;
  const batch57EnglishMessages = (
    await import("../messages/batch57.en.json")
  ).default as Record<string, unknown>;
  const enMessages = deepMerge(batch57EnglishMessages, baseEnglishMessages);

  let messages;
  if (locale === defaultLocale) {
    messages = enMessages;
  } else {
    try {
      const localeMessages = (
        await import(`../messages/${locale}.json`)
      ).default as Record<string, unknown>;
      // Merge English as fallback for any missing keys.
      messages = deepMerge(localeMessages, enMessages);
    } catch {
      messages = enMessages;
    }
  }

  return {
    locale,
    messages,
    now: new Date(),
    timeZone: "UTC",
    onError() {
      // Suppress missing message errors.
    },
    getMessageFallback() {
      return "";
    },
  };
});
