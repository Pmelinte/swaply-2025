import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { sendPushNotification } from "@/lib/webpush";

export async function POST(req: NextRequest) {
  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  // Verify caller is admin or internal service
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, title, body, url, tag } = await req.json();

  if (!userId || !title || !body) {
    return NextResponse.json(
      { error: "Missing userId, title, or body" },
      { status: 400 },
    );
  }

  // Get all subscriptions for the target user
  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ sent: 0, message: "No subscriptions found" });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const sub of subscriptions) {
    try {
      await sendPushNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        { title, body, url, tag },
      );
      sent++;
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      // Remove expired/invalid subscriptions
      if (statusCode === 410 || statusCode === 404) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", sub.endpoint);
      }
      errors.push(`${sub.endpoint.slice(-20)}: ${statusCode}`);
    }
  }

  return NextResponse.json({ sent, errors: errors.length > 0 ? errors : undefined });
}
