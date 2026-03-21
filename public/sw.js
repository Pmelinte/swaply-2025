// Swaply Service Worker — push notifications + cache-first for static assets, network-first for API
const CACHE_NAME = "swaply-v2";
const OFFLINE_URL = "/";
const STATIC_ASSETS = ["/", "/manifest.json", "/no-image.svg", "/icon-192.svg"];

// ─── Install ────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ─── Activate ───────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch — cache strategy for offline fallback ────────────────────────────
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-http(s) schemes (e.g. chrome-extension://) and third-party origins
  if (!url.protocol.startsWith("http") || url.origin !== self.location.origin) {
    return;
  }

  // Network-first for API routes and non-GET requests
  if (url.pathname.startsWith("/api/") || event.request.method !== "GET") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for static assets, with offline fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response.ok && response.type === "basic") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // For navigation requests, serve the offline page
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_URL);
          }
          return new Response("Offline", {
            status: 503,
            statusText: "Service Unavailable",
          });
        });
    })
  );
});

// ─── Push Notifications ─────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = {
    title: "Swaply",
    body: "Ai o notificare noua!",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-96x96.png",
    url: "/",
    tag: "swaply-default",
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch {
      // If the payload is plain text, use it as the body
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: { url: data.url },
    vibrate: [100, 50, 100],
    requireInteraction: false,
    actions: [
      { action: "view", title: "Vezi" },
      { action: "dismiss", title: "Inchide" },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// ─── Notification Click ─────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  // "view" action or clicking the notification body — open the target URL
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If a window is already open at this URL, focus it
        for (const client of clientList) {
          const clientUrl = new URL(client.url);
          if (clientUrl.pathname === targetUrl && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise focus any existing window and navigate, or open a new one
        if (clientList.length > 0 && "focus" in clientList[0]) {
          return clientList[0].focus().then((client) => {
            if (client && "navigate" in client) {
              return client.navigate(targetUrl);
            }
          });
        }
        return clients.openWindow(targetUrl);
      })
  );
});
