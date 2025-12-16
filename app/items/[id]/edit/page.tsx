"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import ItemForm from "@/components/items/ItemForm";
import type { Item } from "@/lib/types/item";

export default function EditItemPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const itemId = params?.id;

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        if (!itemId) throw new Error("Missing item id");

        const supabase = getSupabaseBrowserClient();
        const { data, error: sbErr } = await supabase
          .from("items")
          .select("*")
          .eq("id", itemId)
          .single();

        if (sbErr) throw sbErr;

        if (!cancelled) setItem((data ?? null) as Item | null);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load item");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [itemId]);

  if (loading) return <p className="p-6">Loading…</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!item) return <p className="p-6">Item not found.</p>;

  const title = item.title ?? ""; // <-- fix: mereu string
  const description = item.description ?? "";
  const image_url = item.image_url ?? null;

  return (
    <main className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit item</h1>
        <button
          className="underline"
          onClick={() => router.push("/items")}
          type="button"
        >
          Back
        </button>
      </div>

      <ItemForm
        mode="edit"
        itemId={itemId}
        initialData={{
          title,
          description,
          image_url,
        }}
        onDone={() => router.push("/items")}
      />
    </main>
  );
}
