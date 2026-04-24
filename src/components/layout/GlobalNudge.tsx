"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useAppState } from "@/lib/state";
import { useTranslations } from "next-intl";

/**
 * Shows a single contextual "next recommended step" banner at the top of pages.
 * Priority: not logged in → login, profile incomplete → profile, no items → add object, etc.
 * Never shows on the target page itself (e.g., don't show "go to login" on /login).
 */
export function GlobalNudge() {
  const { user, items, loading } = useAppState();
  const tc = useTranslations("common");
  const pathname = usePathname();

  // Reserve space during loading to prevent CLS
  if (loading.auth || loading.profile) {
    return <div className="mx-auto mb-2 h-10 max-w-6xl" />;
  }

  // Matching page handles its own onboarding; no nudge needed.
  // Other listing pages (objects, properties, services, events) already
  // expose their own Add CTA in the header, so we suppress the global
  // nudge there to avoid a duplicate prompt.
  if (pathname === "/matching" || pathname.startsWith("/matching/")) return null;
  if (pathname === "/objects" || pathname.startsWith("/objects/")) return null;
  if (pathname === "/properties" || pathname.startsWith("/properties/")) return null;
  if (pathname === "/services" || pathname.startsWith("/services/")) return null;
  if (pathname === "/events" || pathname.startsWith("/events/")) return null;

  type NudgeConfig = { message: string; href: string; label: string; color: string };
  let nudge: NudgeConfig | null = null;

  if (!user) {
    // TopBar already shows a prominent Login button for signed-out users,
    // so we skip this nudge to avoid a duplicate CTA.
  } else if (!user.location?.city) {
    if (pathname !== "/profile") {
      nudge = {
        message: tc("nudgeCompleteProfile"),
        href: "/profile",
        label: tc("nudgeProfile"),
        color: "border-amber-200 bg-amber-50/80 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
      };
    }
  } else if (items.filter((i) => i.ownerId === user.id && i.status === "active").length === 0) {
    if (pathname !== "/objects/new") {
      nudge = {
        message: tc("nudgeAddObject"),
        href: "/objects/new",
        label: tc("nudgeAddObjectLabel"),
        color: "border-emerald-200 bg-emerald-50/80 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
      };
    }
  }

  if (!nudge) return null;

  return (
    <div className={`mx-auto mb-2 max-w-6xl rounded-xl border px-4 py-2 ${nudge.color}`}>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span>
          <span className="font-medium">{tc("nextStep")}:</span> {nudge.message}
        </span>
        <Link
          href={nudge.href}
          className="shrink-0 rounded-full bg-white/60 px-3 py-1 text-xs font-semibold shadow-sm hover:bg-white dark:bg-zinc-800/60 dark:hover:bg-zinc-700"
        >
          {nudge.label} →
        </Link>
      </div>
    </div>
  );
}
