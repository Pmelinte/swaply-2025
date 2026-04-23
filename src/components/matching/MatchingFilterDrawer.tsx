"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import type { MatchingFilters } from "@/lib/matching/matchingStore";
import type { MatchingItemRow } from "@/lib/matching/matchQueries";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  filters: MatchingFilters;
  onFiltersChange: (f: MatchingFilters) => void;
  slotItems: MatchingItemRow[];
}

type Tab = "offer" | "seek" | "save";

export default function MatchingFilterDrawer({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  slotItems,
}: Props) {
  const t = useTranslations("matching");
  const [tab, setTab] = useState<Tab>("seek");
  const [saveName, setSaveName] = useState("");
  const [notify, setNotify] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  return (
    <div
      className={`fixed inset-0 z-40 transition-opacity duration-200 ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!isOpen}
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <aside
        role="dialog"
        aria-modal={isOpen ? "true" : undefined}
        aria-hidden={isOpen ? undefined : "true"}
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-200 dark:bg-zinc-900 ${
          isOpen ? "translate-x-0 pointer-events-auto" : "translate-x-full pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {t("filters")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label={t("filters")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex border-b border-zinc-200 dark:border-zinc-800">
          <TabBtn active={tab === "offer"} onClick={() => setTab("offer")}>
            {t("filter_i_offer")}
          </TabBtn>
          <TabBtn active={tab === "seek"} onClick={() => setTab("seek")}>
            {t("filter_i_seek")}
          </TabBtn>
          <TabBtn active={tab === "save"} onClick={() => setTab("save")}>
            {t("filter_save")}
          </TabBtn>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === "offer" && (
            <div className="space-y-3">
              {slotItems.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("slot_add")}</p>
              ) : (
                slotItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/60"
                  >
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {item.title}
                    </p>
                    {item.category && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.category}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "seek" && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {t("filter_category")}
                </label>
                <input
                  type="text"
                  value={filters.category ?? ""}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, category: e.target.value || null })
                  }
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {t("filter_type")}
                </label>
                <select
                  value={filters.itemType ?? ""}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, itemType: e.target.value || null })
                  }
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <option value="">—</option>
                  <option value="object">object</option>
                  <option value="service">service</option>
                  <option value="property">property</option>
                  <option value="event">event</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {t("filter_distance")}
                </label>
                <input
                  type="number"
                  min={0}
                  value={filters.maxDistanceKm ?? ""}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      maxDistanceKm: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={filters.crossCategory}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, crossCategory: e.target.checked })
                  }
                />
                {t("filter_cross_category")}
              </label>
            </div>
          )}

          {tab === "save" && (
            <div className="space-y-4">
              <input
                type="text"
                placeholder={t("filter_save_btn")}
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={notify}
                  onChange={(e) => setNotify(e.target.checked)}
                />
                {t("filter_notify")}
              </label>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {t("filter_save_btn")}
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 border-b-2 px-3 py-2 text-xs font-semibold uppercase transition ${
        active
          ? "border-blue-600 text-blue-600 dark:text-blue-400"
          : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}
