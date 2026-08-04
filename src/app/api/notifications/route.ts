import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import {
  countUnreadNotifications,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications/notificationQueries";

export async function GET() {
  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 500 },
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const notifications = await fetchNotifications(supabase, user.id);
  const unread = countUnreadNotifications(notifications);

  return NextResponse.json({ notifications, unread });
}

export async function POST(request: Request) {
  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 500 },
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    action?: "mark_one" | "mark_all";
    notificationId?: string;
  };

  if (body.action === "mark_all") {
    const ok = await markAllNotificationsRead(supabase, user.id);
    return NextResponse.json({ ok }, { status: ok ? 200 : 500 });
  }

  if (body.action === "mark_one" && body.notificationId) {
    const ok = await markNotificationRead(
      supabase,
      body.notificationId,
      user.id,
    );
    return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
  }

  return NextResponse.json(
    { error: "Invalid notification action" },
    { status: 400 },
  );
}
