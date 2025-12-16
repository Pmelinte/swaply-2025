// ./app/items/[id]/edit/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

import type { ItemFormData, ItemImage, Item } from "@/features/items/types";
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

  const handleSubmit = async (values: ItemFormData): Promise<Item> => {
    const id = params?.id;
    if (!id) {
      throw new Error("Missing item id in route params.");
    }

    // “Bătrânul” câmp image_url + “noul” câmp images.
    // Scriu ambele ca să nu te lovești de mismatch între DB și UI.
    const images = values.images ?? [];
    const firstImageUrl = images.length > 0 ? images[0]?.url ?? null : null;

    const payload: Record<string, unknown> = {
      title: values.title,
      description: values.description,
      images, // dacă există coloana
      image_url: firstImageUrl, // fallback pt scheme vechi
      category: values.category,
      subcategory: values.subcategory,
      tags: values.tags,
      condition: values.condition,
      location_city: values.locationCity,
      location_country: values.locationCountry,
      approximate_value: values.approximateValue,
      currency: values.currency,
      ai_metadata: values.aiMetadata,
    };

    // elimină cheile undefined (ca să nu “șteargă” din greșeală)
    for (const key of Object.keys(payload)) {
      if (payload[key] === undefined) delete payload[key];
    }

    const { data, error } = await supabase
      .from("items")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    // după salvare, navighează înapoi
    router.push("/items");

    return data as Item;
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold">Edit item</h1>

      <div className="mt-4">
        <ItemForm mode="edit" initialData={initialData} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
