"use client";

import { useState } from "react";
import { Item } from "@/lib/types";

const categories = [
  "Sport & Outdoor",
  "Hobby & Jocuri",
  "Electronice",
  "General",
];

export function ItemForm({
  item,
  onSave,
  onCancel,
}: {
  item: Item;
  onSave: (item: Item) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Item>(item);

  return (
    <form
      className="space-y-3 rounded-2xl border border-zinc-200 bg-white/90 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(draft);
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Titlu
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            required
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </label>
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Categorie
          <select
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
        Descriere
        <textarea
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          required
          className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          rows={3}
        />
      </label>
      <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
        Ce îți dorești în schimb
        <input
          value={draft.wishlist}
          onChange={(e) => setDraft({ ...draft, wishlist: e.target.value })}
          placeholder="Descrie obiectul dorit"
          className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Stare
          <select
            value={draft.condition}
            onChange={(e) =>
              setDraft({ ...draft, condition: e.target.value as Item["condition"] })
            }
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            <option value="new">nou</option>
            <option value="good">bun</option>
            <option value="used">uzat</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Status
          <select
            value={draft.status}
            onChange={(e) =>
              setDraft({ ...draft, status: e.target.value as Item["status"] })
            }
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            <option value="active">activ</option>
            <option value="reserved">rezervat</option>
            <option value="swapped">schimbat</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Locație
          <input
            value={draft.location}
            onChange={(e) => setDraft({ ...draft, location: e.target.value })}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </label>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          Metadate AI păstrate separat: {draft.aiSuggestedTags?.join(", ") || "none"}
        </div>
        <div className="flex gap-2 text-sm font-semibold">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-4 py-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Renunță
          </button>
          <button
            type="submit"
            className="rounded-full bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Salvează
          </button>
        </div>
      </div>
    </form>
  );
}
