// src/app/(app)/swipe/supply/page.tsx

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import type { Item } from "@/features/items/types";
import { SwipeDeck } from "@/features/swipe/components/swipe-deck";

const mapRowToItem = (row: any): Item => {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description ?? "",
    category: row.category ?? "Fără categorie",
    subcategory: row.subcategory ?? undefined,
    tags: row.tags ?? [],
    condition: row.condition ?? "good",
    status: row.status ?? "active",
    locationCity: row.location_city ?? undefined,
    locationCountry: row.location_country ?? undefined,
    approximateValue: row.approximate_value ?? undefined,
    currency: row.currency ?? undefined,
    images: row.images ?? [],
    aiMetadata: row.ai_metadata ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export default async function SwipeSupplyPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("status", "active")
    .neq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("SwipeSupplyPage: error loading items", error);
  }

  const items: Item[] = (data ?? []).map(mapRowToItem);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Descoperă ce ai putea primi</h1>
      <p className="text-gray-600 mb-6 text-sm">
        Glisează prin obiectele altor utilizatori și spune ce te interesează.
      </p>

      <SwipeDeck kind="supply" items={items} />
    </div>
  );
}
