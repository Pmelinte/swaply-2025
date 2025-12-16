// ./app/items/[id]/edit/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

import type { ItemFormData, ItemImage } from "@/features/items/types";
import { ItemForm } from "@/features/items/components/item-form";

type DbItem = {
  id: string;
  title: string | null;
  description: string | null;
  image_url?: string | null;
  images?: ItemImage[] | null;
};

export default function EditItemPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createBrowserClient(url, anon);
  }, []);

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<DbItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = params?.id;
    if (!id) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("items")
        .select("id,title,description,image_url,images")
        .eq("id", id)
        .single();

      if (cancelled) return;

      if (error) {
        setError(error.message);
        setItem(null);
      } else {
        setItem((data as DbItem) ?? null);
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [params?.id, supabase]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-xl font-semibold">Edit item</h1>
        <p className="mt-2 text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-xl font-semibold">Edit item</h1>
        <p className="mt-2 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-xl font-semibold">Edit item</h1>
        <p className="mt-2 text-sm text-muted-foreground">Item not found.</p>
      </div>
    );
  }

  const initialData: Partial<ItemFormData> = {
    title: item.title ?? "",
    description: item.description ?? "",
    images:
      item.images ??
      (item.image_url
        ? [
            {
              url: item.image_url,
              publicId: "legacy",
            } as ItemImage,
          ]
        : []),
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold">Edit item</h1>

      <div className="mt-4">
        <ItemForm
          mode="edit"
          initialData={initialData}
          onDone={() => router.push("/items")}
        />
      </div>
    </div>
  );
}
