// Swaply service worker — installability, static assets and privacy-safe offline fallback.
const CACHE_NAME = "swaply-v4";
const OFFLINE_URL = "/offline.html";
const STATIC_ASSETS = [
  OFFLINE_URL,
  "/manifest.json",
  "/no-image.svg",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Authority and user data are always network-only. Never cache API responses.
  if (url.pathname.startsWith("/api/") || request.headers.has("authorization")) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const offline = await caches.match(OFFLINE_URL);
        return offline || new Response("Offline", { status: 503 });
      }),
    );
    return;
  }

  const cacheableDestination = ["style", "script", "font", "image"].includes(request.destination);
  if (!cacheableDestination) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && response.type === "basic") {
          const clone = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    }),
  );
});

self.addEventListener("push", (event) => {
  let data = {
    title: "Swaply",
    body: "You have a new notification.",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-96x96.png",
    url: "/en/notifications",
    tag: "swaply-default",
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      data: { url: data.url },
      requireInteraction: false,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const rawTarget = event.notification.data?.url;
  const target = typeof rawTarget === "string" && rawTarget.startsWith("/") ? rawTarget : "/en/notifications";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clientList) => {
      for (const client of clientList) {
        if (new URL(client.url).pathname === target && "focus" in client) return client.focus();
      }
      if (clientList[0] && "navigate" in clientList[0]) {
        await clientList[0].navigate(target);
        return clientList[0].focus();
      }
      return self.clients.openWindow(target);
    }),
  );
});
