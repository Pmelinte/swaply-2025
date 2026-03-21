"use client";

import { NextIntlClientProvider, AbstractIntlMessages } from "next-intl";
import { useEffect, useState, ReactNode } from "react";
import { useAppState } from "@/lib/state";
import { type Locale, defaultLocale } from "./config";
import defaultMessages from "../messages/en.json";

/** Dynamically import messages for a locale, fallback to English */
async function loadMessages(locale: string): Promise<AbstractIntlMessages> {
  try {
    return (await import(`../messages/${locale}.json`)).default;
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
