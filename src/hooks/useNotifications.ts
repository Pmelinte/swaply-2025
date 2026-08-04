"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Notification, NotificationPreferences } from "@/lib/types";

const DEFAULT_PREFERENCES: Omit<NotificationPreferences, "userId" | "updatedAt"> = {
  match_new_inapp: true,
  match_new_email: true,
  match_new_push: false,
  message_inapp: true,
  message_email: false,
  message_push: true,
  swap_proposed_inapp: true,
  swap_proposed_email: true,
  swap_proposed_push: true,
  swap_accepted_inapp: true,
  swap_accepted_email: true,
  swap_accepted_push: true,
  logistics_updated_inapp: true,
  logistics_updated_email: false,
  logistics_updated_push: false,
  meeting_reminder_inapp: true,
  meeting_reminder_email: true,
  meeting_reminder_push: true,
  dispute_update_inapp: true,
  dispute_update_email: true,
  dispute_update_push: true,
  favorite_updated_inapp: true,
  favorite_updated_email: false,
  favorite_updated_push: false,
  saved_search_result_inapp: true,
  saved_search_result_email: true,
  saved_search_result_push: false,
  feedback_requested_inapp: true,
  feedback_requested_email: true,
  feedback_requested_push: false,
};

export type NotificationFilter = "all" | "unread" | "swap" | "message" | "alert";
export type NotificationRealtimeStatus =
  | "IDLE"
  | "CONNECTING"
  | "SUBSCRIBED"
  | "CHANNEL_ERROR"
  | "TIMED_OUT"
  | "CLOSED";

function matchesFilter(n: Notification, filter: NotificationFilter): boolean {
  if (filter === "all") return true;
  if (filter === "unread") return !n.read;
  if (filter === "swap") {
    return [
      "swap_proposed",
      "swap_accepted",
      "swap_completed",
      "logistics_updated",
      "meeting_reminder",
    ].includes(n.type);
  }
  if (filter === "message") return n.type === "message";
  if (filter === "alert") {
    return [
      "match_new",
      "saved_search_result",
      "favorite_updated",
      "feedback_requested",
      "dispute_update",
    ].includes(n.type);
  }
  return true;
}

function mapNotificationRow(row: Record<string, unknown>): Notification {
  return {
    id: String(row.id ?? ""),
    userId: String(row.user_id ?? ""),
    type: String(row.type ?? "info"),
    title: row.title ? String(row.title) : undefined,
    message: String(row.message ?? row.body ?? row.title ?? ""),
    body: row.body ? String(row.body) : undefined,
    data: (row.data && typeof row.data === "object"
      ? row.data
      : {}) as Record<string, unknown>,
    read: Boolean(row.is_read ?? row.read ?? false),
    priority: String(row.priority ?? "normal") as Notification["priority"],
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [realtimeStatus, setRealtimeStatus] =
    useState<NotificationRealtimeStatus>("IDLE");

  const loadNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/notifications", {
        cache: "no-store",
      });
      if (!response.ok) return;

      const payload = (await response.json()) as {
        notifications?: Record<string, unknown>[];
      };
      setNotifications(
        (payload.notifications ?? []).map((row) => mapNotificationRow(row)),
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let cancelled = false;

    if (userId) {
      void Promise.resolve()
        .then(loadNotifications)
        .then(() => {
          if (cancelled) return;
        });
    }

    return () => {
      cancelled = true;
    };
  }, [loadNotifications, userId]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!userId) return;

      const sb = getSupabaseClient();
      if (!sb) return;

      setPrefsLoading(true);
      const { data } = await sb
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (cancelled) return;

      if (data) {
        setPreferences({
          ...DEFAULT_PREFERENCES,
          ...data,
          userId,
        } as NotificationPreferences);
      } else {
        setPreferences({
          ...DEFAULT_PREFERENCES,
          userId,
        } as NotificationPreferences);
      }
      setPrefsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const sb = getSupabaseClient();
    if (!sb) {
      void Promise.resolve().then(() => setRealtimeStatus("CLOSED"));
      return;
    }

    let active = true;
    void Promise.resolve().then(() => {
      if (active) setRealtimeStatus("CONNECTING");
    });

    const reconcile = () => {
      if (active) void loadNotifications();
    };

    const channel = sb
      .channel(`notifications-ui:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        reconcile,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        reconcile,
      )
      .subscribe((status) => {
        if (!active) return;
        setRealtimeStatus(status as NotificationRealtimeStatus);

        if (status === "SUBSCRIBED") {
          void loadNotifications();
        }
      });

    return () => {
      active = false;
      setRealtimeStatus("CLOSED");
      void sb.removeChannel(channel);
    };
  }, [loadNotifications, userId]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered = notifications.filter((n) => matchesFilter(n, filter));

  const markRead = useCallback(
    async (notificationId: string) => {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_one", notificationId }),
      });

      if (response.ok) {
        await loadNotifications();
      }
    },
    [loadNotifications],
  );

  const markAllRead = useCallback(async () => {
    if (!userId) return;

    const response = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_all" }),
    });

    if (response.ok) {
      await loadNotifications();
    }
  }, [loadNotifications, userId]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    const sb = getSupabaseClient();
    if (sb) {
      await sb.from("notifications").delete().eq("id", notificationId);
    }
    setNotifications((previous) =>
      previous.filter((notification) => notification.id !== notificationId),
    );
  }, []);

  const updatePreferences = useCallback(
    async (updates: Partial<NotificationPreferences>) => {
      if (!userId) return;
      const sb = getSupabaseClient();
      if (!sb) return;

      const newPreferences = {
        ...preferences,
        ...updates,
        userId,
        updated_at: new Date().toISOString(),
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {
        userId: _userId,
        updatedAt: _updatedAt,
        ...databaseRow
      } = newPreferences as NotificationPreferences & {
        updated_at: string;
      };
      const payload = { ...databaseRow, user_id: userId };

      await sb
        .from("notification_preferences")
        .upsert(payload, { onConflict: "user_id" });
      setPreferences(newPreferences as NotificationPreferences);
    },
    [userId, preferences],
  );

  return {
    notifications: filtered,
    allNotifications: notifications,
    loading,
    unreadCount,
    filter,
    setFilter,
    markRead,
    markAllRead,
    deleteNotification,
    preferences,
    prefsLoading,
    updatePreferences,
    realtimeStatus,
    refresh: loadNotifications,
  };
}
