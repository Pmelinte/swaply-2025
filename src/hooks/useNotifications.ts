"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  if (filter === "alert") return ["match_new", "saved_search_result", "favorite_updated", "feedback_requested", "dispute_update"].includes(n.type);
  return true;
}

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const fetchedRef = useRef(false);
  const prefsFetchedRef = useRef(false);

  // Fetch notifications
  useEffect(() => {
    if (!userId || fetchedRef.current) return;
    fetchedRef.current = true;
    let cancelled = false;

    (async () => {
      const sb = getSupabaseClient();
      if (!sb) return;

      setLoading(true);
      const { data } = await sb
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (cancelled) return;

      if (data) {
        setNotifications(data.map((row: Record<string, unknown>) => ({
          id: String(row.id ?? ""),
          userId: String(row.user_id ?? ""),
          type: String(row.type ?? "info"),
          title: row.title ? String(row.title) : undefined,
          message: String(row.message ?? row.title ?? ""),
          body: row.body ? String(row.body) : undefined,
          data: (row.data && typeof row.data === "object" ? row.data : {}) as Record<string, unknown>,
          read: Boolean(row.is_read ?? row.read ?? false),
          priority: String(row.priority ?? "normal") as Notification["priority"],
          createdAt: String(row.created_at ?? new Date().toISOString()),
        })));
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [userId]);

  // Fetch preferences
  useEffect(() => {
    if (!userId || prefsFetchedRef.current) return;
    prefsFetchedRef.current = true;
    let cancelled = false;

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
        setPreferences({ ...DEFAULT_PREFERENCES, ...data, userId } as NotificationPreferences);
      } else {
        setPreferences({ ...DEFAULT_PREFERENCES, userId } as NotificationPreferences);
      }
      setPrefsLoading(false);
    })();

    return () => { cancelled = true; };
  }, [userId]);

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;
    const sb = getSupabaseClient();
    if (!sb) return;

    const channel = sb
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const n: Notification = {
            id: String(row.id ?? ""),
            userId: String(row.user_id ?? ""),
            type: String(row.type ?? "info"),
            title: row.title ? String(row.title) : undefined,
            message: String(row.message ?? row.title ?? ""),
            body: row.body ? String(row.body) : undefined,
            data: (row.data && typeof row.data === "object" ? row.data : {}) as Record<string, unknown>,
            read: Boolean(row.is_read ?? row.read ?? false),
            priority: String(row.priority ?? "normal") as Notification["priority"],
            createdAt: String(row.created_at ?? new Date().toISOString()),
          };
          setNotifications((prev) => [n, ...prev]);
        },
      )
      .subscribe();

    return () => { sb.removeChannel(channel); };
  }, [userId]);

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
    setNotifications((prev) => prev.map((n) => n.id === notificationId ? { ...n, read: true } : n));
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
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [userId]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    const sb = getSupabaseClient();
    if (sb) {
      await sb.from("notifications").delete().eq("id", notificationId);
    }
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  }, []);

  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    if (!userId) return;
    const sb = getSupabaseClient();
    if (!sb) return;

    const newPrefs = { ...preferences, ...updates, userId, updated_at: new Date().toISOString() };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { userId: _uid, updatedAt: _ua, ...dbRow } = newPrefs as NotificationPreferences & { updated_at: string };
    const payload = { ...dbRow, user_id: userId };

    await sb.from("notification_preferences").upsert(payload, { onConflict: "user_id" });
    setPreferences(newPrefs as NotificationPreferences);
  }, [userId, preferences]);

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
  };
}
