// src/app/(app)/items/add/page.tsx

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { ItemForm } from "@/features/items/components/item-form";
import { createItemAction } from "@/features/items/server/items-actions";

export default async function AddItemPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <ItemForm
        mode="create"
        initialData={{}}
        onSubmit={async (values) => {
          "use server";
          return await createItemAction(values);
        }}
      />
    </div>
  );
}
