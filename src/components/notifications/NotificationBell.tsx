"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Check, MessageSquare, ArrowRightLeft, Search, Star, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useNotifications } from "@/hooks/useNotifications";

function typeIcon(type: string) {
  switch (type) {
    case "message": return <MessageSquare className="h-3.5 w-3.5 text-blue-500" />;
    case "swap_proposed":
    case "swap_accepted":
    case "logistics_updated": return <ArrowRightLeft className="h-3.5 w-3.5 text-green-500" />;
    case "match_new":
    case "saved_search_result": return <Search className="h-3.5 w-3.5 text-purple-500" />;
    case "favorite_updated": return <Star className="h-3.5 w-3.5 text-amber-500" />;
    case "dispute_update": return <AlertTriangle className="h-3.5 w-3.5 text-red-500" />;
    default: return <Bell className="h-3.5 w-3.5 text-zinc-400" />;
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function NotificationBell({ userId }: { userId: string }) {
  const t = useTranslations("notifications");
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(userId);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const preview = notifications.slice(0, 5);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative inline-flex items-center justify-center rounded-full p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        title={t("title")}
        aria-label={t("title")}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-80 rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-700">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {t("title")}
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
              >
                <Check className="h-3 w-3" />
                {t("markAllRead")}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {preview.length > 0 ? (
              preview.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => { void markRead(n.id); setOpen(false); }}
                  className={`w-full border-b border-zinc-50 px-4 py-3 text-left transition last:border-0 hover:bg-blue-50 dark:border-zinc-700/50 dark:hover:bg-blue-900/20 ${
                    n.read ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 shrink-0">{typeIcon(n.type)}</span>
                    <div className="min-w-0 flex-1">
                      {n.title && (
                        <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">{n.title}</p>
                      )}
                      <p className="truncate text-xs text-zinc-600 dark:text-zinc-300">{n.message}</p>
                      <span className="mt-0.5 text-[10px] text-zinc-400">{timeAgo(n.createdAt)}</span>
                    </div>
                    {!n.read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-xs text-zinc-400">
                {t("empty")}
              </div>
            )}
          </div>

          <div className="border-t border-zinc-100 px-4 py-2 dark:border-zinc-700">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              {t("viewAll")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
