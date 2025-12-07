"use client";

import { useState, useTransition } from "react";
import type { Item, ItemFormData } from "@/features/items/types";
import { updateItemAction } from "@/features/items/server/items-actions";

interface Props {
  item: Item;
}

export default function ItemEditForm({ item }: Props) {
  const [pending, start] = useTransition();

  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? "");
  const [category, setCategory] = useState(item.category ?? "");
  const [condition, setCondition] = useState(item.condition ?? "");
  const [images, setImages] = useState(item.images ?? []);

  const submit = () => {
    start(async () => {
      const payload: ItemFormData = {
        title,
        description,
        category,
        condition,
        images,
        type: item.type,
      };

      await updateItemAction(item.id, payload);
    });
  };

  return (
    <div className="space-y-4 p-4 border rounded-xl bg-white shadow-sm">
      <div>
        <label className="block text-sm font-medium">Titlu</label>
        <input
          className="w-full border rounded p-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Descriere</label>
        <textarea
          className="w-full border rounded p-2"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Categorie</label>
        <input
          className="w-full border rounded p-2"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Stare obiect</label>
        <input
          className="w-full border rounded p-2"
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
        />
      </div>

      {/* IMAGES PREVIEW */}
      <div>
        <label className="block text-sm font-medium mb-1">Imagini</label>
        <div className="flex gap-2 flex-wrap">
          {images.map((img, i) => (
            <img
              key={i}
              src={img}
              className="w-20 h-20 object-cover rounded"
            />
          ))}
        </div>
      </div>

      {/* SAVE BUTTON */}
      <button
        onClick={submit}
        disabled={pending}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
      >
        {pending ? "Salvez..." : "Salvează modificările"}
      </button>
    </div>
  );
}
