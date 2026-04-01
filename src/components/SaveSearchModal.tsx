"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { X, Bell, BellOff } from "lucide-react";
import type { SavedSearchFilters } from "@/hooks/useSavedSearches";

interface SaveSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, filters: SavedSearchFilters) => Promise<unknown>;
  filters: SavedSearchFilters;
}

export function SaveSearchModal({ open, onClose, onSave, filters }: SaveSearchModalProps) {
  const t = useTranslations("savedSearches");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  // Sync open prop with dialog element
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  const activeFilters = Object.entries(filters).filter(
    ([, v]) => v !== null && v !== undefined && v !== "" && v !== "all",
  );

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave(name.trim(), filters);
    setSaving(false);
    setName("");
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-labelledby="save-search-title"
      className="mx-auto w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl backdrop:bg-black/40 backdrop:backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-800"
      onClose={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
          <Bell className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 id="save-search-title" className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          {t("modalTitle")}
        </h3>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {t("modalDescription")}
        </p>
      </div>

      {/* Active filters summary */}
      {activeFilters.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {activeFilters.map(([key, value]) => (
            <span
              key={key}
              className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            >
              {key}: {String(value)}
            </span>
          ))}
        </div>
      )}

      {/* Name input */}
      <div className="mt-4">
        <label htmlFor="search-name" className="mb-1.5 block text-xs font-semibold text-zinc-600 dark:text-zinc-300">
          {t("alertName")}
        </label>
        <input
          id="search-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("alertNamePlaceholder")}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleSave();
          }}
          autoFocus
        />
      </div>

      {/* Notification hint */}
      <div className="mt-3 flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
        <BellOff className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {t("notificationHint")}
        </span>
      </div>

      {/* Actions */}
      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {t("cancel")}
        </button>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={!name.trim() || saving}
          className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? t("saving") : t("saveAlert")}
        </button>
      </div>
    </dialog>
  );
}
