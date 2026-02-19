"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { Plus, Filter, MessageCircle, ArrowRight, MessageSquare } from "lucide-react";

export function ContextBar() {
  const pathname = usePathname();
  const t = useTranslations("contextBar");
  const { user, items, swaps, conversations, notifications } = useAppState();

  if (!user) return null;

  const myItems = items.filter((i) => i.ownerId === user.id && i.isActive);
  const activeSwaps = swaps.filter((s) => s.status !== "completed" && s.status !== "cancelled");
  const unreadConvs = conversations.filter((c) => c.messages.length > 0);
  const unreadNotifs = notifications.filter((n) => !n.read).length;

  // Determine context based on current page
  let content: React.ReactNode = null;

  if (pathname === "/" || pathname === "") {
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
  } else if (pathname === "/objects" || pathname.startsWith("/objects/")) {
    content = (
      <div className="flex items-center gap-3">
        <span>{t("itemsActive", { count: myItems.length })}</span>
        <span className="text-zinc-300 dark:text-zinc-600">|</span>
        <Link
          href="/objects/new"
          className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400"
        >
          <Plus className="h-3 w-3" />
          {t("addObject")}
        </Link>
      </div>
    );
  } else if (pathname === "/match") {
    content = (
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1">
          <Filter className="h-3 w-3" />
          {t("matchAnalysis")}
        </span>
        {myItems.length === 0 && (
          <>
            <span className="text-zinc-300 dark:text-zinc-600">|</span>
            <Link
              href="/objects/new"
              className="font-semibold text-amber-600 dark:text-amber-400"
            >
              {t("addObjectFirst")}
            </Link>
          </>
        )}
        {myItems.length > 0 && (
          <>
            <span className="text-zinc-300 dark:text-zinc-600">|</span>
            <span>{t("basedOnItems", { count: myItems.length })}</span>
          </>
        )}
      </div>
    );
  } else if (pathname === "/chat" || pathname.startsWith("/chat")) {
    content = (
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1">
          <MessageCircle className="h-3 w-3" />
          {t("conversations", { count: unreadConvs.length })}
        </span>
        {activeSwaps.length > 0 && (
          <>
            <span className="text-zinc-300 dark:text-zinc-600">|</span>
            <span>{t("swapsInProgress", { count: activeSwaps.length })}</span>
          </>
        )}
      </div>
    );
  } else if (pathname === "/change" || pathname.startsWith("/change")) {
    const pendingSwaps = swaps.filter((s) => s.status === "proposed" || s.status === "scheduled");
    const inProgressSwaps = swaps.filter((s) => s.status === "in_progress");
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
  } else if (pathname === "/profile" || pathname.startsWith("/profile")) {
    content = (
      <div className="flex items-center gap-3">
        <span>{t("reputation")}: {user.stats.reputation}</span>
        <span className="text-zinc-300 dark:text-zinc-600">|</span>
        <span>{t("tokens")}: {user.stats.tokens}</span>
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
