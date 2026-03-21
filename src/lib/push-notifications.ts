/**
 * Client-side push notification utilities for Swaply.
 *
 * Handles service worker registration, permission requests,
 * and push subscription management via the Web Push API.
 *
 * Requires NEXT_PUBLIC_VAPID_PUBLIC_KEY to be set in the environment
 * for push subscription to work.
 */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const SW_PATH = "/sw.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Convert a URL-safe base64 VAPID key to a Uint8Array
 * required by PushManager.subscribe().
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

// ─── Browser Support ────────────────────────────────────────────────────────

/**
 * Returns true when the current browser supports service workers,
 * the Push API, and the Notification API.
 */
export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

// ─── Permission ─────────────────────────────────────────────────────────────

/**
 * Request notification permission from the user.
 * Returns the resulting permission state:
 * "granted", "denied", or "default".
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return "denied";
  return Notification.requestPermission();
}

// ─── Service Worker Registration ────────────────────────────────────────────

/**
 * Register (or re-use) the Swaply service worker.
 * Returns the ServiceWorkerRegistration on success, or null on failure.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.register(SW_PATH, {
      scope: "/",
    });

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    console.error("[push] Service worker registration failed:", error);
    return null;
  }
}

// ─── Subscribe ──────────────────────────────────────────────────────────────

/**
 * Subscribe the current browser to push notifications.
 *
 * 1. Ensures the service worker is registered.
 * 2. Requests permission if not already granted.
 * 3. Creates (or retrieves) a PushSubscription using the VAPID key.
 *
 * Returns the PushSubscription on success, or null if any step fails.
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    console.warn("[push] Push notifications are not supported in this browser.");
    return null;
  }

  if (!VAPID_PUBLIC_KEY) {
    console.error("[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not configured.");
    return null;
  }

  // 1. Permission
  const permission = await requestNotificationPermission();
  if (permission !== "granted") {
    console.warn("[push] Notification permission not granted:", permission);
    return null;
  }

  // 2. Service worker
  const registration = await registerServiceWorker();
  if (!registration) return null;

  try {
    // 3. Check for an existing subscription first
    const existing = await registration.pushManager.getSubscription();
    if (existing) return existing;

    // 4. Create a new subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
    });

    return subscription;
  } catch (error) {
    console.error("[push] Failed to subscribe:", error);
    return null;
  }
}

// ─── Unsubscribe ────────────────────────────────────────────────────────────

/**
 * Unsubscribe the current browser from push notifications.
 * Returns true if the unsubscription succeeded (or there was no subscription).
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return true;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) return true;

    const result = await subscription.unsubscribe();
    return result;
  } catch (error) {
    console.error("[push] Failed to unsubscribe:", error);
    return false;
  }
}
