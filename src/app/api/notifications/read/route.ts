// src/app/api/notifications/read/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

type ApiResponse =
  | { ok: true }
  | { ok: false; error: string };

/**
 * POST /api/notifications/read
 *
 * Body opțional:
 *  - { notificationId: string }  -> marchează UNA
 *  - {}                          -> marchează TOATE ca citite
 */
export async function POST(
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

    const body = await req.json().catch(() => ({}));
    const notificationId = body?.notificationId;

    let query = supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id);

    // dacă vine notificationId -> doar una
    if (notificationId && typeof notificationId === "string") {
      query = query.eq("id", notificationId);
    }

    const { error } = await query;

    if (error) {
      console.error("[NOTIFICATIONS_MARK_READ_ERROR]", error);
      return NextResponse.json(
        { ok: false, error: "db_error_mark_read" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[NOTIFICATIONS_MARK_READ_UNEXPECTED]", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 },
    );
  }
}