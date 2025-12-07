// src/app/(app)/items/[id]/edit/page.tsx

import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { ItemForm } from "@/features/items/components/item-form";
import {
  getItemAction,
  updateItemAction,
} from "@/features/items/server/items-actions";

interface EditPageProps {
  params: { id: string };
}

export default async function EditItemPage({ params }: EditPageProps) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const item = await getItemAction(params.id);
  if (!item) notFound();

  if (item.ownerId !== user.id) {
    redirect("/"); // interzis să editezi obiectul altuia
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <ItemForm
        mode="edit"
        initialData={item}
        onSubmit={async (values) => {
          "use server";
          return await updateItemAction(item.id, values);
        }}
      />
    </div>
  );
}
