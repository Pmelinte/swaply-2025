import type { SupabaseClient } from "@supabase/supabase-js";

export type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  title_key: string | null;
  body_key: string | null;
  data: Record<string, unknown> | null;
  read: boolean | null;
  is_read: boolean | null;
  priority: string | null;
  source_type: string | null;
  source_id: string | null;
  dedupe_key: string | null;
  created_at: string;
};

export function getNotificationHref(notification: NotificationRow): string {
  const data = notification.data ?? {};
  const conversationId = data.conversation_id;
  const matchId = data.match_id;
  const swapId = data.swap_id;

  if (typeof conversationId === "string" && conversationId.length > 0) {
    return `/chat?conversation=${conversationId}`;
  }

  if (typeof matchId === "string" && matchId.length > 0) {
    return `/matching?match=${matchId}`;
  }

  if (typeof swapId === "string" && swapId.length > 0) {
    return `/exchange?swap=${swapId}`;
  }

  return "/notifications";
}

export async function fetchNotifications(
  supabase: SupabaseClient,
  userId: string,
): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select(
      "id, user_id, type, title, body, title_key, body_key, data, read, is_read, priority, source_type, source_id, dedupe_key, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("fetchNotifications failed", error);
    return [];
  }

  return (data ?? []) as NotificationRow[];
}

export function countUnreadNotifications(rows: NotificationRow[]): number {
  return rows.filter((row) => row.is_read === false).length;
}

export async function markNotificationRead(
  supabase: SupabaseClient,
  notificationId: string,
  userId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read: true })
    .eq("id", notificationId)
    .eq("user_id", userId);

  return !error;
}

export async function markAllNotificationsRead(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  return !error;
}
