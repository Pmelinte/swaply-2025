"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
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
    .max(2000, "Descrierea nu poate depăși 2000 caractere.")
    .optional()
    .default(""),
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

const MAX_IMAGE_DIMENSION = 1200;

/** Resize image on client to max 1200px, returns a new File */
function resizeImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      let { width, height } = img;
      if (width <= MAX_IMAGE_DIMENSION && height <= MAX_IMAGE_DIMENSION) {
        resolve(file);
        return;
      }
      const ratio = Math.min(MAX_IMAGE_DIMENSION / width, MAX_IMAGE_DIMENSION / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name, { type: file.type || "image/jpeg" }));
        },
        file.type || "image/jpeg",
        0.85,
      );
    };
    img.onerror = () => reject(new Error("Nu s-a putut citi imaginea."));
    img.src = URL.createObjectURL(file);
  });
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
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<string | null>(null);
  const [imageAiLoading, setImageAiLoading] = useState(false);
  const [imageAiStatus, setImageAiStatus] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [imageUrlError, setImageUrlError] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const aiTriggered = useRef(false);

  const triggerAiOnBlur = useCallback(() => {
    if (aiTriggered.current || aiLoading) return;
    if (draft.title.length >= 3) {
      aiTriggered.current = true;
      void fetchAiSuggestionsInternal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.title, aiLoading]);

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

  const fetchAiSuggestionsInternal = async () => {
    if (!draft.title && !draft.description) {
      setAiStatus("Scrie un titlu sau descriere mai întâi.");
      return;
    }
    setAiLoading(true);
    setAiStatus(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          description: draft.description,
          action: "both",
        }),
      });
      const data = await res.json();
      const updates: Partial<Item> = {};
      if (data.category && ITEM_CATEGORIES.includes(data.category)) {
        updates.category = data.category;
      }
      if (data.tags?.length) {
        updates.aiSuggestedTags = data.tags;
      }
      setDraft((prev) => ({ ...prev, ...updates }));
      setAiStatus(
        data.status === "ok"
          ? "Categorie și taguri sugerate de AI!"
          : data.status === "fallback"
            ? "Sugestii locale aplicate (AI indisponibil)."
            : "Eroare AI, încearcă din nou.",
      );
    } catch {
      setAiStatus("Eroare de rețea. Încearcă din nou.");
    } finally {
      setAiLoading(false);
    }
  };

  const fetchAiSuggestions = () => {
    aiTriggered.current = true;
    void fetchAiSuggestionsInternal();
  };

  const analyzeImageWithAi = async (imageUrl: string, file?: File) => {
    setImageAiLoading(true);
    setImageAiStatus("Se analizează imaginea cu AI...");
    try {
      let body: Record<string, string>;

      if (imageUrl.startsWith("blob:") && file) {
        // Blob URLs can't be fetched server-side — send as base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        body = { imageBase64: base64 };
      } else {
        body = { imageUrl };
      }

      const res = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.status === "ok") {
        const updates: Partial<Item> = {};
        if (data.title) {
          updates.title = data.title;
        }
        if (data.category && ITEM_CATEGORIES.includes(data.category)) {
          updates.category = data.category;
        }
        setDraft((prev) => ({ ...prev, ...updates }));
        setImageAiStatus(
          `AI: "${data.caption}" → Titlu și categorie completate automat. Poți modifica.`,
        );
      } else {
        setImageAiStatus(data.message || "AI nu a putut analiza imaginea.");
      }
    } catch {
      setImageAiStatus("Eroare de rețea la analiza imaginii.");
    } finally {
      setImageAiLoading(false);
    }
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
      {/* Image upload / URL */}
      <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Imagine (opțional)
          </p>

          {/* File upload */}
          <label className="text-xs text-zinc-500 dark:text-zinc-400">
            Încarcă fișier
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={uploading || loadingUrl}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                setUploadError(null);
                setImageUrlError(null);
                try {
                  const resized = await resizeImage(file);
                  const result = await uploadItemPhoto(resized, draft.ownerId);
                  if (result.error) {
                    setUploadError(result.error);
                    return;
                  }
                  if (result.url) {
                    setPreview(result.url);
                    setDraft((prev) => ({ ...prev, photos: [result.url!] }));
                    void analyzeImageWithAi(result.url, resized);
                  }
                } catch {
                  setUploadError("Eroare la procesarea imaginii.");
                } finally {
                  setUploading(false);
                }
              }}
              className={inputNormal}
            />
          </label>
          {uploading && (
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Se încarcă și redimensionează imaginea...
            </p>
          )}
          {uploadError && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {uploadError}
            </p>
          )}

          {/* Separator */}
          <div className="flex items-center gap-2">
            <hr className="flex-1 border-zinc-200 dark:border-zinc-700" />
            <span className="text-xs text-zinc-400">sau</span>
            <hr className="flex-1 border-zinc-200 dark:border-zinc-700" />
          </div>

          {/* URL input */}
          <label className="text-xs text-zinc-500 dark:text-zinc-400">
            Lipește link imagine
            <div className="mt-1 flex gap-2">
              <input
                type="url"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="https://..."
                disabled={uploading || loadingUrl}
                className={`${inputNormal} flex-1`}
              />
              <button
                type="button"
                disabled={uploading || loadingUrl || !imageUrlInput.trim()}
                onClick={async () => {
                  const url = imageUrlInput.trim();
                  if (!url) return;
                  try {
                    new URL(url);
                  } catch {
                    setImageUrlError("URL invalid.");
                    return;
                  }
                  setLoadingUrl(true);
                  setImageUrlError(null);
                  setUploadError(null);
                  try {
                    // Verify the URL loads as an image
                    const ok = await new Promise<boolean>((resolve) => {
                      const img = new window.Image();
                      img.onload = () => resolve(true);
                      img.onerror = () => resolve(false);
                      img.src = url;
                    });
                    if (!ok) {
                      setImageUrlError("Link-ul nu conține o imagine validă.");
                      return;
                    }
                    setPreview(url);
                    setDraft((prev) => ({ ...prev, photos: [url] }));
                    setImageUrlInput("");
                    void analyzeImageWithAi(url);
                  } catch {
                    setImageUrlError("Nu s-a putut încărca imaginea.");
                  } finally {
                    setLoadingUrl(false);
                  }
                }}
                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {loadingUrl ? "Se verifică..." : "Adaugă"}
              </button>
            </div>
          </label>
          {imageUrlError && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {imageUrlError}
            </p>
          )}

          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            JPG, PNG, WebP sau GIF. Max 5 MB. Imaginile sunt redimensionate automat.
          </p>
        </div>

        {/* Preview */}
        <div className="flex flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/60">
          <Image
            src={preview || "/no-image.svg"}
            alt={preview ? "Previzualizare" : "Fără imagine"}
            width={400}
            height={240}
            className="h-36 w-full rounded-lg object-cover"
            unoptimized
          />
          {!preview && (
            <p className="mt-2 text-xs text-zinc-400">Fără imagine</p>
          )}
          {preview && (
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                setDraft((prev) => ({ ...prev, photos: [] }));
                setImageAiStatus(null);
              }}
              className="mt-2 text-xs text-red-500 hover:text-red-700"
            >
              Șterge imaginea
            </button>
          )}
        </div>
      </div>

      {/* Image AI status */}
      {(imageAiLoading || imageAiStatus) && (
        <div
          className={`rounded-xl p-3 text-sm font-medium ${
            imageAiLoading
              ? "bg-purple-50 text-purple-900 dark:bg-purple-900/30 dark:text-purple-100"
              : imageAiStatus?.startsWith("AI:")
                ? "bg-green-50 text-green-900 dark:bg-green-900/30 dark:text-green-100"
                : "bg-yellow-50 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-100"
          }`}
        >
          {imageAiLoading ? "Se analizează imaginea cu AI..." : imageAiStatus}
        </div>
      )}

      {/* Title + Category */}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Titlu *
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            onBlur={triggerAiOnBlur}
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

      {/* AI Suggestions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={fetchAiSuggestions}
          disabled={aiLoading || saving}
          className="rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
        >
          {aiLoading ? "Se analizeaza..." : "Sugestii AI"}
        </button>
        {aiStatus ? (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{aiStatus}</span>
        ) : (
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            AI sugereaza categorie + taguri din titlu si descriere
          </span>
        )}
      </div>

      {/* Description */}
      <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
        Descriere (opțional)
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
