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

  const enMessages = (await import(`../messages/${defaultLocale}.json`))
    .default;

  let messages;
  if (locale === defaultLocale) {
    messages = enMessages;
  } else {
    try {
      const localeMessages = (await import(`../messages/${locale}.json`))
        .default;
      // Merge English as fallback for any missing keys
      messages = deepMerge(localeMessages, enMessages);
    } catch {
      messages = enMessages;
    }
  }

  return {
    locale,
    messages,
    onError() {
      // Suppress missing message errors
    },
    getMessageFallback({ key }) {
      return key;
    },
  };
});
