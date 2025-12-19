// src/app/(app)/items/[id]/edit/page.tsx

import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import type { ItemFormData, ItemImage, Item } from "@/features/items/types";
import { ItemForm } from "@/features/items/components/item-form";

import {
  getItemServer,
  updateItemServer,
} from "@/features/items/server/items-actions";

type DbItem = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  category: string | null;
  subcategory: string | null;
  tags: string[] | null;
  condition: string | null;
  location_city: string | null;
  location_country: string | null;
  approximate_value: number | null;
  currency: string | null;
  image_url: string | null; // legacy
  images: any[] | null;
  ai_metadata: any | null;
  status: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string | null;
};

function dbToFormData(row: any): ItemFormData {
  const images: ItemImage[] = Array.isArray(row.images)
    ? row.images
    : row.image_url
      ? [{ url: row.image_url, publicId: "legacy" }]
      : [];

  return {
    title: row.title ?? "",
    description: row.description ?? "",

    category: row.category ?? "",
    subcategory: row.subcategory ?? "",

    tags: Array.isArray(row.tags) ? row.tags : [],

    condition: (row.condition ?? "good") as any,

    locationCity: row.location_city ?? "",
    locationCountry: row.location_country ?? "",

    approximateValue:
      typeof row.approximate_value === "number" ? row.approximate_value : undefined,
    currency: row.currency ?? undefined,

    images,

    aiMetadata: row.ai_metadata ?? undefined,

    status: row.status ?? undefined,

    isActive: typeof row.is_active === "boolean" ? row.is_active : undefined,
  } as any;
}

export default async function EditItemPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const item = await getItemServer(params.id);
  if (!item) notFound();

  if (item.ownerId !== user.id) {
    redirect("/items");
  }

  const initialData = dbToFormData(item as any);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Editează item</h1>

      <ItemForm
        mode="edit"
        initialData={initialData}
        onSubmit={async (values) => {
          // folosim wrapper-ul care nu cere supabase ca param
          const updated = await updateItemServer(params.id, values);
          return updated as Item;
        }}
      />
    </div>
  );
}
