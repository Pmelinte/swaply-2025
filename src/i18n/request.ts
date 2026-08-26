import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import { defaultLocale, type Locale } from "./config";
import { getBatch57Messages } from "./batch57-locales";
import { applyLegacyI18nAliases } from "./runtime-compat";

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

  const resolvedLocale = locale as Locale;
  const baseEnglishMessages = (
    await import(`../messages/${defaultLocale}.json`)
  ).default as Record<string, unknown>;
  const batch57EnglishMessages = (
    await import("./fragments/batch57.en.json")
  ).default as Record<string, unknown>;
  const enMessages = deepMerge(batch57EnglishMessages, baseEnglishMessages);

  let messages: Record<string, unknown>;
  if (resolvedLocale === defaultLocale) {
    messages = enMessages;
  } else {
    try {
      const rawLocaleMessages = (
        await import(`../messages/${resolvedLocale}.json`)
      ).default as Record<string, unknown>;
      const localeMessages = applyLegacyI18nAliases(rawLocaleMessages);
      const localizedBatch57 = getBatch57Messages(
        resolvedLocale,
        batch57EnglishMessages,
      );
      const nativeMessages = deepMerge(localizedBatch57, localeMessages);

      // English remains the final technical safety net. The i18n contract tests
      // verify that targeted global-core surfaces resolve natively before this
      // fallback is needed.
      messages = deepMerge(nativeMessages, enMessages);
    } catch {
      messages = enMessages;
    }
  }

  return {
    locale: resolvedLocale,
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
