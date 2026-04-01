/**
 * Web Push subscription helpers (client-side).
 *
 * Uses the NEXT_PUBLIC_VAPID_PUBLIC_KEY env var and stores subscriptions
 * in the Supabase push_subscriptions table.
 */

import { getSupabaseClient } from "@/lib/supabase/client";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

/**
 * Request push permission, subscribe via service worker, and save
 * the subscription to the push_subscriptions table.
 */
export async function subscribeToPush(userId: string): Promise<boolean> {
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
  });

  const json = subscription.toJSON();
  const endpoint = json.endpoint ?? "";
  const p256dh = json.keys?.p256dh ?? "";
  const auth = json.keys?.auth ?? "";

  if (!endpoint || !p256dh || !auth) return false;

  const sb = getSupabaseClient();
  if (!sb) return false;

  const { error } = await sb.from("push_subscriptions").upsert(
    { user_id: userId, endpoint, p256dh, auth },
    { onConflict: "user_id,endpoint" },
  );

  return !error;
}

/**
 * Unsubscribe from push notifications and remove the subscription
 * from the database.
 */
export async function unsubscribeFromPush(userId: string): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();

    const sb = getSupabaseClient();
    if (sb) {
      await sb
        .from("push_subscriptions")
        .delete()
        .eq("user_id", userId)
        .eq("endpoint", endpoint);
    }
  }

  return true;
}

/**
 * Check if the user has an active push subscription.
 */
export async function isPushSubscribed(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  return subscription !== null;
}
