"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { X, ArrowRight } from "lucide-react";

/**
 * Sticky top banner shown only to settled, non-authenticated visitors.
 * Dismissable — state persisted in sessionStorage so it doesn't
 * re-appear during the same browser session.
 */
export function GuestBanner() {
  const { user, loading } = useAppState();
  const t = useTranslations("guest");

  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("swaply_guest_banner_dismissed") === "1";
  });

  // Do not render a transient guest state while an authenticated session
  // is still being restored. This prevents the banner from appearing and
  // disappearing during hydration, which would shift the whole page.
  if (loading.auth || user || dismissed) return null;

  return (
    <div className="sticky top-0 z-40 flex items-center justify-center gap-3 bg-blue-600 px-4 py-2 text-sm text-white shadow-sm">
      <span className="text-center">
        {t("bannerText")}
      </span>
      <Link
        href="/register"
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
      >
        {t("bannerCta")}
        <ArrowRight className="h-3 w-3" />
      </Link>
      <button
        type="button"
        onClick={() => {
          setDismissed(true);
          sessionStorage.setItem("swaply_guest_banner_dismissed", "1");
        }}
        className="shrink-0 rounded-full p-0.5 text-white/70 hover:bg-white/20 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
