"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { X, ChevronDown } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAppState } from "@/lib/state";
import type { Item } from "@/lib/types";
import type { SavedSearch } from "@/hooks/useSavedSearches";

export interface MatchingFilters {
  itemTypes: string[];
  category: string;
  maxDistanceKm: number | null;
  minValue: number | null;
  maxValue: number | null;
  crossCategory: boolean;
}

export const DEFAULT_FILTERS: MatchingFilters = {
  itemTypes: [],
  category: "",
  maxDistanceKm: null,
  minValue: null,
  maxValue: null,
  crossCategory: false,
};

const ITEM_TYPES = ["object", "property", "service", "event"] as const;

const DISTANCE_OPTIONS = [
  { label: "10 km", value: 10 },
  { label: "25 km", value: 25 },
  { label: "50 km", value: 50 },
  { label: "100 km", value: 100 },
  { label: "300 km", value: 300 },
  { label: "International", value: null },
] as const;

interface Props {
  open: boolean;
  onClose: () => void;
  slots: [Item | null, Item | null];
  filters: MatchingFilters;
  onFiltersChange: (f: MatchingFilters) => void;
  userId: string;
}

type Tab = "offer" | "seek" | "save";

export function MatchingFilterDrawer({ open, onClose, slots, filters, onFiltersChange, userId }: Props) {
  const t = useTranslations("matching");
  const tc = useTranslations("common");
  const [tab, setTab] = useState<Tab>("seek");
  const [localFilters, setLocalFilters] = useState<MatchingFilters>(filters);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [saveName, setSaveName] = useState("");
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loadingSearches, setLoadingSearches] = useState(false);

  const activeSlots = slots.filter(Boolean) as Item[];

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  useEffect(() => {
    if (!open || !userId) return;
    setLoadingSearches(true);
    const sb = getSupabaseClient();
    if (!sb) { setLoadingSearches(false); return; }
    sb.from("saved_searches")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setSavedSearches(data ?? []);
        setLoadingSearches(false);
      });
  }, [open, userId]);

  const applyFilters = useCallback(() => {
    onFiltersChange(localFilters);
    onClose();
  }, [localFilters, onFiltersChange, onClose]);

  const resetFilters = useCallback(() => {
    setLocalFilters(DEFAULT_FILTERS);
    onFiltersChange(DEFAULT_FILTERS);
  }, [onFiltersChange]);

  const toggleItemType = (type: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      itemTypes: prev.itemTypes.includes(type)
        ? prev.itemTypes.filter((t) => t !== type)
        : [...prev.itemTypes, type],
    }));
  };

  const saveSearch = async () => {
    if (!saveName.trim() || !userId) return;
    const sb = getSupabaseClient();
    if (!sb) return;
    setSaving(true);
    await sb.from("saved_searches").insert({
      user_id: userId,
      name: saveName.trim(),
      filters: {
        itemTypes: localFilters.itemTypes,
        category: localFilters.category || null,
        maxDistanceKm: localFilters.maxDistanceKm,
        minValue: localFilters.minValue,
        maxValue: localFilters.maxValue,
        crossCategory: localFilters.crossCategory,
      },
      alert_enabled: notifyEnabled,
    });
    setSaving(false);
    setSaveSuccess(true);
    setSaveName("");
    setTimeout(() => setSaveSuccess(false), 2000);

    // Refresh list
    const { data } = await sb
      .from("saved_searches")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);
    setSavedSearches(data ?? []);
  };

  const deleteSearch = async (id: string) => {
    const sb = getSupabaseClient();
    if (!sb) return;
    await sb.from("saved_searches").delete().eq("id", id);
    setSavedSearches((prev) => prev.filter((s) => s.id !== id));
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className="fixed inset-y-0 left-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-2xl dark:bg-zinc-900"
        aria-label={t("filters_title")}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            🎯 {t("filters_title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800">
          {(["offer", "seek", "save"] as Tab[]).map((tabId) => {
            const label =
              tabId === "offer"
                ? t("filters_i_offer")
                : tabId === "seek"
                  ? t("filters_i_seek")
                  : t("filters_save");
            return (
              <button
                key={tabId}
                type="button"
                onClick={() => setTab(tabId)}
                className={`flex-1 py-2 text-xs font-semibold transition ${
                  tab === tabId
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* ── Tab 1: I OFFER (read-only) ── */}
          {tab === "offer" && (
            <div className="space-y-3">
              {activeSlots.length === 0 ? (
                <p className="text-sm text-zinc-500">{t("noSlotsHint")}</p>
              ) : (
                activeSlots.map((item, i) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                      Slot {i + 1}
                    </p>
                    <p className="mt-1 font-semibold text-zinc-800 dark:text-zinc-100">
                      {item.title}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-zinc-500">
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-700">
                        {item.category}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-700">
                        {item.condition}
                      </span>
                    </div>
                    {item.wishlist && (
                      <p className="mt-2 text-xs text-zinc-500">
                        <span className="font-medium">{t("theyWant")}:</span> {item.wishlist}
                      </p>
                    )}
                  </div>
                ))
              )}
              <p className="text-xs text-zinc-400">{t("noSlotsHint")}</p>
            </div>
          )}

          {/* ── Tab 2: I SEEK (editable filters) ── */}
          {tab === "seek" && (
            <div className="space-y-5">
              {/* Item type */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {t("filters_item_type")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {ITEM_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleItemType(type)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${
                        localFilters.itemTypes.includes(type)
                          ? "bg-blue-600 text-white"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {t("filters_category")}
                </label>
                <input
                  type="text"
                  value={localFilters.category}
                  onChange={(e) =>
                    setLocalFilters((prev) => ({ ...prev, category: e.target.value }))
                  }
                  placeholder={t("filters_category_placeholder")}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              {/* Distance */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {t("filters_distance")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {DISTANCE_OPTIONS.map((opt) => (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() =>
                        setLocalFilters((prev) => ({ ...prev, maxDistanceKm: opt.value }))
                      }
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        localFilters.maxDistanceKm === opt.value
                          ? "bg-blue-600 text-white"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Value range */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {t("filters_value_range")} (EUR)
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    placeholder="Min"
                    value={localFilters.minValue ?? ""}
                    onChange={(e) =>
                      setLocalFilters((prev) => ({
                        ...prev,
                        minValue: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                  <span className="text-zinc-400">–</span>
                  <input
                    type="number"
                    min={0}
                    placeholder="Max"
                    value={localFilters.maxValue ?? ""}
                    onChange={(e) =>
                      setLocalFilters((prev) => ({
                        ...prev,
                        maxValue: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Cross-category */}
              <div className="flex items-center justify-between rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
                <span className="text-sm text-zinc-700 dark:text-zinc-200">
                  {t("filters_cross_category")}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      crossCategory: !prev.crossCategory,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    localFilters.crossCategory ? "bg-blue-600" : "bg-zinc-200 dark:bg-zinc-700"
                  }`}
                  role="switch"
                  aria-checked={localFilters.crossCategory}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      localFilters.crossCategory ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* ── Tab 3: SAVE SEARCH ── */}
          {tab === "save" && (
            <div className="space-y-4">
              {/* Save form */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {t("filters_save_btn")}
                </label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder={t("filters_save_name_placeholder")}
                  maxLength={60}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              {/* Alert toggle */}
              <div className="flex items-center justify-between rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
                <div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    {t("filters_notify")}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {t("filters_notify_hint")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifyEnabled((v) => !v)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                    notifyEnabled ? "bg-blue-600" : "bg-zinc-200 dark:bg-zinc-700"
                  }`}
                  role="switch"
                  aria-checked={notifyEnabled}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      notifyEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <button
                type="button"
                onClick={saveSearch}
                disabled={!saveName.trim() || saving}
                className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? tc("loading") : saveSuccess ? "✓ " + tc("saved") : t("filters_save_btn")}
              </button>

              {/* Saved searches list */}
              {savedSearches.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    {t("filters_saved_list")}
                  </p>
                  <div className="space-y-2">
                    {loadingSearches ? (
                      <div className="animate-pulse rounded-xl bg-zinc-100 p-3 dark:bg-zinc-800" />
                    ) : (
                      savedSearches.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-700"
                        >
                          <div>
                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                              {s.name}
                            </p>
                            {s.alert_enabled && (
                              <p className="text-[10px] text-blue-500">🔔 {t("filters_notify")}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteSearch(s.id)}
                            className="rounded-lg p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  {/* TODO: Premium badge for real-time notifications */}
                  <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                    🔔 {t("filters_notify_premium_hint")}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions (only for seek tab) */}
        {tab === "seek" && (
          <div className="flex gap-3 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <button
              type="button"
              onClick={resetFilters}
              className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {tc("reset")}
            </button>
            <button
              type="button"
              onClick={applyFilters}
              className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {tc("apply")}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
