"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { useExploreFilters } from "@/hooks/useExploreFilters";
import { useExploreCount } from "@/hooks/useExploreCount";
import { ExploreDrawerTabs } from "./ExploreDrawerTabs";
import { ExploreFilterCount } from "./ExploreFilterCount";
import { OfferTab } from "./tabs/OfferTab";
import { WantTab } from "./tabs/WantTab";
import { ProfileTab } from "./tabs/ProfileTab";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ExploreDrawer({ open, onClose }: Props) {
  const t = useTranslations("exploreDrawer");
  const {
    state,
    updateOffer,
    updateWant,
    updateProfile,
    setTab,
    reset,
    applyFilters,
  } = useExploreFilters();

  const { count, loading } = useExploreCount(state, open);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Scroll lock on body while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleApply = () => {
    applyFilters();
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-zinc-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("title")}
        className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-white shadow-2xl dark:bg-zinc-900 md:w-[420px]"
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
          <h2 className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-zinc-50">
            <span>🔍</span> <span>{t("title")}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Tabs */}
        <ExploreDrawerTabs active={state.tab} onChange={setTab} />

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-5">
          {state.tab === "offer" && (
            <OfferTab filters={state.offer} onChange={updateOffer} />
          )}
          {state.tab === "want" && (
            <WantTab filters={state.want} onChange={updateWant} />
          )}
          {state.tab === "profile" && (
            <ProfileTab filters={state.profile} onChange={updateProfile} />
          )}
        </div>

        {/* Footer */}
        <ExploreFilterCount
          count={count}
          loading={loading}
          onApply={handleApply}
          onReset={reset}
        />
      </aside>
    </>
  );
}
