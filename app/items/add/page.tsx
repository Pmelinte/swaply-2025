// ./app/items/add/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

import ItemForm from "@/components/items/ItemForm";
import type { ItemFormData, Item } from "@/features/items/types";

export default function AddItemPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const createSupabaseClient = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anon) {
      throw new Error("Supabase env vars missing");
    }

    return createBrowserClient(url, anon);
  };

  const handleSubmit = async (values: ItemFormData): Promise<Item> => {
    setError(null);

    // creez payload DB-friendly (snake_case), fără image_url (noi folosim images)
    const payload: Record<string, unknown> = {
      title: values.title,
      description: values.description,
      images: values.images ?? [],
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

    for (const k of Object.keys(payload)) {
      if (payload[k] === undefined) delete payload[k];
    }

    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("items")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      setError(error.message);
      throw error;
    }

    router.push("/items");
    return data as Item;
  };

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">Add item</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a new listing.
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <ItemForm mode="create" onSubmit={handleSubmit} />
    </main>
  );
}
