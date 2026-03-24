"use client";

import { NextIntlClientProvider, AbstractIntlMessages } from "next-intl";
import { useEffect, useState, ReactNode } from "react";
import { useAppState } from "@/lib/state";
import { type Locale, defaultLocale } from "./config";
import defaultMessages from "../messages/en.json";

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

/** Dynamically import messages for a locale, deep-merged with English fallback */
async function loadMessages(locale: string): Promise<AbstractIntlMessages> {
  try {
    const localeMessages = (await import(`../messages/${locale}.json`)).default;
    return deepMerge(localeMessages, defaultMessages as Record<string, unknown>) as AbstractIntlMessages;
  } catch {
    return defaultMessages;
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const { language } = useAppState();
  const locale = (language ?? defaultLocale) as Locale;
  const [messages, setMessages] = useState<AbstractIntlMessages>(defaultMessages);
  const [activeLocale, setActiveLocale] = useState<Locale>(defaultLocale);

  useEffect(() => {
    let cancelled = false;
    // Default locale is statically imported — resolve immediately via microtask
    const promise = locale === defaultLocale
      ? Promise.resolve(defaultMessages)
      : loadMessages(locale);
    promise.then((msgs) => {
      if (!cancelled) {
        setMessages(msgs);
        setActiveLocale(locale);
      }
    });
    return () => { cancelled = true; };
  }, [locale]);

  return (
    <NextIntlClientProvider
      locale={activeLocale}
      messages={messages}
      onError={() => {}}
      getMessageFallback={({ key }) => key}
    >
      {children}
    </NextIntlClientProvider>
  );
}
