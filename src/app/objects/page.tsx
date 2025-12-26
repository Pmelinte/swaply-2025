"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/state";
import { ItemCard } from "@/features/items/ItemCard";
import { LoggedOutGate, MissingDataCallout } from "@/components/gated";
import { CTAButton, SectionCard, StateShowcase } from "@/components/ui";

export default function ObjectsPage() {
  const { user, items, deleteItem } = useAppState();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [categoryFilter, items, search, statusFilter]);

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
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            <option value="all">Toate categoriile</option>
            <option value="Sport & Outdoor">Sport & Outdoor</option>
            <option value="Hobby & Jocuri">Hobby & Jocuri</option>
            <option value="Electronice">Electronice</option>
            <option value="General">General</option>
          </select>
          <select
            className="rounded-full border border-dashed border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-400"
            aria-label="Subcategorie (stub)"
            disabled
          >
            <option>Subcategorie (stub până la integrare)</option>
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Caută după titlu"
            className="flex-1 rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
          {user ? (
            <CTAButton href="/objects/new">Adaugă un obiect</CTAButton>
          ) : null}
        </div>

        {!user ? <LoggedOutGate returnTo="/objects" /> : null}

        {loading.items ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
            Se încarcă lista de obiecte din {dataSource === "supabase" ? "Supabase" : "mock data"}...
          </div>
        ) : visibleItems.length ? (
          <div className="space-y-3">
            {visibleItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onView={() => router.push(`/objects/${item.id}`)}
                onEdit={
                  user && item.ownerId === user.id
                    ? () => router.push(`/objects/${item.id}/edit`)
                    : undefined
                }
                onDelete={
                  user && item.ownerId === user.id
                    ? () => {
                        const confirmed = window.confirm(
                          "Confirmi ștergerea? În demo este o acțiune locală, dar real va notifica abonații.",
                        );
                        if (confirmed) deleteItem(item.id);
                      }
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
        {lastError ? (
          <p className="mt-3 text-sm text-red-700 dark:text-red-200">
            {lastError}
          </p>
        ) : null}
      </SectionCard>

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

      <StateShowcase
        title="Stări OBIECTE"
        states={[
          {
            key: "loading",
            title: "Listă în încărcare",
            description: "Skeleton pe carduri și buton disabled până sosesc obiectele filtrate.",
          },
          {
            key: "empty",
            title: "Fără obiecte filtrate",
            description: "Empty state + CTA către /objects/new sau /login, fără a returna 404.",
          },
          {
            key: "error",
            title: "Eroare la listare",
            description: "Mesaj clar + buton de reîncercare; permite navigarea înapoi la / pentru a continua fluxul.",
          },
        ]}
      />
    </div>
  );
}
