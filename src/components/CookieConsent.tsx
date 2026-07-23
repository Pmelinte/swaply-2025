"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

type ConsentValue = "accepted" | "rejected" | null;

const STORAGE_KEY = "cookie_consent";

export function useCookieConsent(): ConsentValue {
  return useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      return () => window.removeEventListener("storage", onStoreChange);
    },
    () => (localStorage.getItem(STORAGE_KEY) as ConsentValue) ?? null,
    () => null,
  );
}

function useCookieConsentVisible(): boolean {
  const consent = useCookieConsent();
  return consent === null;
}

export function CookieConsent() {
  const t = useTranslations("cookieConsent");
  const visible = useCookieConsentVisible();

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    window.dispatchEvent(new Event("storage"));
  }

  function reject() {
    localStorage.setItem(STORAGE_KEY, "rejected");
    window.dispatchEvent(new Event("storage"));
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 px-4 py-4 shadow-lg backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 sm:flex-row sm:gap-4">
        <p className="flex-1 text-sm text-zinc-600 dark:text-zinc-300">
          {t("message")}
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={reject}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            {t("reject")}
          </button>
          <button
            type="button"
            onClick={accept}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CookieSettingsLink() {
  const t = useTranslations("cookieConsent");

  function openSettings() {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("storage"));
    window.location.reload();
  }

  return (
    <button
      type="button"
      onClick={openSettings}
      className="hover:text-blue-600 hover:underline dark:hover:text-blue-400"
    >
      {t("settings")}
    </button>
  );
}
