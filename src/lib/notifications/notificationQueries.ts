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

function readIdentifier(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function getNotificationHref(notification: NotificationRow): string {
  const data = notification.data ?? {};
  const conversationId = readIdentifier(data.conversation_id);
  const matchId = readIdentifier(data.match_id);
  const swapId = readIdentifier(data.swap_id);

  if (conversationId) {
    return `/chat?conversation=${encodeURIComponent(conversationId)}`;
  }

  if (matchId) {
    return `/matching?match=${encodeURIComponent(matchId)}`;
  }

  if (swapId) {
    return `/exchange/${encodeURIComponent(swapId)}`;
  }

  return "/notifications";
}

export function dedupeNotifications(rows: NotificationRow[]): NotificationRow[] {
  const seen = new Set<string>();

  return rows.filter((row) => {
    const key = readIdentifier(row.dedupe_key);
    if (!key) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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

  return dedupeNotifications((data ?? []) as NotificationRow[]);
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
