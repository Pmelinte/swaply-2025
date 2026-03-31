"use client";

import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { z } from "zod";
import type { Item, ItemIntent, ItemFlexibility, ItemPerceivedValue, ItemClarity, ItemContext } from "@/lib/types";
import { uploadItemPhoto } from "@/lib/storage";
import { TOP_CATEGORIES, getSubcategories, CATEGORY_NAMES, findCategoryByName } from "@/lib/categories";
import { SubcategorySelector } from "@/components/SubcategorySelector";

export const ITEM_CATEGORIES = CATEGORY_NAMES;

type FieldErrors = Partial<Record<string, string>>;

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
function resizeImage(file: File, errorMsg: string): Promise<File> {
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
    img.onerror = () => reject(new Error(errorMsg));
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
  const t = useTranslations("itemForm");
  const tc = useTranslations("common");
  const tCat = useTranslations("categories");

  const CONDITIONS = useMemo(() => [
    { value: "new", label: t("conditionNew") },
    { value: "good", label: t("conditionGood") },
    { value: "used", label: t("conditionUsed") },
  ] as const, [t]);

  const STATUSES = useMemo(() => [
    { value: "active", label: t("statusActive") },
    { value: "reserved", label: t("statusReserved") },
    { value: "traded", label: t("statusSwapped") },
  ] as const, [t]);

  const itemSchema = useMemo(() => z.object({
    title: z
      .string()
      .min(3, t("titleMinLength"))
      .max(120, t("titleMaxLength")),
    category: z.string().min(1, t("invalidCategory")),
    condition: z.enum(["new", "good", "used"]),
    description: z
      .string()
      .max(2000, t("descriptionMaxLength"))
      .optional()
      .default(""),
    wishlist: z.string().max(500, t("wishlistMaxLength")).optional().default(""),
    location: z.string().min(2, t("locationRequired")),
    userFinalTags: z.array(z.string()).max(10, t("maxTags")).optional().default([]),
  }), [t]);

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
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [valueEstimate, setValueEstimate] = useState<{ min: number; max: number; currency: string; fairSwapExamples: string[] } | null>(null);
  const [valueLoading, setValueLoading] = useState(false);
  const aiTriggered = useRef(false);

  const triggerAiOnBlur = useCallback(() => {
    if (aiTriggered.current || aiLoading) return;
    if (draft.title.length >= 3) {
      aiTriggered.current = true;
      void fetchAiSuggestionsInternal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.title, aiLoading]);

  // Cascading category state
  const initParent = useMemo(() => {
    if (!item.category) return "";
    const node = findCategoryByName(item.category);
    if (!node) return "";
    return node.parentId ?? node.id;
  }, [item.category]);
  const [selectedParent, setSelectedParent] = useState(initParent);
  const [selectedSubcategorySlug, setSelectedSubcategorySlug] = useState("");
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
      const field = issue.path[0] as string;
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
      setAiStatus(t("aiSuggestsFromTitle"));
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
      // Compute confidence: ok=high, fallback=medium, with category & tags presence
      const hasCategory = !!updates.category;
      const hasTags = (updates.aiSuggestedTags ?? []).length > 0;
      const baseScore = data.status === "ok" ? 80 : data.status === "fallback" ? 40 : 10;
      const bonus = (hasCategory ? 10 : 0) + (hasTags ? 10 : 0);
      setAiConfidence(Math.min(100, baseScore + bonus));
      setAiStatus(
        data.status === "ok"
          ? t("aiCategoryAndTags")
          : data.status === "fallback"
            ? t("localSuggestions")
            : t("aiError"),
      );
    } catch {
      setAiStatus(t("networkError"));
      setAiConfidence(null);
    } finally {
      setAiLoading(false);
    }
  };

  const fetchAiSuggestions = () => {
    aiTriggered.current = true;
    void fetchAiSuggestionsInternal();
  };

  const estimateValue = useCallback(() => {
    setValueLoading(true);
    // Simple local estimation based on category and condition
    setTimeout(() => {
      const categoryValues: Record<string, [number, number]> = {
        "Electronics": [50, 500],
        "Clothing": [10, 150],
        "Books": [5, 50],
        "Sports": [20, 300],
        "Home & Garden": [15, 200],
        "Toys": [10, 100],
        "Music": [20, 300],
        "Art": [30, 500],
        "Collectibles": [25, 1000],
        "Tools": [15, 250],
      };
      const conditionMultiplier: Record<string, number> = {
        new: 1.0,
        good: 0.7,
        used: 0.4,
        used_good: 0.55,
      };
      const baseRange = categoryValues[draft.category] ?? [10, 200];
      const mult = conditionMultiplier[draft.condition] ?? 0.6;
      const min = Math.round(baseRange[0] * mult);
      const max = Math.round(baseRange[1] * mult);

      // Generate fair swap examples based on category
      const swapExamples: Record<string, string[]> = {
        "Electronics": ["Tablet", "Bluetooth speaker", "Smart watch"],
        "Clothing": ["Designer jacket", "Vintage dress", "Sneakers"],
        "Books": ["Book collection", "E-reader", "Board game"],
        "Sports": ["Bicycle", "Tennis racket", "Camping gear"],
        "Home & Garden": ["Kitchen appliance", "Garden tools", "Lamp set"],
      };
      const examples = swapExamples[draft.category] ?? ["Similar condition item", "Item from same category", "Bundle of smaller items"];

      setValueEstimate({ min, max, currency: "EUR", fairSwapExamples: examples });
      setValueLoading(false);
    }, 800);
  }, [draft.category, draft.condition]);

  const analyzeImageWithAi = async (imageUrl: string, file?: File) => {
    setImageAiLoading(true);
    setImageAiStatus(t("analyzingWithAi"));
    try {
      let body: Record<string, string>;

      if (file) {
        // Always send as base64 when we have the file locally (avoids server-side fetch)
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

      if (data.status === "ok" || data.status === "fallback") {
        const updates: Partial<Item> = {};
        if (data.title) {
          updates.title = data.title;
        }
        if (data.category && ITEM_CATEGORIES.includes(data.category)) {
          updates.category = data.category;
        }
        // If AI returned a subcategory, also set the parent dropdown
        if (data.category) {
          const node = findCategoryByName(data.category);
          if (node) {
            const parentId = node.parentId ?? node.id;
            setSelectedParent(parentId);
            updates.category = node.name;
          } else if (!ITEM_CATEGORIES.includes(data.category)) {
            // Try partial match on top-level category
            const topMatch = ITEM_CATEGORIES.find((c) =>
              data.category.toLowerCase().includes(c.toLowerCase()) ||
              c.toLowerCase().includes(data.category.toLowerCase())
            );
            if (topMatch) {
              updates.category = topMatch;
              const topNode = findCategoryByName(topMatch);
              if (topNode) setSelectedParent(topNode.id);
            }
          }
        }
        setDraft((prev) => ({ ...prev, ...updates }));

        // Compute confidence for image AI
        const hasTitle = !!updates.title;
        const hasCategory = !!updates.category;
        const imgBase = data.status === "ok" ? 75 : 35;
        const imgBonus = (hasTitle ? 15 : 0) + (hasCategory ? 10 : 0);
        setAiConfidence(Math.min(100, imgBase + imgBonus));

        const debugInfo = data.attempted?.length ? ` [${data.attempted.join(", ")}]` : "";
        setImageAiStatus(
          data.status === "ok"
            ? t("aiImageCaption", { caption: data.caption })
            : (data.caption || t("aiUnavailable")),
        );
        if (data.status === "fallback" && debugInfo) {
          console.warn("Image AI fallback:", debugInfo);
        }
      } else {
        console.warn("Image AI error:", data.attempted);
        setAiConfidence(null);
        // Show user-friendly message, not technical details
        const isQuota = data.attempted?.some((a: string) => a.includes("429") || a.includes("quota"));
        setImageAiStatus(
          isQuota
            ? t("aiRateLimit")
            : t("aiImageError"),
        );
      }
    } catch {
      setImageAiStatus(t("aiNetworkError"));
      setAiConfidence(null);
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
            {t("imageOptional")}
          </p>

          {/* File upload */}
          <label className="text-xs text-zinc-500 dark:text-zinc-400">
            {t("uploadFile")}
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
                  const resized = await resizeImage(file, t("imageReadError"));
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
                  setUploadError(t("imageProcessingError"));
                } finally {
                  setUploading(false);
                }
              }}
              className={inputNormal}
            />
          </label>
          {uploading && (
            <p className="text-xs text-blue-600 dark:text-blue-400">
              {t("uploadingImage")}
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
            <span className="text-xs text-zinc-400">{tc("or")}</span>
            <hr className="flex-1 border-zinc-200 dark:border-zinc-700" />
          </div>

          {/* URL input */}
          <label className="text-xs text-zinc-500 dark:text-zinc-400">
            {t("pasteImageLink")}
            <div className="mt-1 flex gap-2">
              <input
                type="url"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder={t("urlPlaceholder")}
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
                    setImageUrlError(t("invalidUrl"));
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
                      setImageUrlError(t("invalidImageLink"));
                      return;
                    }
                    setPreview(url);
                    setDraft((prev) => ({ ...prev, photos: [url] }));
                    setImageUrlInput("");
                    void analyzeImageWithAi(url);
                  } catch {
                    setImageUrlError(t("couldNotLoadImage"));
                  } finally {
                    setLoadingUrl(false);
                  }
                }}
                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {loadingUrl ? t("verifyingUrl") : tc("add")}
              </button>
            </div>
          </label>
          {imageUrlError && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {imageUrlError}
            </p>
          )}

          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            {t("imageFormats")}
          </p>
        </div>

        {/* Preview */}
        <div className="flex flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/60">
          <Image
            src={preview || "/no-image.svg"}
            alt={preview ? t("preview") : tc("noImage")}
            width={400}
            height={400}
            className="max-h-48 w-full rounded-lg object-contain"
            unoptimized
          />
          {!preview && (
            <p className="mt-2 text-xs text-zinc-400">{tc("noImage")}</p>
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
              {t("deleteImage")}
            </button>
          )}
        </div>
      </div>

      {/* Image AI status + confidence */}
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
          <div className="flex items-center justify-between gap-2">
            <span>{imageAiLoading ? t("analyzingWithAi") : imageAiStatus}</span>
            {aiConfidence !== null && !imageAiLoading && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                aiConfidence >= 70
                  ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200"
                  : aiConfidence >= 40
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
              }`}>
                {t("aiConfidence", { score: String(aiConfidence) })}
              </span>
            )}
          </div>
          {aiConfidence !== null && !imageAiLoading && (
            <p className={`mt-1 text-xs ${
              aiConfidence >= 70 ? "text-green-600 dark:text-green-400" : aiConfidence >= 40 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
            }`}>
              {aiConfidence >= 70 ? t("aiConfidenceHigh") : aiConfidence >= 40 ? t("aiConfidenceMedium") : t("aiConfidenceLow")}
            </p>
          )}
        </div>
      )}

      {/* Title + Category */}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          {t("titleLabel")}
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            onBlur={triggerAiOnBlur}
            placeholder={t("titlePlaceholder")}
            maxLength={120}
            className={errors.title ? inputError : inputNormal}
          />
          <FieldError message={errors.title} />
        </label>
        <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          <p>{t("categoryLabel")}</p>
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
            <option value="">{t("chooseCategory")}</option>
            {TOP_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {tCat(cat.name)}
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
                {t("allFromCategory", { category: tCat(TOP_CATEGORIES.find((c) => c.id === selectedParent)?.name ?? "other") })}
              </option>
              {subcategories.map((sub) => (
                <option key={sub.id} value={sub.name}>
                  {sub.nameEn ?? sub.name}
                </option>
              ))}
            </select>
          ) : null}
          <FieldError message={errors.category} />
        </div>
        {/* DB-driven subcategory selector with icons, disclaimers, extra fields */}
        {selectedParent && (
          <SubcategorySelector
            categorySlug={TOP_CATEGORIES.find((c) => c.id === selectedParent)?.name ?? ""}
            value={selectedSubcategorySlug}
            onChange={setSelectedSubcategorySlug}
          />
        )}
      </div>

      {/* AI Suggestions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={fetchAiSuggestions}
          disabled={aiLoading || saving}
          className="rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
        >
          {aiLoading ? t("analyzing") : t("aiSuggestions")}
        </button>
        {aiStatus ? (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{aiStatus}</span>
        ) : (
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {t("aiSuggestsFromTitle")}
          </span>
        )}
        {aiConfidence !== null && !aiLoading && !imageAiLoading && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
            aiConfidence >= 70
              ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200"
              : aiConfidence >= 40
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
          }`}>
            {t("aiConfidence", { score: String(aiConfidence) })}
          </span>
        )}
      </div>

      {/* AI Value Estimation */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-3 dark:border-emerald-900 dark:bg-emerald-950/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
              {t("valueEstimation")}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              {t("valueEstimationDesc")}
            </p>
          </div>
          <button
            type="button"
            onClick={estimateValue}
            disabled={valueLoading || !draft.category}
            className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {valueLoading ? t("analyzing") : t("estimateValue")}
          </button>
        </div>
        {valueEstimate && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white px-3 py-2 shadow-sm dark:bg-zinc-800">
                <p className="text-xs text-zinc-500">{t("estimatedRange")}</p>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  {valueEstimate.min}–{valueEstimate.max} {valueEstimate.currency}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">{t("fairSwapExamples")}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {valueEstimate.fairSwapExamples.map((ex) => (
                  <span key={ex} className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                    {ex}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
        {t("descriptionLabel")}
        <textarea
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          placeholder={t("descriptionPlaceholder")}
          maxLength={2000}
          className={errors.description ? inputError : inputNormal}
          rows={4}
        />
        <div className="mt-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FieldError message={errors.description} />
            <button
              type="button"
              disabled={!draft.title || aiLoading}
              onClick={async () => {
                if (!draft.title) return;
                setAiLoading(true);
                try {
                  const res = await fetch("/api/ai", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      title: draft.title,
                      category: draft.category,
                      condition: draft.condition,
                      prompt: "generate_description",
                    }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    if (data.description) {
                      setDraft((prev) => ({ ...prev, description: data.description }));
                    }
                  }
                } finally {
                  setAiLoading(false);
                }
              }}
              className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-semibold text-violet-700 hover:bg-violet-200 disabled:opacity-40 dark:bg-violet-900/30 dark:text-violet-300 dark:hover:bg-violet-900/50"
            >
              {aiLoading ? "..." : "✨"} {t("aiWriteDescription")}
            </button>
          </div>
          <span className="text-xs text-zinc-400">
            {draft.description.length}/2000
          </span>
        </div>
      </label>

      {/* Wishlist */}
      <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
        {t("wishlistLabel")}
        <input
          value={draft.wishlist}
          onChange={(e) => setDraft({ ...draft, wishlist: e.target.value })}
          placeholder={t("wishlistPlaceholder")}
          maxLength={500}
          className={errors.wishlist ? inputError : inputNormal}
        />
        <FieldError message={errors.wishlist} />
      </label>

      {/* Semantic contract fields (optional) */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900 dark:bg-blue-950/20">
        <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
          {t("analysisDetails")}
        </p>
        <p className="mb-3 text-xs text-blue-600 dark:text-blue-400">
          {t("analysisDetailsDescription")}
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* Intent */}
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            {t("intentQuestion")}
            <select
              value={draft.intent ?? ""}
              onChange={(e) => setDraft({ ...draft, intent: (e.target.value || undefined) as ItemIntent | undefined })}
              className={inputNormal}
            >
              <option value="">— Nealeas —</option>
              <option value="explore">{t("intentExplore")}</option>
              <option value="open">{t("intentOpen")}</option>
              <option value="committed">{t("intentCommitted")}</option>
              <option value="high_commitment">{t("intentHighCommitment")}</option>
            </select>
          </label>

          {/* Flexibility */}
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            {t("flexibilityQuestion")}
            <select
              value={draft.flexibility ?? ""}
              onChange={(e) => setDraft({ ...draft, flexibility: (e.target.value || undefined) as ItemFlexibility | undefined })}
              className={inputNormal}
            >
              <option value="">— Nealeas —</option>
              <option value="strict">{t("flexibilityStrict")}</option>
              <option value="moderate">{t("flexibilityModerate")}</option>
              <option value="broad">{t("flexibilityBroad")}</option>
            </select>
          </label>

          {/* Perceived value */}
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            {t("perceivedValueQuestion")}
            <select
              value={draft.perceivedValue ?? ""}
              onChange={(e) => setDraft({ ...draft, perceivedValue: (e.target.value || undefined) as ItemPerceivedValue | undefined })}
              className={inputNormal}
            >
              <option value="">— Nealeas —</option>
              <option value="small">{t("valueSmall")}</option>
              <option value="medium">{t("valueMedium")}</option>
              <option value="large">{t("valueLarge")}</option>
              <option value="sentimental">{t("valueSentimental")}</option>
            </select>
          </label>

          {/* Clarity */}
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            {t("clarityQuestion")}
            <select
              value={draft.clarity ?? ""}
              onChange={(e) => setDraft({ ...draft, clarity: (e.target.value || undefined) as ItemClarity | undefined })}
              className={inputNormal}
            >
              <option value="">— Nealeas —</option>
              <option value="exploring">{t("clarityExploring")}</option>
              <option value="have_idea">{t("clarityHaveIdea")}</option>
              <option value="know_exactly">{t("clarityKnowExactly")}</option>
            </select>
          </label>

          {/* Context */}
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            {t("contextQuestion")}
            <select
              value={draft.context ?? ""}
              onChange={(e) => setDraft({ ...draft, context: (e.target.value || undefined) as ItemContext | undefined })}
              className={inputNormal}
            >
              <option value="">— Nealeas —</option>
              <option value="permanent">{t("contextPermanent")}</option>
              <option value="vacation">{t("contextVacation")}</option>
              <option value="temporary">{t("contextTemporary")}</option>
              <option value="urgent">{t("contextUrgent")}</option>
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
            {t("acceptsBundle")}
          </label>
          <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={draft.recipientMatters ?? false}
              onChange={(e) => setDraft({ ...draft, recipientMatters: e.target.checked || undefined })}
              className="rounded border-zinc-300"
            />
            {t("recipientMatters")}
          </label>
        </div>

        {/* Condition impact */}
        <div className="mt-3">
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            {t("conditionImpactQuestion")}
          </p>
          <div className="mt-1 flex flex-wrap gap-3">
            {([
              { value: "affects_value", label: t("affectsValue") },
              { value: "affects_usage", label: t("affectsUsage") },
              { value: "affects_durability", label: t("affectsDurability") },
              { value: "affects_appearance", label: t("affectsAppearance") },
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
          {t("aiMessageLabel")}
          <input
            value={draft.aiNote ?? ""}
            onChange={(e) => setDraft({ ...draft, aiNote: e.target.value || undefined })}
            placeholder={t("aiMessagePlaceholder")}
            maxLength={300}
            className={inputNormal}
          />
          <span className="text-[10px] text-zinc-400">{t("aiMessageNote")}</span>
        </label>
      </div>

      {/* Condition + Status + Location */}
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          {t("conditionLabel")}
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
          {t("statusLabel")}
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
          {t("locationLabel")}
          <input
            value={draft.location}
            onChange={(e) => setDraft({ ...draft, location: e.target.value })}
            placeholder={t("locationPlaceholder")}
            className={errors.location ? inputError : inputNormal}
          />
          <FieldError message={errors.location} />
        </label>
      </div>

      {/* User tags */}
      <div className="text-sm">
        <p className="font-semibold text-zinc-700 dark:text-zinc-200">
          {t("tagsLabel")}
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
            placeholder={t("tagsPlaceholder")}
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
          {t("aiTagSuggestions")}{" "}
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
          {tc("cancel")}
        </button>
        <button
          type="submit"
          disabled={saving || uploading}
          className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? tc("saving") : uploading ? t("uploadingImageButton") : tc("save")}
        </button>
      </div>
    </form>
  );
}
