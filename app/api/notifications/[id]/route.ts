// src/app/api/notifications/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

type ApiResponse =
  | { ok: true }
  | { ok: false; error: string };

/**
 * POST /api/notifications/:id/read
 * Marchează notificarea ca citită
 */
export async function POST(
  req: NextRequest,
  context: { params: { id: string } },
): Promise<NextResponse<ApiResponse>> {
  try {
    const notificationId = context.params.id;

    if (!notificationId) {
      return NextResponse.json(
        { ok: false, error: "missing_notification_id" },
        { status: 400 },
      );
    }

    const supabase = createServerClient();

    // auth
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

    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId)
      .eq("user_id", user.id);

    if (error) {
      console.error("[NOTIFICATION_MARK_READ_ERROR]", error);
      return NextResponse.json(
        { ok: false, error: "db_error_mark_read" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[NOTIFICATION_MARK_READ_UNEXPECTED]", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 },
    );
  }
}