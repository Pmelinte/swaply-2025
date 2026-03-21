// @ts-expect-error -- web-push has no type declarations
import webpush from "web-push";

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  const subject = process.env.VAPID_SUBJECT || "mailto:hello@swaply.world";
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

export async function sendPushNotification(
  subscription: webpush.PushSubscription,
  payload: PushPayload,
) {
  if (!ensureVapid()) {
    throw new Error("VAPID keys not configured");
  }
  return webpush.sendNotification(
    subscription,
    JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/icons/icon-192x192.png",
      badge: payload.badge || "/icons/icon-96x96.png",
      url: payload.url || "/",
      tag: payload.tag || "swaply-notification",
    }),
  );
}

export { webpush };
