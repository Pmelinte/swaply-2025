// src/app/api/notifications/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type {
  NotificationsApiResponse,
  Notification,
  NotificationStatus,
} from "@/features/notifications/types";

/**
 * GET /api/notifications
 *
 * Query params (opțional):
 *  - ?status=unread|read|archived
 *  - ?limit=50
 *
 * DB assumptions (MVP):
 * - table: notifications
 * - columns (snake_case): user_id, type, entity_id, title, body, is_read, created_at
 * - optional: read_at (dacă există)
 */
export async function GET(
  req: NextRequest,
): Promise<NextResponse<NotificationsApiResponse>> {
  try {
    const supabase = createServerClient();

    // 1) Auth
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json(
        { ok: false, error: "not_authenticated" },
        { status: 401 },
      );
    }

    const url = new URL(req.url);

    const status = (url.searchParams.get("status") ??
      "unread") as NotificationStatus;

    const limitRaw = url.searchParams.get("limit");
    const limit = Math.max(
      1,
      Math.min(200, Number.isFinite(Number(limitRaw)) ? Number(limitRaw) : 50),
    );

    // 2) Fetch notifications (RLS enforces ownership)
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    // MVP: archived nu e implementat în DB (îl tratăm ca "all")
    if (status === "unread") query = query.eq("is_read", false);
    if (status === "read") query = query.eq("is_read", true);

    const { data, error } = await query;

    if (error) {
      console.error("[NOTIFICATIONS_GET_ERROR]", error);
      return NextResponse.json(
        { ok: false, error: "db_error_fetch_notifications" },
        { status: 500 },
      );
    }

    // 3) unreadCount (count query)
    const { count, error: countErr } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (countErr) {
      console.error("[NOTIFICATIONS_UNREAD_COUNT_ERROR]", countErr);
    }

    // 4) Map DB -> Notification (camelCase, conform types.ts)
    const notifications: Notification[] =
      (data ?? []).map((row: any) => {
        const isRead = !!row.is_read;

        return {
          id: row.id,
          userId: row.user_id,

          // în DB ai "type" (ex: "new_message") -> în types.ts e "event"
          event: row.type,

          // MVP: doar in_app (email/sms vin mai târziu)
          channel: "in_app",

          title: row.title,
          body: row.body ?? null,

          // păstrăm entity_id într-un payload stabil
          payload: row.entity_id ? { entityId: row.entity_id } : null,

          // în types.ts ai status string
          status: isRead ? "read" : "unread",

          createdAt: row.created_at,
          readAt: row.read_at ?? null,
        } as Notification;
      }) ?? [];

    return NextResponse.json(
      {
        ok: true,
        notifications,
        unreadCount: count ?? 0,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[NOTIFICATIONS_GET_UNEXPECTED]", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 },
    );
  }
}