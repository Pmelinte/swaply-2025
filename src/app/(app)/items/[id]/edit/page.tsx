// src/app/(app)/items/[id]/edit/page.tsx

import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import type { ItemFormData, Item } from "@/features/items/types";
import { ItemForm } from "@/features/items/components/item-form";

import { getItemServer, updateItemServer } from "@/features/items/server/items-actions";

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

  if (item.ownerId !== user.id) redirect("/items");

  const initialData: ItemFormData = {
    title: item.title ?? "",
    description: item.description ?? "",

    category: item.category ?? "",
    subcategory: item.subcategory ?? "",

    tags: Array.isArray(item.tags) ? item.tags : [],

    condition: (item.condition ?? "good") as any,

    locationCity: item.locationCity ?? "",
    locationCountry: item.locationCountry ?? "",

    approximateValue: item.approximateValue,
    currency: item.currency,

    images: Array.isArray(item.images) ? item.images : [],

    aiMetadata: item.aiMetadata,

    // opționale (nu strică dacă ItemForm le ignoră)
    status: (item as any).status,
    isActive: (item as any).isActive,
  } as any;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Editează item</h1>

      <ItemForm
        mode="edit"
        initialData={initialData}
        onSubmit={async (values) => {
          "use server";
          const updated = await updateItemServer(params.id, values);
          return updated as Item;
        }}
      />
    </div>
  );
}
