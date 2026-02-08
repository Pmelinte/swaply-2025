"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { z } from "zod";
import type { Item, ItemIntent, ItemFlexibility, ItemPerceivedValue, ItemConditionImpact, ItemClarity, ItemContext } from "@/lib/types";
import { uploadItemPhoto } from "@/lib/storage";
import { TOP_CATEGORIES, getSubcategories, CATEGORY_NAMES, findCategoryByName } from "@/lib/categories";

export const ITEM_CATEGORIES = CATEGORY_NAMES;

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
  category: z.string().min(1, "Alege o categorie valida."),
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
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<string | null>(null);

  // Cascading category state
  const initParent = useMemo(() => {
    if (!item.category) return "";
    const node = findCategoryByName(item.category);
    if (!node) return "";
    return node.parentId ?? node.id;
  }, [item.category]);
  const [selectedParent, setSelectedParent] = useState(initParent);
  const subcategories = useMemo(
    () => (selectedParent ? getSubcategories(selectedParent) : []),
    [selectedParent],
  );

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

  const fetchAiSuggestions = async () => {
    if (!draft.title && !draft.description) {
      setAiStatus("Scrie un titlu sau descriere mai intai.");
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
          ? "Sugestii AI aplicate!"
          : data.status === "fallback"
            ? "Sugestii locale aplicate (AI indisponibil)."
            : "Eroare AI, incearca din nou.",
      );
    } catch {
      setAiStatus("Eroare de retea. Incearca din nou.");
    } finally {
      setAiLoading(false);
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
          <Image
            src={preview || "/no-image.svg"}
            alt="Previzualizare"
            width={400}
            height={240}
            className="h-36 w-full rounded-lg object-cover"
            unoptimized={!preview}
          />
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
        <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          <p>Categorie *</p>
          <select
            value={selectedParent}
            onChange={(e) => {
              setSelectedParent(e.target.value);
              // Reset to parent category name when changing
              const parent = TOP_CATEGORIES.find((c) => c.id === e.target.value);
              setDraft({ ...draft, category: parent?.name ?? "" });
            }}
            className={errors.category ? inputError : inputNormal}
          >
            <option value="">— Alege categoria —</option>
            {TOP_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {/* Subcategory (appears when parent is selected) */}
          {subcategories.length > 0 ? (
            <select
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              className={`${inputNormal} mt-1`}
            >
              <option value={TOP_CATEGORIES.find((c) => c.id === selectedParent)?.name ?? ""}>
                — Toate din {TOP_CATEGORIES.find((c) => c.id === selectedParent)?.name} —
              </option>
              {subcategories.map((sub) => (
                <option key={sub.id} value={sub.name}>
                  {sub.name}
                </option>
              ))}
            </select>
          ) : null}
          <FieldError message={errors.category} />
        </div>
      </div>

      {/* AI Suggestions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void fetchAiSuggestions()}
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

      {/* ── Semantic contract fields (optional) ── */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900 dark:bg-blue-950/20">
        <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
          Detalii pentru analiza (optional)
        </p>
        <p className="mb-3 text-xs text-blue-600 dark:text-blue-400">
          Cu cat completezi mai multe detalii, cu atat AI-ul identifica potriviri mai bune. Nimic nu e obligatoriu.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* Intent */}
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Ce asteptare ai de la acest obiect?
            <select
              value={draft.intent ?? ""}
              onChange={(e) => setDraft({ ...draft, intent: (e.target.value || undefined) as ItemIntent | undefined })}
              className={inputNormal}
            >
              <option value="">— Nealeas —</option>
              <option value="explore">Explorez — vreau sa vad ce mi s-ar oferi</option>
              <option value="open">Deschis — as face un schimb daca apare ceva</option>
              <option value="committed">Caut schimb clar — am obiectul pentru asta</option>
              <option value="high_commitment">Angajament mare — schimb serios, fara tatonari</option>
            </select>
          </label>

          {/* Flexibility */}
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Cat de strict esti?
            <select
              value={draft.flexibility ?? ""}
              onChange={(e) => setDraft({ ...draft, flexibility: (e.target.value || undefined) as ItemFlexibility | undefined })}
              className={inputNormal}
            >
              <option value="">— Nealeas —</option>
              <option value="strict">Strict — vreau ceva foarte apropiat</option>
              <option value="moderate">Moderat — prefer X, dar accept si alternative</option>
              <option value="broad">Larg — surprinde-ma</option>
            </select>
          </label>

          {/* Perceived value */}
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Cum percepi valoarea obiectului?
            <select
              value={draft.perceivedValue ?? ""}
              onChange={(e) => setDraft({ ...draft, perceivedValue: (e.target.value || undefined) as ItemPerceivedValue | undefined })}
              className={inputNormal}
            >
              <option value="">— Nealeas —</option>
              <option value="small">Mica — usor de inlocuit</option>
              <option value="medium">Medie — valoare normala</option>
              <option value="large">Mare — important pentru mine</option>
              <option value="sentimental">Sentimentala — are o valoare aparte</option>
            </select>
          </label>

          {/* Clarity */}
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Cat de sigur esti pe ce vrei?
            <select
              value={draft.clarity ?? ""}
              onChange={(e) => setDraft({ ...draft, clarity: (e.target.value || undefined) as ItemClarity | undefined })}
              className={inputNormal}
            >
              <option value="">— Nealeas —</option>
              <option value="exploring">Nu sunt sigur, explorez</option>
              <option value="have_idea">Am o idee, dar sunt flexibil</option>
              <option value="know_exactly">Stiu exact ce vreau</option>
            </select>
          </label>

          {/* Context */}
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Contextul schimbului
            <select
              value={draft.context ?? ""}
              onChange={(e) => setDraft({ ...draft, context: (e.target.value || undefined) as ItemContext | undefined })}
              className={inputNormal}
            >
              <option value="">— Nealeas —</option>
              <option value="permanent">Permanent — disponibil oricand</option>
              <option value="vacation">Vacanta — contextual, temporar</option>
              <option value="temporary">Temporar — disponibil o perioada limitata</option>
              <option value="urgent">Urgent — cat mai repede</option>
            </select>
          </label>
        </div>

        {/* Checkboxes row */}
        <div className="mt-3 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={draft.acceptsBundle ?? false}
              onChange={(e) => setDraft({ ...draft, acceptsBundle: e.target.checked || undefined })}
              className="rounded border-zinc-300"
            />
            Accept pachet de obiecte
          </label>
          <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={draft.recipientMatters ?? false}
              onChange={(e) => setDraft({ ...draft, recipientMatters: e.target.checked || undefined })}
              className="rounded border-zinc-300"
            />
            Conteaza cui ajunge
          </label>
        </div>

        {/* Condition impact */}
        <div className="mt-3">
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Cum afecteaza starea obiectul? (selecteaza ce se aplica)
          </p>
          <div className="mt-1 flex flex-wrap gap-3">
            {([
              { value: "affects_value", label: "Afecteaza valoarea" },
              { value: "affects_usage", label: "Afecteaza utilizarea" },
              { value: "affects_durability", label: "Afecteaza durabilitatea" },
              { value: "affects_appearance", label: "Afecteaza doar aspectul" },
            ] as const).map((opt) => (
              <label key={opt.value} className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={(draft.conditionImpact ?? []).includes(opt.value)}
                  onChange={(e) => {
                    const current = draft.conditionImpact ?? [];
                    setDraft({
                      ...draft,
                      conditionImpact: e.target.checked
                        ? [...current, opt.value]
                        : current.filter((v) => v !== opt.value),
                    });
                  }}
                  className="rounded border-zinc-300"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* AI Note */}
        <label className="mt-3 block text-xs font-semibold text-zinc-700 dark:text-zinc-200">
          Mesaj pentru AI (optional)
          <input
            value={draft.aiNote ?? ""}
            onChange={(e) => setDraft({ ...draft, aiNote: e.target.value || undefined })}
            placeholder="ex: Nu ma grabesc, Prefer schimb local, Obiectul are o poveste..."
            maxLength={300}
            className={inputNormal}
          />
          <span className="text-[10px] text-zinc-400">AI-ul foloseste aceste informatii doar pentru analiza, nu sunt afisate public.</span>
        </label>
      </div>

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
