// src/app/(app)/my/items/page.tsx

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import type { Item } from "@/features/items/types";
import { listUserItemsAction } from "@/features/items/server/items-actions";
import ItemRowActions from "@/features/items/components/ItemRowActions";

export default async function MyItemsPage() {
  // verificăm user-ul autentificat
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // luăm itemele userului prin server action
  let items: Item[] = [];
  try {
    items = await listUserItemsAction();
  } catch (e) {
    // dacă acțiunea eșuează (ex: sesiune invalidă), îl trimitem la login
    redirect("/login");
  }

  const active = items.filter((item) => !item.archived);
  const archived = items.filter((item) => item.archived);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-2">Obiectele mele</h1>

      {/* ACTIVE */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Active</h2>
        {active.length === 0 ? (
          <p className="text-gray-600 text-sm">
            Nu ai încă obiecte active. Adaugă unul nou din meniul principal.
          </p>
        ) : (
          <div className="space-y-3">
            {active.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* ARCHIVED */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Arhivate</h2>
        {archived.length === 0 ? (
          <p className="text-gray-600 text-sm">Nu ai obiecte arhivate.</p>
        ) : (
          <div className="space-y-3">
            {archived.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ItemRow({ item }: { item: Item }) {
  return (
    <div className="p-4 border rounded-xl bg-gray-50">
      <a href={`/items/${item.id}`} className="block">
        <p className="font-semibold">{item.title}</p>
        <p className="text-xs text-gray-500 mt-1">
          Creat la {String(item.createdAt ?? "").slice(0, 10)}
        </p>
      </a>

      <div className="mt-2">
        <ItemRowActions itemId={item.id} />
      </div>
    </div>
  );
}
