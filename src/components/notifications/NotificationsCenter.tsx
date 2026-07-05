"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  getNotificationHref,
  type NotificationRow,
} from "@/lib/notifications/notificationQueries";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function isUnread(row: NotificationRow): boolean {
  return row.read === false || row.is_read === false;
}

export function NotificationsCenter() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "high">("all");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/notifications")
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled) return;
        setNotifications(payload.notifications ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  const unread = useMemo(() => notifications.filter(isUnread).length, [notifications]);

  const visible = useMemo(() => {
    if (filter === "unread") return notifications.filter(isUnread);
    if (filter === "high") return notifications.filter((row) => row.priority === "high");
    return notifications;
  }, [notifications, filter]);

  async function markOne(notificationId: string) {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_one", notificationId }),
    });

    setNotifications((prev) =>
      prev.map((row) =>
        row.id === notificationId ? { ...row, read: true, is_read: true } : row,
      ),
    );
  }

  async function markAll() {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_all" }),
    });

    setNotifications((prev) => prev.map((row) => ({ ...row, read: true, is_read: true })));
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Notifications</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {unread} unread · {notifications.length} total
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["all", "unread", "high"] as const).map((entry) => (
              <button
                key={entry}
                type="button"
                onClick={() => setFilter(entry)}
                className={`rounded-full px-3 py-2 text-xs font-semibold ${
                  filter === entry
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
                }`}
              >
                {entry === "all" ? "All" : entry === "unread" ? "Unread" : "High priority"}
              </button>
            ))}
            <button
              type="button"
              onClick={() => void markAll()}
              className="rounded-full border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Mark all read
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {loading ? (
            <p className="rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-500 dark:bg-zinc-950">
              Loading notifications...
            </p>
          ) : visible.length === 0 ? (
            <p className="rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-500 dark:bg-zinc-950">
              No notifications in this view.
            </p>
          ) : (
            visible.map((row) => {
              const unreadRow = isUnread(row);
              return (
                <div
                  key={row.id}
                  className={`rounded-2xl border p-4 ${
                    unreadRow
                      ? "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30"
                      : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {unreadRow && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                        <span className="rounded-full bg-zinc-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                          {row.type}
                        </span>
                        {row.priority === "high" && (
                          <span className="rounded-full bg-red-100 px-2 py-1 text-[10px] font-semibold uppercase text-red-700 dark:bg-red-950 dark:text-red-300">
                            high
                          </span>
                        )}
                        <span className="text-xs text-zinc-500">{formatDate(row.created_at)}</span>
                      </div>
                      <h2 className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {row.title}
                      </h2>
                      {row.body && (
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{row.body}</p>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => void markOne(row.id)}
                        className="rounded-full border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-white dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                      >
                        Mark read
                      </button>
                      <Link
                        href={getNotificationHref(row)}
                        onClick={() => void markOne(row.id)}
                        className="rounded-full bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
