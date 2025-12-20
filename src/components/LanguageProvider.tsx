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
    ro: "Română",
    fr: "Franceză",
    es: "Spaniolă",
    de: "Germană",
    "preferred_language": "Limbă preferată"
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
    ro: "Romanian",
    fr: "French",
    es: "Spanish",
    de: "German",
    "preferred_language": "Preferred language"
  },
  fr: {
    "common.loading": "Chargement…",
    "common.error": "Erreur",
    "dashboard.title": "Tableau de bord",
    "dashboard.subtitle": "Aperçu",
    "dashboard.goToItems": "Voir les objets",
    "dashboard.addItem": "Ajouter un objet",
    "dashboard.profileSettings": "Paramètres du profil",
    "profile.title": "Profil",
    "profile.subtitle": "Vos informations",
    "profile.name": "Nom",
    "profile.location": "Localisation",
    "profile.language": "Langue",
    en: "Anglais",
    ro: "Roumain",
    fr: "Français",
    es: "Espagnol",
    de: "Allemand",
    "preferred_language": "Langue préférée"
  },
  es: {
    "common.loading": "Cargando…",
    "common.error": "Error",
    "dashboard.title": "Panel",
    "dashboard.subtitle": "Resumen",
    "dashboard.goToItems": "Ver objetos",
    "dashboard.addItem": "Añadir objeto",
    "dashboard.profileSettings": "Configuración de perfil",
    "profile.title": "Perfil",
    "profile.subtitle": "Tus datos",
    "profile.name": "Nombre",
    "profile.location": "Ubicación",
    "profile.language": "Idioma",
    en: "Inglés",
    ro: "Rumano",
    fr: "Francés",
    es: "Español",
    de: "Alemán",
    "preferred_language": "Idioma preferido"
  },
  de: {
    "common.loading": "Wird geladen…",
    "common.error": "Fehler",
    "dashboard.title": "Dashboard",
    "dashboard.subtitle": "Übersicht",
    "dashboard.goToItems": "Artikel ansehen",
    "dashboard.addItem": "Artikel hinzufügen",
    "dashboard.profileSettings": "Profileinstellungen",
    "profile.title": "Profil",
    "profile.subtitle": "Ihre Angaben",
    "profile.name": "Name",
    "profile.location": "Standort",
    "profile.language": "Sprache",
    en: "Englisch",
    ro: "Rumänisch",
    fr: "Französisch",
    es: "Spanisch",
    de: "Deutsch",
    "preferred_language": "Bevorzugte Sprache"
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
      setLang: (nextLang: string) => {
        setLang(nextLang);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("swaply_language", nextLang);
        }
      },
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
