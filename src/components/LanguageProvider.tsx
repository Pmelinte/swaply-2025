"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type Dict = Record<string, string>;

type I18nContextValue = {
  lang: string;
  setLang: (lang: string) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

// Dicționar minim ca să nu crape UI-ul.
// Îl extinzi ulterior (sau îl încarci din fișiere JSON).
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
    "profile.language": "Limbă"
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
    "profile.language": "Language"
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
    // fallback safe: nu sparge build-ul nici dacă providerul lipsește
    return { t: (k: string) => k, lang: "ro", setLang: (_: string) => {} };
  }
  return ctx;
}

// Compatibilitate: unele fișiere importă default useTranslation
export default function useTranslationDefault() {
  return useTranslation();
}
