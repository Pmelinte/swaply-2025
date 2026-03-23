"use client";

import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { useNotifications, type NotificationFilter } from "@/hooks/useNotifications";
import {
  Bell, Check, CheckCheck, Trash2,
  MessageSquare, ArrowRightLeft, Search, Star, AlertTriangle,
  Clock, Users, Package, Megaphone,
} from "lucide-react";
import Link from "next/link";

function typeIcon(type: string) {
  switch (type) {
    case "message": return <MessageSquare className="h-4 w-4 text-blue-500" />;
    case "swap_proposed": return <ArrowRightLeft className="h-4 w-4 text-green-500" />;
    case "swap_accepted": return <Check className="h-4 w-4 text-green-600" />;
    case "logistics_updated": return <Package className="h-4 w-4 text-orange-500" />;
    case "meeting_reminder": return <Clock className="h-4 w-4 text-amber-500" />;
    case "match_new": return <Users className="h-4 w-4 text-purple-500" />;
    case "saved_search_result": return <Search className="h-4 w-4 text-purple-500" />;
    case "favorite_updated": return <Star className="h-4 w-4 text-amber-500" />;
    case "dispute_update": return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case "feedback_requested": return <Megaphone className="h-4 w-4 text-teal-500" />;
    default: return <Bell className="h-4 w-4 text-zinc-400" />;
  }
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "acum";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString();
}

function notificationLink(n: { type: string; data?: Record<string, unknown> }): string | null {
  const d = n.data ?? {};
  if (n.type === "message" && d.conversation_id) return `/chat`;
  if (["swap_proposed", "swap_accepted", "logistics_updated", "meeting_reminder"].includes(n.type) && d.swap_id) return `/change`;
  if (n.type === "match_new" && d.item_id) return `/objects/${d.item_id}`;
  if (n.type === "saved_search_result" && d.item_id) return `/objects/${d.item_id}`;
  if (n.type === "favorite_updated" && d.item_id) return `/objects/${d.item_id}`;
  return null;
}

const FILTERS: { key: NotificationFilter; labelKey: string }[] = [
  { key: "all", labelKey: "filterAll" },
  { key: "unread", labelKey: "filterUnread" },
  { key: "swap", labelKey: "filterSwaps" },
  { key: "message", labelKey: "filterMessages" },
  { key: "alert", labelKey: "filterAlerts" },
];

export default function NotificationsPage() {
  const t = useTranslations("notifications");
  const { user, loading: appLoading } = useAppState();
  const {
    notifications, loading, unreadCount, filter, setFilter,
    markRead, markAllRead, deleteNotification,
  } = useNotifications(user?.id);

  if (appLoading.auth) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <Bell className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-600" />
        <h1 className="mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">{t("title")}</h1>
        <p className="mt-2 text-sm text-zinc-500">{t("loginRequired")}</p>
        <Link href="/login" className="mt-4 inline-block rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          {t("loginButton")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{t("title")}</h1>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            {t("markAllRead")}
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filter === f.key
                ? "bg-blue-600 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {t(f.labelKey)}
            {f.key === "unread" && unreadCount > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-500" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="mx-auto h-10 w-10 text-zinc-300 dark:text-zinc-600" />
            <p className="mt-3 text-sm text-zinc-400">{t("empty")}</p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {notifications.map((n) => {
              const link = notificationLink(n);
              const handleClick = () => { if (!n.read) void markRead(n.id); };
              const inner = (
                <>
                  <span className="mt-0.5 shrink-0">{typeIcon(n.type)}</span>
                  <div className="min-w-0 flex-1">
                    {n.title && (
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{n.title}</p>
                    )}
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">{n.body || n.message}</p>
                    <span className="mt-1 block text-xs text-zinc-400">{formatTime(n.createdAt)}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {!n.read && (
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    )}
                  </div>
                </>
              );
              const cls = "flex items-start gap-3 px-4 py-3 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50";

              return (
                <li key={n.id} className={`group relative ${n.read ? "opacity-60" : ""}`}>
                  {link ? (
                    <Link href={link} className={cls} onClick={handleClick}>{inner}</Link>
                  ) : (
                    <div className={cls} onClick={handleClick} role="button" tabIndex={0}>{inner}</div>
                  )}
                  <button
                    type="button"
                    onClick={() => void deleteNotification(n.id)}
                    className="absolute right-2 top-2 hidden rounded-full p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500 group-hover:block dark:hover:bg-red-900/30"
                    title={t("delete")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Settings link */}
      <div className="text-center">
        <Link
          href="/profile"
          className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
        >
          {t("managePreferences")}
        </Link>
      </div>
    </div>
  );
}
