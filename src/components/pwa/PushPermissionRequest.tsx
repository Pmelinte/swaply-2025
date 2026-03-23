"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Bell, BellOff, X } from "lucide-react";
import { useAppState } from "@/lib/state";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type PushState = "prompt" | "granted" | "denied" | "unsupported";

export function PushPermissionRequest() {
  const t = useTranslations("push");
  const { user } = useAppState();
  const [pushState, setPushState] = useState<PushState>("unsupported");
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  const autoSubscribe = useCallback(async () => {
    if (!user?.id || !VAPID_PUBLIC_KEY) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      const subJson = subscription.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: {
            endpoint: subJson.endpoint,
            keys: subJson.keys,
          },
        }),
      });
    } catch {
      // Silently fail — user may have revoked permission
    }
  }, [user]);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !VAPID_PUBLIC_KEY) {
      return;
    }

    const permission = Notification.permission;
    if (permission === "granted") {
      setTimeout(() => {
        setPushState("granted");
        void autoSubscribe();
      }, 0);
    } else if (permission === "denied") {
      setTimeout(() => setPushState("denied"), 0);
    } else {
      setTimeout(() => setPushState("prompt"), 0);
    }

    if (sessionStorage.getItem("swaply-push-dismissed")) {
      setTimeout(() => setDismissed(true), 0);
    }
  }, [autoSubscribe]);

  const requestPermission = useCallback(async () => {
    if (!VAPID_PUBLIC_KEY) return;
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setPushState("granted");
        await autoSubscribe();
      } else {
        setPushState(permission === "denied" ? "denied" : "prompt");
      }
    } catch {
      setPushState("denied");
    }
    setLoading(false);
  }, [autoSubscribe]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    sessionStorage.setItem("swaply-push-dismissed", "1");
  }, []);

  // Don't show if: not logged in, already granted, denied, unsupported, or dismissed
  if (!user?.id || pushState !== "prompt" || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 z-40 max-w-sm animate-in slide-in-from-bottom-4 sm:left-6">
      <div className="rounded-2xl border border-blue-200 bg-white p-4 shadow-lg dark:border-blue-800 dark:bg-zinc-900">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40">
            <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {t("enableTitle")}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {t("enableDescription")}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={requestPermission}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                <Bell className="h-3.5 w-3.5" />
                {loading ? t("activating") : t("activate")}
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <BellOff className="h-3.5 w-3.5" />
                {t("notNow")}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-zinc-300 hover:text-zinc-500 dark:text-zinc-600 dark:hover:text-zinc-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
