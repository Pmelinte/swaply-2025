// src/features/notifications/hooks/use-notifications.ts

"use client";

import { useCallback, useEffect, useState } from "react";

type NotificationDto = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
};

type ApiResponse =
  | { ok: true; notifications: NotificationDto[]; unreadCount: number }
  | { ok: false; error: string };

export function useNotifications(options?: { autoRefreshMs?: number }) {
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);

      const res = await fetch("/api/notifications", { cache: "no-store" });
      const data: ApiResponse = await res.json();

      if (!res.ok || !data.ok) {
        // dacă nu e logat, nu aruncăm în aer UI-ul: doar setăm eroare
        setItems([]);
        setUnreadCount(0);
        setError((data as any)?.error ?? "Eroare la încărcarea notificărilor.");
        return;
      }

      setItems(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch (e: any) {
      console.error("[USE_NOTIFICATIONS_LOAD_ERROR]", e);
      setItems([]);
      setUnreadCount(0);
      setError(e?.message ?? "Eroare la încărcarea notificărilor.");
    } finally {
      setLoading(false);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/read", { method: "POST" });
      if (!res.ok) throw new Error("Nu s-au putut marca notificările.");

      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e: any) {
      console.error("[USE_NOTIFICATIONS_MARK_ALL_READ_ERROR]", e);
      throw e;
    }
  }, []);

  const markOneRead = useCallback(async (notificationId: string) => {
    try {
      const res = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });

      if (!res.ok) throw new Error("Nu s-a putut marca notificarea.");

      setItems((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e: any) {
      console.error("[USE_NOTIFICATIONS_MARK_ONE_READ_ERROR]", e);
      throw e;
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const ms = options?.autoRefreshMs ?? 0;
    if (!ms || ms < 1000) return;

    const t = setInterval(() => {
      load();
    }, ms);

    return () => clearInterval(t);
  }, [load, options?.autoRefreshMs]);

  return {
    items,
    unreadCount,
    loading,
    error,
    reload: load,
    markAllRead,
    markOneRead,
  };
}