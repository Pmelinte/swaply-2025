"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import ro from "@/lib/i18n/translations/ro.json";
import en from "@/lib/i18n/translations/en.json";
import fr from "@/lib/i18n/translations/fr.json";
import es from "@/lib/i18n/translations/es.json";
import de from "@/lib/i18n/translations/de.json";

type Dict = Record<string, string>;

type I18nContextValue = {
  lang: string;
  setLang: (lang: string) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const DICTS: Record<string, Dict> = {
  ro: ro as Dict,
  en: en as Dict,
  fr: fr as Dict,
  es: es as Dict,
  de: de as Dict,
};

export function LanguageProvider({
  children,
  initialLang = "ro"
}: {
  children: React.ReactNode;
  initialLang?: string;
}) {
  const [lang, setLang] = useState(initialLang);

  const value = useMemo<I18nContextValue>(() => {
    const dict = DICTS[lang] ?? DICTS.ro;

    return {
      lang,
      setLang,
      t: (key: string) => dict[key] ?? key
    };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      lang: "ro",
      setLang: (_: string) => {},
      t: (k: string) => k
    };
  }
  return ctx;
}

/**
 * Compat: unele componente folosesc useLanguage().
 * Îl expunem ca alias complet către același context (include și t).
 */
export function useLanguage(): I18nContextValue {
  return useTranslation();
}

// Compat: unele fișiere importă default useTranslation
export default function useTranslationDefault() {
  return useTranslation();
}
