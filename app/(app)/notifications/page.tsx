// src/app/(app)/notifications/page.tsx

"use client";

import { useEffect, useState } from "react";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
};

type ApiResponse =
  | { ok: true; notifications: Notification[]; unreadCount: number }
  | { ok: false; error: string };

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications", { cache: "no-store" });
      const data: ApiResponse = await res.json();

      if (!res.ok || !data.ok) {
        setError((data as any)?.error ?? "Eroare la încărcare.");
        return;
      }

      setItems(data.notifications);
      setUnreadCount(data.unreadCount);
      setError(null);
    } catch (err) {
      console.error("[NOTIFICATIONS_UI_LOAD_ERROR]", err);
      setError("Eroare la încărcare.");
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications/read", { method: "POST" });
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      alert("Nu s-au putut marca notificările.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notificări</h1>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-blue-600 hover:underline"
          >
            Marchează toate ca citite
          </button>
        )}
      </div>

      {loading && <p>Se încarcă…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && items.length === 0 && (
        <p className="text-gray-600">Nu ai notificări.</p>
      )}

      <div className="space-y-3">
        {items.map((n) => (
          <div
            key={n.id}
            className={`border rounded-lg p-3 ${
              n.isRead ? "bg-white" : "bg-blue-50 border-blue-300"
            }`}
          >
            <div className="flex justify-between items-start gap-2">
              <div>
                <div className="font-semibold">{n.title}</div>
                {n.body && (
                  <div className="text-sm text-gray-700">{n.body}</div>
                )}
              </div>

              {!n.isRead && (
                <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                  nou
                </span>
              )}
            </div>

            <div className="text-xs text-gray-500 mt-1">
              {new Date(n.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}