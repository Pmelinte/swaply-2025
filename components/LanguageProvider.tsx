'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { Locale } from '@/lib/i18n/config';

interface LangContextType {
  lang: Locale;
  setLang: (lang: Locale) => void;
}

const LangContext = createContext<LangContextType>({
  lang: 'en',
  setLang: () => {},
});

export const useLanguage = () => useContext(LangContext);

export default function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [lang, setLang] = useState<Locale>('en');

  useEffect(() => {
    const loadLang = async () => {
      try {
        const res = await fetch('/api/profile');
        const data = await res.json();

        if (data?.profile?.preferred_language) {
          setLang(data.profile.preferred_language as Locale);
        }
      } catch {
        // fallback rămâne en
      }
    };

    loadLang();
  }, []);

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}
