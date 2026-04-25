"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const t = useTranslations("pwa");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // Snapshot whether a *previous* SW is currently controlling the page.
      // If one was, we want the new SW to take over before the page keeps
      // reading anything from cache — so we listen for controllerchange and
      // reload exactly once when control flips. The `reloaded` guard keeps
      // this from looping during ordinary first-install.
      const hadOldController = !!navigator.serviceWorker.controller;
      let reloaded = false;
      const onControllerChange = () => {
        if (!hadOldController || reloaded) return;
        reloaded = true;
        window.location.reload();
      };
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        onControllerChange,
      );

      navigator.serviceWorker
        .register("/sw.js")
        .then(async (registration) => {
          // If a fresh worker is already waiting (previous tab installed it),
          // tell it to skip waiting so it activates and claims this page now.
          if (registration.waiting) {
            registration.waiting.postMessage({ type: "SKIP_WAITING" });
          }
          // Wait until the SW is fully active before this page relies on
          // any cache lookups it will perform.
          if (!navigator.serviceWorker.controller) {
            await navigator.serviceWorker.ready;
          }
        })
        .catch(() => {});
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-sm animate-fade-in rounded-2xl border border-blue-200 bg-white p-4 shadow-lg dark:border-blue-800 dark:bg-zinc-900">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">
          S
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {t("installSwaply")}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t("installDescription")}
          </p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => void handleInstall()}
          className="flex-1 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {t("install")}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded-full border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
        >
          {t("notNow")}
        </button>
      </div>
    </div>
  );
}
