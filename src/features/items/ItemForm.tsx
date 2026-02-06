"use client";

import Image from "next/image";
import { useState } from "react";
import { z } from "zod";
import { Item } from "@/lib/types";
import { uploadItemPhoto } from "@/lib/storage";

export const ITEM_CATEGORIES = [
  "Electronică",
  "Sport & Outdoor",
  "Hobby & Jocuri",
  "Cărți & Media",
  "Casă & Grădină",
  "Modă & Accesorii",
] as const;

const CONDITIONS = [
  { value: "new", label: "Nou" },
  { value: "good", label: "Puțin utilizat" },
  { value: "used", label: "Utilizat / antichitate" },
] as const;

const STATUSES = [
  { value: "active", label: "Activ" },
  { value: "reserved", label: "Rezervat" },
  { value: "swapped", label: "Schimbat" },
] as const;

const itemSchema = z.object({
  title: z
    .string()
    .min(3, "Titlul trebuie să aibă cel puțin 3 caractere.")
    .max(120, "Titlul nu poate depăși 120 caractere."),
  category: z.enum(ITEM_CATEGORIES, {
    errorMap: () => ({ message: "Alege o categorie validă." }),
  }),
  condition: z.enum(["new", "good", "used"]),
  description: z
    .string()
    .min(10, "Descrierea trebuie să aibă cel puțin 10 caractere.")
    .max(2000, "Descrierea nu poate depăși 2000 caractere."),
  wishlist: z.string().max(500, "Dorința nu poate depăși 500 caractere.").optional().default(""),
  location: z.string().min(2, "Specifică o locație (oraș sau zonă)."),
  userFinalTags: z.array(z.string()).max(10, "Maximum 10 taguri.").optional().default([]),
});

type FieldErrors = Partial<Record<keyof z.infer<typeof itemSchema>, string>>;

const inputClass =
  "mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-zinc-800";
const inputNormal =
  `${inputClass} border-zinc-200 bg-white dark:border-zinc-700`;
const inputError =
  `${inputClass} border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950/30`;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{message}</p>
  );
}

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
  const [preview, setPreview] = useState<string | null>(
    item.photos[0] ?? null,
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");

  const validate = (): boolean => {
    const result = itemSchema.safeParse({
      title: draft.title,
      category: draft.category,
      condition: draft.condition,
      description: draft.description,
      wishlist: draft.wishlist,
      location: draft.location,
      userFinalTags: draft.userFinalTags,
    });
    if (result.success) {
      setErrors({});
      return true;
    }
    const fieldErrors: FieldErrors = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as keyof FieldErrors;
      if (!fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    setErrors(fieldErrors);
    return false;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave(draft);
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (!tag || (draft.userFinalTags ?? []).includes(tag)) return;
    setDraft({
      ...draft,
      userFinalTags: [...(draft.userFinalTags ?? []), tag],
    });
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setDraft({
      ...draft,
      userFinalTags: (draft.userFinalTags ?? []).filter((t) => t !== tag),
    });
  };

  return (
    <form
      className="space-y-4 rounded-2xl border border-zinc-200 bg-white/90 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80"
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit();
      }}
      noValidate
    >
      {/* Image upload */}
      <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Imagine (opțional)
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={uploading}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploading(true);
              setUploadError(null);
              const result = await uploadItemPhoto(file, draft.ownerId);
              setUploading(false);
              if (result.error) {
                setUploadError(result.error);
                return;
              }
              if (result.url) {
                setPreview(result.url);
                setDraft({ ...draft, photos: [result.url] });
              }
            }}
            className={inputNormal}
          />
          {uploading ? (
            <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
              Se încarcă imaginea...
            </p>
          ) : uploadError ? (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {uploadError}
            </p>
          ) : (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              JPG, PNG, WebP sau GIF. Max 5 MB.
            </p>
          )}
        </label>
        <div className="flex items-center justify-center overflow-hidden rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/60">
          {preview ? (
            <Image
              src={preview}
              alt="Previzualizare"
              width={400}
              height={240}
              className="h-36 w-full rounded-lg object-cover"
              unoptimized
            />
          ) : (
            <p className="text-center text-xs">
              Fără imagine. Poți adăuga una mai târziu.
            </p>
          )}
        </div>
      </div>

      {/* Title + Category */}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Titlu *
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="ex: Monitor 24 inch IPS"
            maxLength={120}
            className={errors.title ? inputError : inputNormal}
          />
          <FieldError message={errors.title} />
        </label>
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Categorie *
          <select
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            className={errors.category ? inputError : inputNormal}
          >
            <option value="">— Alege categoria —</option>
            {ITEM_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <FieldError message={errors.category} />
        </label>
      </div>

      {/* Description */}
      <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
        Descriere *
        <textarea
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          placeholder="Descrie obiectul cât mai detaliat: stare, defecte, accesorii incluse..."
          maxLength={2000}
          className={errors.description ? inputError : inputNormal}
          rows={4}
        />
        <div className="mt-1 flex justify-between">
          <FieldError message={errors.description} />
          <span className="text-xs text-zinc-400">
            {draft.description.length}/2000
          </span>
        </div>
      </label>

      {/* Wishlist */}
      <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
        Ce îți dorești în schimb
        <input
          value={draft.wishlist}
          onChange={(e) => setDraft({ ...draft, wishlist: e.target.value })}
          placeholder="ex: Bicicletă, consolă de jocuri, sau orice electronic..."
          maxLength={500}
          className={errors.wishlist ? inputError : inputNormal}
        />
        <FieldError message={errors.wishlist} />
      </label>

      {/* Condition + Status + Location */}
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Stare obiect *
          <select
            value={draft.condition}
            onChange={(e) =>
              setDraft({
                ...draft,
                condition: e.target.value as Item["condition"],
              })
            }
            className={inputNormal}
          >
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Status
          <select
            value={draft.status}
            onChange={(e) =>
              setDraft({
                ...draft,
                status: e.target.value as Item["status"],
              })
            }
            className={inputNormal}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Locație *
          <input
            value={draft.location}
            onChange={(e) => setDraft({ ...draft, location: e.target.value })}
            placeholder="ex: Cluj-Napoca"
            className={errors.location ? inputError : inputNormal}
          />
          <FieldError message={errors.location} />
        </label>
      </div>

      {/* User tags */}
      <div className="text-sm">
        <p className="font-semibold text-zinc-700 dark:text-zinc-200">
          Taguri (opțional)
        </p>
        <div className="mt-1 flex gap-2">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Adaugă tag și apasă Enter"
            maxLength={30}
            className={`${inputNormal} flex-1`}
          />
          <button
            type="button"
            onClick={addTag}
            className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            +
          </button>
        </div>
        {(draft.userFinalTags ?? []).length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {(draft.userFinalTags ?? []).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-0.5 text-blue-600 hover:text-blue-900 dark:text-blue-300"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}
        <FieldError message={errors.userFinalTags} />
      </div>

      {/* AI tags (read-only) */}
      {(draft.aiSuggestedTags ?? []).length > 0 ? (
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          Sugestii AI:{" "}
          {draft.aiSuggestedTags!.map((tag) => (
            <span
              key={tag}
              className="mr-1 inline-block rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-full px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Renunță
        </button>
        <button
          type="submit"
          disabled={saving || uploading}
          className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Se salvează..." : uploading ? "Se încarcă imaginea..." : "Salvează"}
        </button>
      </div>
    </form>
  );
}
