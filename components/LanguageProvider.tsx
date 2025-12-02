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
    const mod = await import(`@/l
