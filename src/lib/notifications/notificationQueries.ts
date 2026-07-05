import type { SupabaseClient } from "@supabase/supabase-js";

export type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  read: boolean | null;
  is_read: boolean | null;
  priority: string | null;
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
    .select("id, user_id, type, title, body, data, read, is_read, priority, created_at")
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
  return rows.filter((row) => row.read === false || row.is_read === false).length;
}

export async function markNotificationRead(
  supabase: SupabaseClient,
  notificationId: string,
  userId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true, is_read: true })
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
    .update({ read: true, is_read: true })
    .eq("user_id", userId);

  return !error;
}
