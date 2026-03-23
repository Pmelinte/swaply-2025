import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import { defaultLocale, type Locale } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale;
  }

  let messages;
  try {
    messages = (await import(`../messages/${locale}.json`)).default;
  } catch {
    messages = (await import(`../messages/${defaultLocale}.json`)).default;
  }

  return {
    locale,
    messages,
    onError() {
      // Suppress missing message errors — fall back to key
    },
    getMessageFallback({ key }) {
      return key;
    },
  };
});
