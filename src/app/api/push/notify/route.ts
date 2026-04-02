/**
 * POST /api/push/notify — send a push notification to a user.
 *
 * Unlike /api/push/send (admin-only), this route is available to any
 * authenticated user but only allows notifying users they have a
 * swap relationship with (requester or responder).
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/service";
import { sendPushNotification } from "@/lib/webpush";
import { kvRateLimit, tooManyRequests } from "@/lib/kv-rate-limit";

export async function POST(req: NextRequest) {
  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 20 requests per minute per user
  const { success } = await kvRateLimit(`push-notify:${user.id}`, { limit: 20, windowSeconds: 60 });
  if (!success) return tooManyRequests();

  let body: { userId?: string; title?: string; body?: string; url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, title, body: msgBody, url } = body;
  if (!userId || !title) {
    return NextResponse.json({ error: "userId and title required" }, { status: 400 });
  }

  // Verify the caller has a swap relationship with the target user
  const { data: swap } = await supabase
    .from("swaps")
    .select("id")
    .or(
      `and(requester_id.eq.${user.id},responder_id.eq.${userId}),and(requester_id.eq.${userId},responder_id.eq.${user.id})`,
    )
    .limit(1)
    .maybeSingle();

  if (!swap) {
    return NextResponse.json({ error: "No swap relationship" }, { status: 403 });
  }

  // Use service role to read push_subscriptions (RLS restricts to own)
  const sb = getServiceSupabase();
  if (!sb) {
    return NextResponse.json({ sent: 0 });
  }

  const { data: subscriptions } = await sb
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;
  for (const sub of subscriptions) {
    try {
      await sendPushNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        { title, body: msgBody ?? "", url: url ?? "/" },
      );
      sent++;
    } catch (err: unknown) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await sb.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      }
    }
  }

  return NextResponse.json({ sent });
}
