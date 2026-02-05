"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/state";
import { LoggedOutGate } from "@/components/gated";
import { CTAButton, NextStepRecommendation, Pill, SectionCard, StateShowcase } from "@/components/ui";
import { ItemCard } from "@/features/items/ItemCard";

const PAGE_SIZE = 3;

const categories = [
  "Toate",
  "Electronică",
  "Sport & Outdoor",
  "Hobby & Jocuri",
  "Cărți & Media",
  "Casă & Grădină",
];

export default function ObjectsPage() {
  const router = useRouter();
  const { user, items, deleteItem } = useAppState();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Toate");
  const [pageOffered, setPageOffered] = useState(0);
  const [pageWanted, setPageWanted] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const myItems = user ? items.filter((i) => i.ownerId === user.id) : [];
  const otherItems = user
    ? items.filter((i) => i.ownerId !== user.id && i.isActive)
    : items.filter((i) => i.isActive);

  const filterItems = (list: typeof items) =>
    list.filter((item) => {
      const matchesSearch =
        !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        category === "Toate" || item.category === category;
      return matchesSearch && matchesCategory;
    });

  const filteredOffered = filterItems(myItems);
  const filteredWanted = filterItems(otherItems);

  const pagedOffered = filteredOffered.slice(
    pageOffered * PAGE_SIZE,
    (pageOffered + 1) * PAGE_SIZE,
  );
  const pagedWanted = filteredWanted.slice(
    pageWanted * PAGE_SIZE,
    (pageWanted + 1) * PAGE_SIZE,
  );

  const totalPagesOffered = Math.max(1, Math.ceil(filteredOffered.length / PAGE_SIZE));
  const totalPagesWanted = Math.max(1, Math.ceil(filteredWanted.length / PAGE_SIZE));

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      deleteItem(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
    }
  };

  return (
    <div className="space-y-5">
      <SectionCard
        title="Obiecte"
        description="Obiectele tale oferite și obiectele dorite de la alți utilizatori."
        action={
          user ? <CTAButton href="/objects/new">Adaugă obiect</CTAButton> : undefined
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPageOffered(0);
              setPageWanted(0);
            }}
            placeholder="Caută obiecte..."
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPageOffered(0);
              setPageWanted(0);
            }}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Subcategorii dezactivate în beta. Filtrarea se aplică ambelor secțiuni.
        </p>
      </SectionCard>

      {!user ? (
        <LoggedOutGate returnTo="/objects" />
      ) : (
        <SectionCard
          title="Obiecte oferite"
          description={`Obiectele tale listate pentru schimb (${filteredOffered.length})`}
          action={<CTAButton href="/objects/new">Adaugă</CTAButton>}
        >
          {pagedOffered.length > 0 ? (
            <div className="space-y-3">
              {pagedOffered.map((item) => (
                <div key={item.id}>
                  <ItemCard
                    item={item}
                    onView={() => router.push(`/objects/${item.id}`)}
                    onEdit={() => router.push(`/objects/${item.id}/edit`)}
                    onDelete={() => handleDelete(item.id)}
                  />
                  {deleteConfirm === item.id ? (
                    <div className="mt-1 rounded-lg bg-red-50 p-2 text-xs text-red-800 dark:bg-red-900/30 dark:text-red-200">
                      Sigur vrei să ștergi? Apasă din nou pe Șterge pentru confirmare.
                    </div>
                  ) : null}
                </div>
              ))}
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <button
                  type="button"
                  disabled={pageOffered === 0}
                  onClick={() => setPageOffered((p) => p - 1)}
                  className="rounded-full px-3 py-1 hover:bg-zinc-100 disabled:opacity-40 dark:hover:bg-zinc-800"
                >
                  ← Precedentă
                </button>
                <span>
                  {pageOffered + 1} / {totalPagesOffered}
                </span>
                <button
                  type="button"
                  disabled={pageOffered + 1 >= totalPagesOffered}
                  onClick={() => setPageOffered((p) => p + 1)}
                  className="rounded-full px-3 py-1 hover:bg-zinc-100 disabled:opacity-40 dark:hover:bg-zinc-800"
                >
                  Următoare →
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/60">
              Nu ai obiecte listate.{" "}
              <CTAButton href="/objects/new">Adaugă primul obiect</CTAButton>
            </div>
          )}
        </SectionCard>
      )}

      <SectionCard
        title="Obiecte dorite"
        description={`Obiecte disponibile de la alți utilizatori (${filteredWanted.length})`}
      >
        {pagedWanted.length > 0 ? (
          <div className="space-y-3">
            {pagedWanted.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onView={() => router.push(`/objects/${item.id}`)}
              />
            ))}
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <button
                type="button"
                disabled={pageWanted === 0}
                onClick={() => setPageWanted((p) => p - 1)}
                className="rounded-full px-3 py-1 hover:bg-zinc-100 disabled:opacity-40 dark:hover:bg-zinc-800"
              >
                ← Precedentă
              </button>
              <span>
                {pageWanted + 1} / {totalPagesWanted}
              </span>
              <button
                type="button"
                disabled={pageWanted + 1 >= totalPagesWanted}
                onClick={() => setPageWanted((p) => p + 1)}
                className="rounded-full px-3 py-1 hover:bg-zinc-100 disabled:opacity-40 dark:hover:bg-zinc-800"
              >
                Următoare →
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/60">
            Niciun obiect disponibil momentan.
          </div>
        )}
      </SectionCard>

      <NextStepRecommendation
        steps={
          user
            ? [
                { label: "Caută match-uri", href: "/match", description: "Descoperă potriviri pe baza obiectelor tale" },
                { label: "Deschide chat", href: "/chat", description: "Discută cu alți utilizatori despre schimburi" },
              ]
            : [
                { label: "Creează cont", href: "/login", description: "Autentifică-te pentru a lista obiecte" },
              ]
        }
      />

      <StateShowcase
        title="Stări OBIECTE"
        states={[
          {
            key: "loading",
            title: "Se încarcă lista de obiecte",
            description:
              "Afișăm skeleton pe carduri + placeholder pentru filtre.",
          },
          {
            key: "empty",
            title: "Niciun obiect",
            description:
              "Empty state vizibil cu CTA spre adăugare obiect nou.",
          },
          {
            key: "error",
            title: "Eroare la încărcarea obiectelor",
            description:
              "Mesaj clar fără crash; permit reîncărcarea paginii sau navigarea spre alte secțiuni.",
          },
        ]}
      />
    </div>
  );
}
