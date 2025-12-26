"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAppState } from "@/lib/state";
import { Item } from "@/lib/types";
import { ItemCard } from "@/features/items/ItemCard";
import { ItemForm } from "@/features/items/ItemForm";
import { LoggedOutGate, MissingDataCallout } from "@/components/gated";
import { CTAButton, SectionCard } from "@/components/ui";

export default function ObjectsPage() {
  const { user, items, startNewItem, upsertItem, deleteItem } = useAppState();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [items, search, statusFilter]);

  return (
    <div className="space-y-4">
      <SectionCard
        title="Obiecte disponibile"
        description="Listă + filtre + create/edit/delete + empty state."
        action={<CTAButton href="/objects/new">Flow complet adăugare</CTAButton>}
      >
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            <option value="all">Toate</option>
            <option value="active">Active</option>
            <option value="reserved">Rezervate</option>
            <option value="swapped">Schimbate</option>
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Caută după titlu"
            className="flex-1 rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
          {user ? (
            <button
              type="button"
              onClick={() => setEditingItem(startNewItem())}
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Adaugă un obiect
            </button>
          ) : null}
        </div>

        {!user ? <LoggedOutGate returnTo="/objects" /> : null}

        {visibleItems.length ? (
          <div className="space-y-3">
            {visibleItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onView={() => setEditingItem(item)}
                onEdit={user && item.ownerId === user.id ? () => setEditingItem(item) : undefined}
                onDelete={
                  user && item.ownerId === user.id
                    ? () => deleteItem(item.id)
                    : undefined
                }
              />
            ))}
          </div>
        ) : (
          <MissingDataCallout
            title="Fără obiecte"
            message="Adaugă un obiect pentru a porni recomandările."
            cta={<CTAButton href={user ? "/objects" : "/login"}>Începe acum</CTAButton>}
          />
        )}
      </SectionCard>

      {editingItem ? (
        <SectionCard title="Editor obiect" description="Metadate AI păstrate separat; preferința finală nu este suprascrisă.">
          <ItemForm
            item={editingItem}
            onSave={(item) => {
              upsertItem(item);
              setEditingItem(null);
            }}
            onCancel={() => setEditingItem(null)}
          />
        </SectionCard>
      ) : null}

      <SectionCard
        title="Obiecte publice"
        description="Flux swipe și card detaliat se regăsesc pe pagina obiectului."
      >
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Acces rapid la paginile de obiecte: link nu returnează 404 ci arată previzualizare blurată cu CTA login.
        </p>
        <div className="flex flex-wrap gap-2 text-sm font-semibold">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/objects/${item.id}`}
              className="rounded-full bg-zinc-900 px-3 py-1 text-white hover:bg-zinc-800"
            >
              {item.title}
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
