"use client";

import { useMemo, useState } from "react";
import type {
  ItemCreateInput,
  ItemCondition,
  ItemFormData,
  ItemImage,
} from "@/features/items/types";

type Props = {
  mode?: "create" | "edit";
  initialValues?: Partial<ItemFormData>;
  onSubmit: (values: ItemFormData) => Promise<any>;
};

const CONDITION_OPTIONS: Array<{ value: ItemCondition; label: string }> = [
  { value: "new", label: "Nou" },
  { value: "like_new", label: "Ca nou" },
  { value: "good", label: "Bun" },
  { value: "fair", label: "Utilizat" },
  { value: "poor", label: "Defect" },
];

function firstImageUrl(images?: ItemImage[]) {
  const first = images?.[0]?.url;
  return typeof first === "string" && first.trim() ? first.trim() : "";
}

function normalizeTags(raw: string) {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function ItemForm({
  mode = "create",
  initialValues,
  onSubmit,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [values, setValues] = useState<ItemCreateInput>({
    title: initialValues?.title ?? "",
    description: initialValues?.description ?? "",

    category: initialValues?.category ?? "",
    subcategory: initialValues?.subcategory ?? "",

    tags: initialValues?.tags ?? [],

    condition: (initialValues?.condition ?? "good") as ItemCondition,

    locationCity: initialValues?.locationCity ?? "",
    locationCountry: initialValues?.locationCountry ?? "",

    approximateValue: initialValues?.approximateValue,
    currency: initialValues?.currency ?? "RON",

    images: initialValues?.images ?? [],
    aiMetadata: initialValues?.aiMetadata,
    status: initialValues?.status,
    isActive: initialValues?.isActive,
  });

  const [tagsText, setTagsText] = useState<string>(
    (values.tags ?? []).join(", ")
  );
  const [imageUrlText, setImageUrlText] = useState<string>(
    firstImageUrl(values.images)
  );

  const canSubmit = useMemo(() => {
    return (
      values.title.trim().length > 0 &&
      values.description.trim().length > 0 &&
      values.category.trim().length > 0 &&
      values.locationCity.trim().length > 0 &&
      values.locationCountry.trim().length > 0 &&
      !saving &&
      !uploading
    );
  }, [values, saving, uploading]);

  function patch<K extends keyof ItemCreateInput>(key: K, val: ItemCreateInput[K]) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  function setPrimaryImageUrl(url: string) {
    const clean = url.trim();
    setImageUrlText(clean);

    if (!clean) {
      patch("images", []);
      return;
    }

    const next: ItemImage[] = [{ url: clean, isPrimary: true }];
    patch("images", next);
  }

  async function handleLocalFile(file: File) {
    setUploadError(null);
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/upload-image", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          (data && (data.error || data.message)) ||
          `Upload failed (HTTP ${res.status})`;
        throw new Error(msg);
      }

      const url =
        (data && (data.url || data.secure_url)) ||
        (data && data.result && (data.result.url || data.result.secure_url));

      if (!url || typeof url !== "string") {
        throw new Error("Upload ok, dar nu am primit URL în răspuns.");
      }

      setPrimaryImageUrl(url);
    } catch (e: any) {
      setUploadError(e?.message || "Eroare la upload.");
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    setError(null);
    setSaving(true);

    try {
      const payload: ItemFormData = {
        ...values,
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category.trim(),
        subcategory: values.subcategory?.trim() || undefined,
        tags: normalizeTags(tagsText),
        locationCity: values.locationCity.trim(),
        locationCountry: values.locationCountry.trim(),
        currency: (values.currency ?? "RON").trim() || "RON",
        images: values.images ?? [],
      };

      await onSubmit(payload);
    } catch (e: any) {
      setError(e?.message || "A apărut o eroare la salvare.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full max-w-3xl">
      <div className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700">Titlu</label>
          <input
            value={values.title}
            onChange={(e) => patch("title", e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
            placeholder="Ex: Laptop"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Descriere</label>
          <textarea
            value={values.description}
            onChange={(e) => patch("description", e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
            rows={4}
            placeholder="Detalii…"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Categorie <span className="text-red-500">*</span>
            </label>
            <input
              value={values.category}
              onChange={(e) => patch("category", e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              placeholder="Ex: Electronics"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Subcategorie</label>
            <input
              value={values.subcategory ?? ""}
              onChange={(e) => patch("subcategory", e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              placeholder="Ex: Laptops"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tag-uri (virgulă)
          </label>
          <input
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
            placeholder="ex: office, gaming, i5"
          />
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Imagine (upload local)
            </label>
            <input
              type="file"
              accept="image/*"
              className="mt-1 block w-full text-sm"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleLocalFile(f);
              }}
              disabled={uploading || saving}
            />
            {uploading ? <p className="mt-2 text-sm text-gray-600">Se încarcă…</p> : null}
            {uploadError ? <p className="mt-2 text-sm text-red-600">{uploadError}</p> : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Imagine (URL)
            </label>
            <input
              value={imageUrlText}
              onChange={(e) => setPrimaryImageUrl(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              placeholder="https://..."
            />
          </div>

          <div className="rounded-lg border bg-gray-50 p-3">
            <div className="flex h-56 items-center justify-center overflow-hidden rounded-md bg-white">
              {imageUrlText ? (
                <img
                  src={imageUrlText}
                  alt="Preview"
                  className="max-h-full max-w-full object-contain"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-sm text-gray-400">Preview imagine</div>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Condiție</label>
          <select
            value={values.condition}
            onChange={(e) => patch("condition", e.target.value as ItemCondition)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          >
            {CONDITION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Oraș</label>
            <input
              value={values.locationCity}
              onChange={(e) => patch("locationCity", e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              placeholder="Ex: Tulcea"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Țară</label>
            <input
              value={values.locationCountry}
              onChange={(e) => patch("locationCountry", e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              placeholder="Ex: România"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Valoare (aprox.)
            </label>
            <input
              value={values.approximateValue ?? ""}
              onChange={(e) =>
                patch("approximateValue", e.target.value ? Number(e.target.value) : undefined)
              }
              className="mt-1 w-full rounded-lg border px-3 py-2"
              placeholder="Ex: 1500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Monedă</label>
            <input
              value={values.currency ?? "RON"}
              onChange={(e) => patch("currency", e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              placeholder="RON"
            />
          </div>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!canSubmit}
            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Se salvează…" : mode === "edit" ? "Salvează" : "Creează"}
          </button>
        </div>
      </div>
    </div>
  );
}
