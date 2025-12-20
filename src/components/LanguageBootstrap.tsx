"use client";

import { useEffect } from "react";
import { useLanguage } from "@/components/LanguageProvider";

export default function LanguageBootstrap() {
  const { setLang } = useLanguage();

  useEffect(() => {
    const stored = window.localStorage.getItem("swaply_language");
    if (stored) {
      setLang(stored);
      return;
    }

    const browserLang = navigator.language?.slice(0, 2);
    if (browserLang) {
      setLang(browserLang);
    }
  }, [setLang]);

  return null;
}
