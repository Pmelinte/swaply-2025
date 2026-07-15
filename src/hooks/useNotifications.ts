"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Notification, NotificationPreferences } from "@/lib/types";

const DEFAULT_PREFERENCES: Omit<NotificationPreferences, "userId" | "updatedAt"> = {
  match_new_inapp: true, match_new_email: true, match_new_push: false,
  message_inapp: true, message_email: false, message_push: true,
  swap_proposed_inapp: true, swap_proposed_email: true, swap_proposed_push: true,
  swap_accepted_inapp: true, swap_accepted_email: true, swap_accepted_push: true,
  logistics_updated_inapp: true, logistics_updated_email: false, logistics_updated_push: false,
  meeting_reminder_inapp: true, meeting_reminder_email: true, meeting_reminder_push: true,
  dispute_update_inapp: true, dispute_update_email: true, dispute_update_push: true,
  favorite_updated_inapp: true, favorite_updated_email: false, favorite_updated_push: false,
  saved_search_result_inapp: true, saved_search_result_email: true, saved_search_result_push: false,
  feedback_requested_inapp: true, feedback_requested_email: true, feedback_requested_push: false,
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
    message: String(row.message ?? row.title ?? ""),
    body: row.body ? String(row.body) : undefined,
    data: (row.data && typeof row.data === "object"
      ? row.data
      : {}) as Record<string, unknown>,
    read: Boolean(row.is_read ?? row.read ?? false),
    priority: String(row.priority ?? "normal") as Notification["priority"],
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function mergeNotification(
  previous: Notification[],
  incoming: Notification,
): Notification[] {
  const existingIndex = previous.findIndex((row) => row.id === incoming.id);
  if (existingIndex === -1) return [incoming, ...previous];

  const next = [...previous];
  next[existingIndex] = incoming;
  return next;
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

    const sb = getSupabaseClient();
    if (!sb) return;

    setLoading(true);
    const { data } = await sb
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (data) {
      setNotifications(
        data.map((row: Record<string, unknown>) => mapNotificationRow(row)),
      );
    }
    setLoading(false);
  }, [userId]);

  // Initial fetch. Re-run whenever the authenticated identity changes.
  useEffect(() => {
    let cancelled = false;

    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    void loadNotifications().then(() => {
      if (cancelled) return;
    });

    return () => {
      cancelled = true;
    };
  }, [loadNotifications, userId]);

  // Fetch preferences whenever the authenticated identity changes.
  useEffect(() => {
    let cancelled = false;

    if (!userId) {
      setPreferences(null);
      setPrefsLoading(false);
      return;
    }

    (async () => {
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

  // Canonical Realtime subscription for the visible notification UI.
  // The topic deliberately differs from the legacy AppState topic so one
  // subscription cannot replace or remove the other on the shared client.
  // A reconciliation fetch after SUBSCRIBED closes the fetch/join race window.
  useEffect(() => {
    if (!userId) {
      setRealtimeStatus("IDLE");
      return;
    }

    const sb = getSupabaseClient();
    if (!sb) {
      setRealtimeStatus("CLOSED");
      return;
    }

    let active = true;
    setRealtimeStatus("CONNECTING");

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
        (payload) => {
          const incoming = mapNotificationRow(
            payload.new as Record<string, unknown>,
          );
          setNotifications((previous) =>
            mergeNotification(previous, incoming),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const incoming = mapNotificationRow(
            payload.new as Record<string, unknown>,
          );
          setNotifications((previous) =>
            mergeNotification(previous, incoming),
          );
        },
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

  const markRead = useCallback(async (notificationId: string) => {
    const sb = getSupabaseClient();
    if (sb) {
      await sb
        .from("notifications")
        .update({ is_read: true, read: true })
        .eq("id", notificationId);
    }
    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification,
      ),
    );
  }, []);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    const sb = getSupabaseClient();
    if (sb) {
      await sb
        .from("notifications")
        .update({ is_read: true, read: true })
        .eq("user_id", userId)
        .eq("is_read", false);
    }
    setNotifications((previous) =>
      previous.map((notification) => ({ ...notification, read: true })),
    );
  }, [userId]);

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
