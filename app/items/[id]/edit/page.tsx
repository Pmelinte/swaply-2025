// ./app/items/[id]/edit/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import type { ItemFormData, ItemImage } from "@/features/items/types";
import { ItemForm } from "@/features/items/components/item-form";

type DbItem = {
  id: string;
  title: string | null;
  description: string | null;
  // unele versiuni vechi aveau o singură imagine:
  image_url?: string | null;
  // versiunea nouă (corectă pt ItemFormData) are array de imagini:
  images?: ItemImage[] | null;
};

export default function EditItemPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

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

  // IMPORTANT: aici era bug-ul tău.
  // `ItemFormData` NU are `image_url`, dar are `images`.
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
          itemId={item.id}
          initialData={initialData}
          onDone={() => router.push("/items")}
        />
      </div>
    </div>
  );
}
