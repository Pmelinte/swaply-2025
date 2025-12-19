// src/app/(app)/items/add/page.tsx

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import type { Item, ItemFormData } from "@/features/items/types";
import { ItemForm } from "@/features/items/components/item-form";
import { createItemServer } from "@/features/items/server/items-actions";

export default async function AddItemPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Adaugă item</h1>

      <ItemForm
        mode="create"
        onSubmit={async (values: ItemFormData) => {
          "use server";
          // ✅ wrapper cu 1 argument (nu Action care cere supabase/userId)
          const created = await createItemServer(values);
          return created as Item;
        }}
      />
    </div>
  );
}
