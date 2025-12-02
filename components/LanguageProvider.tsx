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
  const [lang, setLangState] = useState<Locale>('en');
  const [dict, setDict] = useState<TranslationDict>({});

  // 1. Citește limba salvată în localStorage
  useEffect(() => {
    const stored = window.localStorage.getItem('preferred_language') as Locale | null;
    if (stored) {
      setLangState(stored);
    }
  }, []);

  // 2. Citește limba din profil (dacă există)
  useEffect(() => {
    const loadLangFromProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        const data = await res.json();

        if (data?.profile?.preferred_language) {
          const profileLang = data.profile.preferred_language as Locale;

          // dacă nu avem localStorage, o preluăm din profil
          if (!window.localStorage.getItem('preferred_language')) {
            setLangState(profileLang);
            window.localStorage.setItem('preferred_language', profileLang);
          }
        }
      } catch {
        // ignorăm erorile
      }
    };

    loadLangFromProfile();
  }, []);

  // 3. Încarcă traducerile pentru limba curentă
  useEffect(() => {
    loadTranslations(lang).then(setDict);
  }, [lang]);

  // 4. Setăm limba global + persistăm în localStorage
  const setLang = (value: Locale) => {
    setLangState(value);
    window.localStorage.setItem('preferred_language', value);
  };

  const t = (key: string) => dict[key] ?? key;

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}
