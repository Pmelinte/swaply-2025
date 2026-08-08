"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { Filter, MessageCircle, ArrowRight, MessageSquare, Coins, Plug } from "lucide-react";

export function ContextBar() {
  const pathname = usePathname();
  const t = useTranslations("contextBar");
  const { user, items, swaps, conversations, notifications, loading } = useAppState();

  const normalizedPathname = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
  const isObjectsRoute =
    normalizedPathname === "/objects" || normalizedPathname.startsWith("/objects/");
  const isMatchingRoute =
    normalizedPathname === "/matching" ||
    normalizedPathname.startsWith("/matching/");
  const isChatRoute = normalizedPathname === "/chat";
  const isExchangeRoute =
    normalizedPathname === "/exchange" ||
    normalizedPathname.startsWith("/exchange/") ||
    normalizedPathname === "/change" ||
    normalizedPathname.startsWith("/change/");
  const isMonetizationRoute =
    normalizedPathname === "/monetization" ||
    normalizedPathname.startsWith("/monetization");
  const isIntegrationsRoute =
    normalizedPathname === "/integrations" ||
    normalizedPathname.startsWith("/integrations");
  const isProfileRoute =
    normalizedPathname === "/profile" || normalizedPathname.startsWith("/profile");
  const canRenderContextBar =
    normalizedPathname === "/" ||
    isObjectsRoute ||
    isChatRoute ||
    isExchangeRoute ||
    isMonetizationRoute ||
    isIntegrationsRoute ||
    isProfileRoute;

  // Reserve geometry only on routes that actually render ContextBar after auth
  // settles. Reserving it on unrelated routes (for example Properties) creates
  // a 29px upward shift when the placeholder disappears.
  if (loading.auth && canRenderContextBar) {
    return (
      <div
        className="border-b border-zinc-100 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/50"
        aria-hidden="true"
      >
        <div className="mx-auto max-w-6xl px-4 py-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="invisible">0 obiecte active</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Matching page has its own sticky header; ContextBar would duplicate info
  if (isMatchingRoute) return null;

  const myItems = items.filter((i) => i.ownerId === user.id && i.isActive);
  const activeSwaps = swaps.filter((s) => s.status !== "completed" && s.status !== "cancelled");
  const unreadNotifs = notifications.filter((n) => !n.read).length;

  // Determine context based on current page
  let content: React.ReactNode = null;

  if (normalizedPathname === "/") {
    content = (
      <div className="flex items-center gap-3">
        <span>{t("itemsActive", { count: myItems.length })}</span>
        <span className="text-zinc-300 dark:text-zinc-600">|</span>
        <span>{t("swapsInProgress", { count: activeSwaps.length })}</span>
        {unreadNotifs > 0 && (
          <>
            <span className="text-zinc-300 dark:text-zinc-600">|</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {t("newNotifications", { count: unreadNotifs })}
            </span>
          </>
        )}
        <span className="text-zinc-300 dark:text-zinc-600">|</span>
        <Link
          href="/feedback"
          className="inline-flex items-center gap-1 font-semibold text-rose-600 hover:text-rose-800 dark:text-rose-400"
        >
          <MessageSquare className="h-3 w-3" />
          {t("feedback")}
        </Link>
      </div>
    );
  } else if (isObjectsRoute) {
    content = (
      <div className="flex items-center gap-3">
        <span>{t("itemsActive", { count: myItems.length })}</span>
      </div>
    );
  } else if (
    normalizedPathname === "/matching" ||
    normalizedPathname.startsWith("/matching/") ||
    normalizedPathname === "/match" ||
    normalizedPathname.startsWith("/match/")
  ) {
    content = (
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1">
          <Filter className="h-3 w-3" />
          {t("matchAnalysis")}
        </span>
        <span className="text-zinc-300 dark:text-zinc-600">|</span>
        <span>{t("basedOnItems", { count: myItems.length })}</span>
      </div>
    );
  } else if (isChatRoute) {
    content = (
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1">
          <MessageCircle className="h-3 w-3" />
          {t("conversations", { count: conversations.length })}
        </span>
        {activeSwaps.length > 0 && (
          <>
            <span className="text-zinc-300 dark:text-zinc-600">|</span>
            <span>{t("swapsInProgress", { count: activeSwaps.length })}</span>
          </>
        )}
      </div>
    );
  } else if (isExchangeRoute) {
    const pendingSwaps = swaps.filter((s) => s.status === "pending");
    const inProgressSwaps = swaps.filter((s) => s.status === "accepted");
    content = (
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1">
          <ArrowRight className="h-3 w-3" />
          {t("activeExchanges", { count: activeSwaps.length })}
        </span>
        {pendingSwaps.length > 0 && (
          <>
            <span className="text-zinc-300 dark:text-zinc-600">|</span>
            <span className="text-amber-600 dark:text-amber-400">
              {t("pendingAction", { count: pendingSwaps.length })}
            </span>
          </>
        )}
        {inProgressSwaps.length > 0 && (
          <>
            <span className="text-zinc-300 dark:text-zinc-600">|</span>
            <span className="text-blue-600 dark:text-blue-400">
              {t("inProgress", { count: inProgressSwaps.length })}
            </span>
          </>
        )}
      </div>
    );
  } else if (isMonetizationRoute) {
    content = (
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1">
          <Coins className="h-3 w-3" />
          {t("tokens")}: {user.stats.tokens}
        </span>
        <span className="text-zinc-300 dark:text-zinc-600">|</span>
        <Link
          href="/profile"
          className="font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400"
        >
          {t("reputation")}
        </Link>
      </div>
    );
  } else if (isIntegrationsRoute) {
    content = (
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1">
          <Plug className="h-3 w-3" />
          {t("integrationsApis")}
        </span>
        <span className="text-zinc-300 dark:text-zinc-600">|</span>
        <Link
          href="/monetization"
          className="inline-flex items-center gap-1 font-semibold text-amber-600 hover:text-amber-800 dark:text-amber-400"
        >
          <Coins className="h-3 w-3" />
          {t("monetization")}
        </Link>
      </div>
    );
  } else if (isProfileRoute) {
    content = (
      <div className="flex items-center gap-3">
        <span>{t("reputation")}: {user.stats.reputation}</span>
        <span className="text-zinc-300 dark:text-zinc-600">|</span>
        <span>{t("tokens")}: {user.stats.tokens}</span>
        <span className="text-zinc-300 dark:text-zinc-600">|</span>
        <Link
          href="/monetization"
          className="inline-flex items-center gap-1 font-semibold text-amber-600 hover:text-amber-800 dark:text-amber-400"
        >
          <Coins className="h-3 w-3" />
          {t("monetization")}
        </Link>
        <span className="text-zinc-300 dark:text-zinc-600">|</span>
        <Link
          href="/integrations"
          className="inline-flex items-center gap-1 font-semibold text-purple-600 hover:text-purple-800 dark:text-purple-400"
        >
          <Plug className="h-3 w-3" />
          {t("integrations")}
        </Link>
        <span className="text-zinc-300 dark:text-zinc-600">|</span>
        <Link
          href="/info"
          className="font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400"
        >
          {t("viewInfo")}
        </Link>
      </div>
    );
  } else {
    return null;
  }

  return (
    <div className="border-b border-zinc-100 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="mx-auto max-w-6xl px-4 py-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        {content}
      </div>
    </div>
  );
}
