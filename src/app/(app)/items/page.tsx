// src/app/(app)/items/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ItemRow = {
  id: string;
  title: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type ApiOk = { ok: true; items: any[] };
type ApiErr = { ok: false; error: string };

export default function MyItemsPage() {
  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyDeleteId, setBusyDeleteId] = useState<string | null>(null);

  const hasItems = useMemo(() => items.length > 0, [items.length]);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/items?limit=50&offset=0", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      const data = (await res.json()) as ApiOk | ApiErr;

      if (!res.ok || !data.ok) {
        setError(!data.ok ? data.error : "failed_to_load_items");
        setItems([]);
        return;
      }

      const mapped: ItemRow[] = (data.items ?? []).map((x: any) => ({
        id: String(x.id),
        title: String(x.title ?? ""),
        isActive: Boolean(x.isActive),
        createdAt: x.createdAt,
        updatedAt: x.updatedAt,
      }));

      setItems(mapped);
    } catch (e: any) {
      setError(e?.message ?? "network_error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(id: string) {
    // delete hard momentan; soft-delete vine după UI
    setBusyDeleteId(id);
    setError(null);

    try {
      const res = await fetch(`/api/items/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const data = (await res.json()) as any;

      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "delete_failed");
        return;
      }

      await load();
    } catch (e: any) {
      setError(e?.message ?? "network_error");
    } finally {
      setBusyDeleteId(null);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <header className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">My Items</h1>

        <div className="ml-auto flex gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="px-3 py-2 rounded-lg border bg-white disabled:opacity-60"
          >
            Refresh
          </button>

          <Link
            href="/items/new"
            className="px-3 py-2 rounded-lg border bg-black text-white"
          >
            + Add
          </Link>
        </div>
      </header>

      {error && (
        <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-red-800">
          <strong>Oops:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="p-3">Loading…</div>
      ) : !hasItems ? (
        <div className="p-4 rounded-xl border border-dashed text-gray-600">
          No items yet. Hit <strong>+ Add</strong>.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <div
              key={it.id}
              className="p-3 rounded-xl border flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">
                  {it.title || "(untitled)"}
                </div>
                <div className="text-sm text-gray-600">
                  Status:{" "}
                  <span className="font-semibold">
                    {it.isActive ? "active" : "inactive"}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/items/${it.id}/edit`}
                  className="px-3 py-2 rounded-lg border bg-white"
                >
                  Edit
                </Link>

                <button
                  onClick={() => onDelete(it.id)}
                  disabled={busyDeleteId === it.id}
                  className="px-3 py-2 rounded-lg border border-red-200 bg-white disabled:opacity-60"
                >
                  {busyDeleteId === it.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
