"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Item } from "@/lib/types";
import { SafeImage } from "@/components/SafeImage";
import { NO_IMAGE_URL } from "@/lib/storage";
import { Package, Plus, X, Lock, Save, Check } from "lucide-react";

interface BundleBuilderProps {
  /** All items the user owns (filtered to active ones) */
  availableItems: Item[];
  /** The primary item already in the swap (excluded from selector) */
  primaryItemId: string;
  /** Currently selected bundle item IDs */
  selectedIds: string[];
  /** Bundle notes */
  notes: string;
  /** Estimated total value */
  estimatedValue: number | null;
  /** Whether the bundle is locked (post-acceptance) */
  locked: boolean;
  /** Whether save is in progress */
  saving?: boolean;
  onAddItem: (itemId: string) => void;
  onRemoveItem: (itemId: string) => void;
  onNotesChange: (notes: string) => void;
  onValueChange: (value: number | null) => void;
  onSave: () => void;
}

export function BundleBuilder({
  availableItems,
  primaryItemId,
  selectedIds,
  notes,
  estimatedValue,
  locked,
  saving,
  onAddItem,
  onRemoveItem,
  onNotesChange,
  onValueChange,
  onSave,
}: BundleBuilderProps) {
  const t = useTranslations("change");
  const [showSelector, setShowSelector] = useState(false);
  const [saved, setSaved] = useState(false);

  const selectableItems = availableItems.filter(
    (i) => i.id !== primaryItemId && !selectedIds.includes(i.id) && i.status === "active",
  );

  const bundleItems = selectedIds
    .map((id) => availableItems.find((i) => i.id === id))
    .filter(Boolean) as Item[];

  const handleSave = () => {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className={`rounded-2xl border p-4 ${
      locked
        ? "border-amber-200 bg-amber-50/30 dark:border-amber-800 dark:bg-amber-950/20"
        : "border-violet-200 bg-violet-50/30 dark:border-violet-800 dark:bg-violet-950/20"
    }`}>
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <Package className={`h-5 w-5 ${locked ? "text-amber-600 dark:text-amber-400" : "text-violet-600 dark:text-violet-400"}`} />
        <h4 className={`text-sm font-bold ${locked ? "text-amber-800 dark:text-amber-200" : "text-violet-800 dark:text-violet-200"}`}>
          {t("bundleTitle")}
        </h4>
        {selectedIds.length > 0 && (
          <span className="ml-auto text-xs text-zinc-500">
            {t("bundleItems", { count: selectedIds.length + 1 })}
          </span>
        )}
        {locked && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-800 dark:text-amber-200">
            <Lock className="h-3 w-3" />
            {t("bundleLocked")}
          </span>
        )}
      </div>

      {locked && (
        <p className="mb-3 text-xs text-amber-600 dark:text-amber-400">{t("bundleLockedDesc")}</p>
      )}

      {/* Bundle items visual */}
      {bundleItems.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {bundleItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-xl border border-violet-200 bg-white p-2 dark:border-violet-700 dark:bg-zinc-800"
            >
              <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-700">
                <SafeImage
                  src={item.photos?.[0] || NO_IMAGE_URL}
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="40px"
                  unoptimized={!item.photos?.[0]}
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-50">{item.title}</p>
                <p className="text-[10px] text-zinc-500">{item.category}</p>
              </div>
              {!locked && (
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  className="ml-1 text-red-400 hover:text-red-600"
                  title={t("bundleRemoveItem")}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add item button / selector */}
      {!locked && (
        <>
          {showSelector ? (
            <div className="mb-3 rounded-xl border border-violet-200 bg-white p-3 dark:border-violet-700 dark:bg-zinc-800">
              <p className="mb-2 text-xs font-semibold text-violet-700 dark:text-violet-300">{t("bundleSelectItem")}</p>
              {selectableItems.length === 0 ? (
                <p className="text-xs text-zinc-500">{t("bundleNoItems")}</p>
              ) : (
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {selectableItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onAddItem(item.id);
                        setShowSelector(false);
                      }}
                      className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-left transition hover:border-violet-300 hover:bg-violet-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-violet-600"
                    >
                      <div className="relative h-8 w-8 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-700">
                        <SafeImage
                          src={item.photos?.[0] || NO_IMAGE_URL}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="32px"
                          unoptimized={!item.photos?.[0]}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-50">{item.title}</p>
                        <p className="text-[10px] text-zinc-500">{item.category}</p>
                      </div>
                      <Plus className="h-4 w-4 shrink-0 text-violet-500" />
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowSelector(false)}
                className="mt-2 text-xs text-zinc-500 hover:text-zinc-700"
              >
                {t("disputeCancel")}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowSelector(true)}
              className="mb-3 flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("bundleAddItem")}
            </button>
          )}

          {/* Value + Notes */}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-violet-700 dark:text-violet-300">
              {t("bundleEstimatedValue")} ({t("bundleCurrency")})
              <input
                type="number"
                value={estimatedValue ?? ""}
                onChange={(e) => onValueChange(e.target.value ? parseFloat(e.target.value) : null)}
                placeholder={t("bundleValuePlaceholder")}
                className="mt-1 w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm dark:border-violet-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </label>
            <label className="block text-xs font-semibold text-violet-700 dark:text-violet-300">
              {t("bundleNotesLabel")}
              <input
                type="text"
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                placeholder={t("bundleNotesPlaceholder")}
                className="mt-1 w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm dark:border-violet-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </label>
          </div>

          {/* Save */}
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || selectedIds.length === 0}
              className="flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-40"
            >
              {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
              {saved ? t("bundleSaved") : saving ? "..." : t("bundleSave")}
            </button>
          </div>
        </>
      )}

      {/* Locked: show value + notes read-only */}
      {locked && (
        <div className="mt-2 space-y-1">
          {estimatedValue != null && estimatedValue > 0 && (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {t("bundleEstimatedValue")}: {estimatedValue.toLocaleString()} {t("bundleCurrency")}
            </p>
          )}
          {notes && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {t("bundleNotesLabel")}: {notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
