"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

const CONSENT_KEY = "swaply_cookie_consent";

export function CookieConsent() {
  const t = useTranslations("legal");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const consent = window.localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      // Reading from localStorage to initialize UI state is a valid pattern
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
    }
  }, []);

  const accept = () => {
    window.localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  };

  const reject = () => {
    window.localStorage.setItem(CONSENT_KEY, "rejected");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-lg rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
      <p className="text-sm text-zinc-700 dark:text-zinc-300">
        {t("cookieBannerText")}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={accept}
          className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {t("cookieAccept")}
        </button>
        <button
          type="button"
          onClick={reject}
          className="rounded-full bg-zinc-200 px-4 py-1.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200"
        >
          {t("cookieReject")}
        </button>
        <Link
          href="/privacy"
          className="text-sm text-blue-600 underline hover:text-blue-700 dark:text-blue-400"
        >
          {t("cookieLearnMore")}
        </Link>
      </div>
    </div>
  );
}
