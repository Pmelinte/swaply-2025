// src/app/api/notifications/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

type NotificationDto = {
  id: string;
  userId: string;
  type: string;
  entityId: string | null;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
};

type ApiResponse =
  | { ok: true; notifications: NotificationDto[]; unreadCount: number }
  | { ok: false; error: string };

/**
 * GET /api/notifications
 *
 * Optional:
 *  - ?unreadOnly=true
 *  - ?limit=50
 */
export async function GET(
  req: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    const supabase = createServerClient();

    // 1) auth
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
    const unreadOnly = url.searchParams.get("unreadOnly") === "true";
    const limitRaw = url.searchParams.get("limit");
    const limit = Math.max(
      1,
      Math.min(200, Number.isFinite(Number(limitRaw)) ? Number(limitRaw) : 50),
    );

    // 2) fetch notifications (RLS enforces ownership)
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[NOTIFICATIONS_GET_ERROR]", error);
      return NextResponse.json(
        { ok: false, error: "db_error_fetch_notifications" },
        { status: 500 },
      );
    }

    // 3) unreadCount (cheap count query)
    const { count, error: countErr } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (countErr) {
      console.error("[NOTIFICATIONS_UNREAD_COUNT_ERROR]", countErr);
    }

    const notifications: NotificationDto[] =
      (data ?? []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        type: row.type,
        entityId: row.entity_id ?? null,
        title: row.title,
        body: row.body ?? null,
        isRead: !!row.is_read,
        createdAt: row.created_at,
      })) ?? [];

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