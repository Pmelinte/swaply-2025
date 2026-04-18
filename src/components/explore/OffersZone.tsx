"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { SwipeCard } from "@/features/items/SwipeCard";
import { CTAButton, Pill } from "@/components/ui-custom";
import { ExploreItemCard } from "@/components/explore/ExploreItemCard";
import { LayoutGrid, List, Plus, User, Undo2 } from "lucide-react";
import type { Item } from "@/lib/types";

const MAX_SWIPES = 2;
type BrowseMode = "swipe" | "grid" | "list";

/* ── Compact slot card ── */
function SlotCard({ item, onRemove }: { item: Item | null; onRemove?: () => void }) {
  const router = useRouter();
  return item ? (
    <button
      type="button"
      onClick={() => router.push(`/objects/${item.id}`)}
      className="flex flex-col gap-1 rounded-xl border border-emerald-200 bg-emerald-50/60 p-2 text-left transition hover:bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
    >
      <p className="line-clamp-2 text-[11px] font-semibold text-zinc-800 dark:text-zinc-100">
        {item.title}
      </p>
      <div className="mt-auto flex items-center justify-between">
        <span className="text-[10px] text-zinc-400">view →</span>
        {onRemove && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="text-[10px] text-red-400 hover:text-red-600"
          >
            ✕
          </button>
        )}
      </div>
    </button>
  ) : (
    <div className="flex h-full items-center justify-center rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/30 text-center dark:border-emerald-800 dark:bg-emerald-950/20">
      <span className="text-[11px] text-zinc-400">Empty slot</span>
    </div>
  );
}

/* ── Props ── */
type Props = {
  onAddOffer: () => void;
};

export function OffersZone({ onAddOffer }: Props) {
  const t = useTranslations("explore");
  const tc = useTranslations("common");
  const { user, items, loading } = useAppState();

  const [mode, setMode] = useState<BrowseMode>("swipe");
  const [swipeIndex, setSwipeIndex] = useState(0);
  const [rightCount, setRightCount] = useState(0);
  const [slots, setSlots] = useState<(Item | null)[]>([null, null]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<Array<{ item: Item; action: "left" | "right" }>>([]);

  /* candidates: own active items (for logged users) */
  const myItems = useMemo(
    () => items.filter((i) => user && i.ownerId === user.id && i.isActive),
    [items, user],
  );

  /* for guests: show other people's items */
  const publicItems = useMemo(
    () => items.filter((i) => i.isActive && i.status === "active"),
    [items],
  );

  const candidates = useMemo(() => {
    const slottedIds = new Set(slots.filter(Boolean).map((i) => i!.id));
    return myItems.filter((i) => !dismissed.has(i.id) && !slottedIds.has(i.id));
  }, [myItems, dismissed, slots]);

  const current = candidates[swipeIndex] ?? null;
  const blocked = rightCount >= MAX_SWIPES;

  const handleRight = useCallback(() => {
    if (!current || blocked) return;
    setHistory((h) => [...h, { item: current, action: "right" }]);
    setSlots((prev) => {
      const next = [...prev];
      const idx = next.findIndex((s) => s === null);
      if (idx !== -1) next[idx] = current;
      return next;
    });
    setRightCount((c) => c + 1);
    setSwipeIndex((i) => Math.min(i + 1, candidates.length - 1));
  }, [current, blocked, candidates.length]);

  const handleLeft = useCallback(() => {
    if (!current) return;
    setHistory((h) => [...h, { item: current, action: "left" }]);
    setDismissed((prev) => new Set(prev).add(current.id));
    setSwipeIndex((i) => Math.min(i + 1, candidates.length));
  }, [current, candidates.length]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    if (last.action === "left") {
      setDismissed((prev) => { const n = new Set(prev); n.delete(last.item.id); return n; });
    } else {
      setSlots((prev) => {
        const next = [...prev];
        const idx = next.findIndex((s) => s?.id === last.item.id);
        if (idx !== -1) next[idx] = null;
        return next;
      });
      setRightCount((c) => Math.max(0, c - 1));
    }
    setSwipeIndex((i) => Math.max(0, i - 1));
  }, [history]);

  const handleReset = () => {
    setSwipeIndex(0);
    setRightCount(0);
    setDismissed(new Set());
    setSlots([null, null]);
    setHistory([]);
  };

  /* ── Render ── */
  return (
    <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-b from-emerald-50 to-white p-4 shadow-sm dark:border-emerald-800 dark:from-emerald-950/40 dark:to-zinc-900">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-emerald-800 dark:text-emerald-200">{t("offers")}</h2>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">{t("offersDescription")}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {/* My Offers */}
          <Link
            href={user ? "/my-objects" : "/register?returnTo=/my-objects"}
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
          >
            <User className="h-3.5 w-3.5" />
            {t("myOffers")}
          </Link>
          {/* Add Offer */}
          <button
            type="button"
            onClick={onAddOffer}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("addOffer")}
          </button>
          {/* View toggle */}
          <div className="flex rounded-lg border border-emerald-200 dark:border-emerald-700">
            <button
              type="button"
              onClick={() => setMode("swipe")}
              className={`rounded-l-lg px-2 py-1.5 text-xs ${mode === "swipe" ? "bg-emerald-600 text-white" : "text-emerald-600 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-900/30"}`}
              title="Swipe"
            >
              ♠
            </button>
            <button
              type="button"
              onClick={() => setMode("grid")}
              className={`px-2 py-1.5 ${mode === "grid" ? "bg-emerald-600 text-white" : "text-emerald-600 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-900/30"}`}
              title="Grid"
            >
              <LayoutGrid className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => setMode("list")}
              className={`rounded-r-lg px-2 py-1.5 ${mode === "list" ? "bg-emerald-600 text-white" : "text-emerald-600 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-900/30"}`}
              title="List"
            >
              <List className="h-3 w-3" />
            </button>
          </div>
          {mode === "swipe" && user && (
            <Pill color="green">{t("chosenOffers", { count: rightCount })}</Pill>
          )}
        </div>
      </div>

      {/* ── SWIPE VIEW ── */}
      {mode === "swipe" && (
        <>
          {/* Undo */}
          {history.length > 0 && (
            <div className="mb-2 flex justify-center">
              <button
                type="button"
                onClick={handleUndo}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
              >
                <Undo2 className="h-3 w-3" />
                {t("undoSwipe")}
              </button>
            </div>
          )}

          <div className="mx-auto max-w-sm">
            {!user ? (
              <div className="rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 p-8 text-center dark:border-emerald-800 dark:bg-emerald-950/20">
                <p className="text-sm text-zinc-500">{t("loginToSwipe")}</p>
                <CTAButton href="/register">{tc("nudgeLogin")}</CTAButton>
              </div>
            ) : blocked ? (
              <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-800 dark:bg-emerald-950/30">
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                  {t("chosenOffers", { count: MAX_SWIPES })}
                </p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-3 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  {t("resetAndChoose")}
                </button>
              </div>
            ) : myItems.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 p-8 text-center dark:border-emerald-800 dark:bg-emerald-950/20">
                <p className="text-sm text-zinc-500">{t("noActiveItems")}</p>
                <CTAButton href="/objects/new">{t("addFirstItem")}</CTAButton>
              </div>
            ) : current ? (
              <SwipeCard item={current} onSwipeLeft={handleLeft} onSwipeRight={handleRight} />
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 p-8 text-center dark:border-emerald-800 dark:bg-emerald-950/20">
                <p className="text-sm text-zinc-500">{t("noMoreItems")}</p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  {t("reload")}
                </button>
              </div>
            )}
          </div>

          {/* 2 slots */}
          {user && (
            <div className="mt-4 grid grid-cols-2 gap-2" style={{ minHeight: 80 }}>
              {slots.map((item, idx) => (
                <SlotCard
                  key={idx}
                  item={item}
                  onRemove={
                    item
                      ? () => setSlots((prev) => { const n = [...prev]; n[idx] = null; return n; })
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── GRID / LIST VIEW ── */}
      {(mode === "grid" || mode === "list") && (
        <>
          {loading.items && (
            <p className="py-6 text-center text-sm text-zinc-400">{tc("loadingData")}</p>
          )}
          {!loading.items && publicItems.length === 0 && (
            <p className="py-6 text-center text-sm text-zinc-400">{tc("noData")}</p>
          )}
          {mode === "grid" && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {publicItems.slice(0, 20).map((item) => (
                <ExploreItemCard key={item.id} item={item} mode="grid" />
              ))}
            </div>
          )}
          {mode === "list" && (
            <div className="space-y-2">
              {publicItems.slice(0, 20).map((item) => (
                <ExploreItemCard key={item.id} item={item} mode="list" />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
