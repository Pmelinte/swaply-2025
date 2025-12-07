// src/app/(app)/my/items/page.tsx

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { listUserItemsAction } from "@/features/items/server/items-actions";
import { MyItemsList } from "@/features/items/components/my-items-list";

export default async function MyItemsPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const items = await listUserItemsAction();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Obiectele mele</h1>

      <div className="mb-6">
        <a
          href="/items/add"
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          + Adaugă obiect
        </a>
      </div>

      <MyItemsList items={items} />
    </div>
  );
}
