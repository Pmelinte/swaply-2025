"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type Dict = Record<string, string>;

type I18nContextValue = {
  lang: string;
  setLang: (lang: string) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const DICTS: Record<string, Dict> = {
  ro: {
    "common.loading": "Se încarcă…",
    "common.error": "Eroare",
    "dashboard.title": "Dashboard",
    "dashboard.subtitle": "Prezentare generală",
    "dashboard.goToItems": "Vezi obiecte",
    "dashboard.addItem": "Adaugă obiect",
    "dashboard.profileSettings": "Setări profil",
    "profile.title": "Profil",
    "profile.subtitle": "Datele tale",
    "profile.name": "Nume",
    "profile.location": "Locație",
    "profile.language": "Limbă",
    en: "Engleză",
    ro: "Română"
  },
  en: {
    "common.loading": "Loading…",
    "common.error": "Error",
    "dashboard.title": "Dashboard",
    "dashboard.subtitle": "Overview",
    "dashboard.goToItems": "View items",
    "dashboard.addItem": "Add item",
    "dashboard.profileSettings": "Profile settings",
    "profile.title": "Profile",
    "profile.subtitle": "Your details",
    "profile.name": "Name",
    "profile.location": "Location",
    "profile.language": "Language",
    en: "English",
    ro: "Romanian"
  }
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

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return { t: (k: string) => k, lang: "ro", setLang: (_: string) => {} };
  }
  return ctx;
}

/**
 * Compat: unele componente folosesc useLanguage().
 * Îl expunem ca alias către același context.
 */
export function useLanguage() {
  const { lang, setLang } = useTranslation();
  return { lang, setLang };
}

// Compat: unele fișiere importă default useTranslation
export default function useTranslationDefault() {
  return useTranslation();
}
