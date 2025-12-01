'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { Locale } from '@/lib/i18n/config';

type TranslationDict = Record<string, string>;

interface LangContextType {
  lang: Locale;
  setLang: (lang: Locale) => void;
  t: (key: string) => string;
}

const LangContext = createContext<LangContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => key,
});

export const useLanguage = () => useContext(LangContext);

export const useTranslation = () => {
  const { t, lang } = useLanguage();
  return { t, lang };
};

async function loadTranslations(locale: Locale): Promise<TranslationDict> {
  try {
    const mod = await import(`@/lib/i18n/translations/${locale}.json`);
    return (mod as any).default as TranslationDict;
  } catch {
    return {};
  }
}

export default function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [lang, setLang] = useState<Locale>('en');
  const [dict, setDict] = useState<TranslationDict>({});

  // încarcă limba din profil
  useEffect(() => {
    const loadLangFromProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        const data = await res.json();

        if (data?.profile?.preferred_language) {
          setLang(data.profile.preferred_language as Locale);
        }
      } catch {
        // lăsăm en ca fallback
      }
    };

    loadLangFromProfile();
  }, []);

  // încarcă dicționarul când se schimbă limba
  useEffect(() => {
    const load = async () => {
      const translations = await loadTranslations(lang);
      setDict(translations);
    };

    load();
  }, [lang]);

  const t = (key: string) => {
    return dict[key] ?? key;
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}
