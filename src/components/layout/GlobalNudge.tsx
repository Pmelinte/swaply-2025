"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

  // Don't show during loading
  if (loading.auth || loading.profile) return null;

  type NudgeConfig = { message: string; href: string; label: string; color: string };
  let nudge: NudgeConfig | null = null;

  if (!user) {
    if (pathname !== "/login") {
      nudge = {
        message: tc("nudgeSignIn"),
        href: "/login",
        label: tc("nudgeLogin"),
        color: "border-blue-200 bg-blue-50/80 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200",
      };
    }
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
