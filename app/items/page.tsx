"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Item } from "@/lib/types/item";

type ItemsApiResponse =
  | { ok: true; items: Item[] }
  | { ok: false; error: string };

function normalizeTags(tags: unknown): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.filter((t) => typeof t === "string") as string[];
  if (typeof tags === "string") return [tags];
  return [];
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        // Dacă ai endpoint /api/items, îl folosim.
        // Dacă nu, fallback pe Supabase direct (mai jos).
        const res = await fetch("/api/items", { cache: "no-store" }).catch(() => null);

        if (res && res.ok) {
          const data = (await res.json()) as ItemsApiResponse;
          if (!cancelled) {
            if (data.ok) setItems(data.items ?? []);
            else setError(data.error ?? "Failed to load items");
          }
          return;
        }

        // Fallback: fetch direct din Supabase (nu crăpăm build-ul)
        const supabase = getSupabaseBrowserClient();
        const { data: rows, error: sbErr } = await supabase
          .from("items")
          .select("*")
          .order("created_at", { ascending: false });

        if (sbErr) throw sbErr;
        if (!cancelled) setItems((rows ?? []) as Item[]);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Unexpected error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const content = useMemo(() => {
    if (loading) return <p className="p-6">Loading…</p>;
    if (error) return <p className="p-6 text-red-600">{error}</p>;
    if (!items.length) return <p className="p-6">No items yet.</p>;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {items.map((item) => {
          const tagsArr = normalizeTags((item as any).tags);

          const title = item.title ?? "(Untitled)";
          const description = item.description ?? "";
          const imageUrl = item.imageUrl ?? item.image_url ?? null;

          return (
            <div key={item.id} className="border rounded-xl overflow-hidden bg-white">
              {imageUrl ? (
                <div className="relative w-full h-48 bg-gray-100">
                  <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    style={{ objectFit: "cover" }}
                  />
                </div>
              ) : (
                <div className="w-full h-48 bg-gray-100" />
              )}

              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold leading-snug">{title}</h2>
                  <Link
                    href={`/items/${item.id}/edit`}
                    className="text-sm underline whitespace-nowrap"
                  >
                    Edit
                  </Link>
                </div>

                {description ? (
                  <p className="text-sm text-gray-700 line-clamp-3">{description}</p>
                ) : null}

                {tagsArr.length ? (
                  <div className="flex flex-wrap gap-2">
                    {tagsArr.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="text-xs text-gray-500">
                  {item.created_at ? `Created: ${item.created_at}` : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [items, loading, error]);

  return (
    <main>
      <div className="p-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Items</h1>
        <Link href="/items/add" className="px-4 py-2 rounded-lg bg-black text-white">
          Add item
        </Link>
      </div>
      {content}
    </main>
  );
}
