// ./components/items/ItemForm.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { ItemFormData, ItemImage, Item } from "@/features/items/types";

export type ItemFormProps = {
  mode: "create" | "edit";
  initialData?: Partial<ItemFormData>;
  onSubmit: (values: ItemFormData) => Promise<Item>;
};

function firstImageUrl(images?: ItemImage[] | null): string {
  if (!images || images.length === 0) return "";
  return images[0]?.url ?? "";
}

export default function ItemForm({ mode, initialData, onSubmit }: ItemFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");

  const initialFirstUrl = useMemo(
    () => firstImageUrl(initialData?.images ?? []),
    [initialData?.images]
  );

  const [imageUrl, setImageUrl] = useState(initialFirstUrl);
  const [imagePreview, setImagePreview] = useState(initialFirstUrl);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // dacă initialData se schimbă (edit page după fetch), sincronizează state-ul
  useEffect(() => {
    setTitle(initialData?.title || "");
    setDescription(initialData?.description || "");

    const url = firstImageUrl(initialData?.images ?? []);
    setImageUrl(url);
    setImagePreview(url);
  }, [initialData?.title, initialData?.description, initialData?.images]);

  const handlePreview = () => {
    setImagePreview(imageUrl.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const url = imageUrl.trim();

      const images: ItemImage[] = url
        ? [
            {
              url,
              publicId: "manual",
            },
          ]
        : [];

      // Construim un ItemFormData “minim” + restul câmpurilor dacă există în schema ta.
      // Nu băgăm image_url nicăieri.
      const values: ItemFormData = {
        title: title.trim(),
        description: description.trim(),
        images,
        category: initialData?.category ?? "",
        subcategory: initialData?.subcategory ?? "",
        tags: initialData?.tags ?? [],
        condition: initialData?.condition ?? "good",
        locationCity: initialData?.locationCity ?? "",
        locationCountry: initialData?.locationCountry ?? "",
        approximateValue: initialData?.approximateValue,
        currency: initialData?.currency,
        aiMetadata: initialData?.aiMetadata,
      };

      await onSubmit(values);
    } catch (err: any) {
      setError(err?.message || "Failed to save item.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Title</label>
        <input
          className="mt-1 w-full rounded-md border px-3 py-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Mountain bike"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea
          className="mt-1 w-full rounded-md border px-3 py-2"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the item…"
          rows={4}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Image URL (optional)</label>
        <div className="mt-1 flex gap-2">
          <input
            className="w-full rounded-md border px-3 py-2"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
          />
          <button
            type="button"
            onClick={handlePreview}
            className="rounded-md border px-3 py-2 text-sm"
          >
            Preview
          </button>
        </div>

        {imagePreview ? (
          <div className="mt-3">
            {/* păstrez <img> simplu; dacă vrei, trecem pe next/image după ce build-ul e verde */}
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imagePreview}
              alt="Preview"
              className="max-h-64 w-auto rounded-md border"
            />
          </div>
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? "Saving…" : mode === "edit" ? "Save changes" : "Create item"}
      </button>
    </form>
  );
}
