"use client";

import { NextIntlClientProvider, AbstractIntlMessages } from "next-intl";
import { useEffect, useState, ReactNode } from "react";
import { useAppState } from "@/lib/state";
import { type Locale, defaultLocale } from "./config";

/** Dynamically import messages for a locale, fallback to English */
async function loadMessages(locale: string): Promise<AbstractIntlMessages> {
  try {
    return (await import(`../messages/${locale}.json`)).default;
  } catch {
    return (await import(`../messages/en.json`)).default;
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const { language } = useAppState();
  const locale = (language ?? defaultLocale) as Locale;
  const [messages, setMessages] = useState<AbstractIntlMessages | null>(null);
  const [activeLocale, setActiveLocale] = useState(locale);

  useEffect(() => {
    let cancelled = false;
    loadMessages(locale).then((msgs) => {
      if (!cancelled) {
        setMessages(msgs);
        setActiveLocale(locale);
      }
    });
    return () => { cancelled = true; };
  }, [locale]);

  // Show nothing while first messages load (very brief)
  if (!messages) return null;

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
