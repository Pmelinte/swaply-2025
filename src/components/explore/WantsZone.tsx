"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { SwipeCard } from "@/features/items/SwipeCard";
import { AuthGateModal } from "@/components/AuthGateModal";
import { CTAButton, Pill } from "@/components/ui-custom";
import { ExploreItemCard } from "@/components/explore/ExploreItemCard";
import { LayoutGrid, List, Plus, User, Undo2 } from "lucide-react";
import type { Item } from "@/lib/types";

const MAX_SWIPES = 3;
type BrowseMode = "swipe" | "grid" | "list";

/* ── Compact slot card ── */
function SlotCard({ item, onRemove }: { item: Item | null; onRemove?: () => void }) {
  const router = useRouter();
  return item ? (
    <button
      type="button"
      onClick={() => router.push(`/objects/${item.id}`)}
      className="flex flex-col gap-1 rounded-xl border border-blue-200 bg-blue-50/60 p-2 text-left transition hover:bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30"
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
    <div className="flex h-full items-center justify-center rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/30 text-center dark:border-blue-800 dark:bg-blue-950/20">
      <span className="text-[11px] text-zinc-400">Empty slot</span>
    </div>
  );
}

/* ── Props ── */
type Props = {
  onAddWant: () => void;
};

export function WantsZone({ onAddWant }: Props) {
  const t = useTranslations("explore");
  const tc = useTranslations("common");
  const { user, items, loading } = useAppState();

  const [mode, setMode] = useState<BrowseMode>("swipe");
  const [swipeIndex, setSwipeIndex] = useState(0);
  const [rightCount, setRightCount] = useState(0);
  const [slots, setSlots] = useState<(Item | null)[]>([null, null, null]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<Array<{ item: Item; action: "left" | "right" }>>([]);

  /* candidates: other users' active items */
  const otherItems = useMemo(
    () => items.filter((i) => i.isActive && i.status === "active" && (!user || i.ownerId !== user.id)),
    [items, user],
  );

  const candidates = useMemo(() => {
    const slottedIds = new Set(slots.filter(Boolean).map((i) => i!.id));
    return otherItems.filter((i) => !dismissed.has(i.id) && !slottedIds.has(i.id));
  }, [otherItems, dismissed, slots]);

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
    setSlots([null, null, null]);
    setHistory([]);
  };

  /* ── Render ── */
  return (
    <div className="rounded-2xl border-2 border-blue-300 bg-gradient-to-b from-blue-50 to-white p-4 shadow-sm dark:border-blue-800 dark:from-blue-950/40 dark:to-zinc-900">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-blue-800 dark:text-blue-200">{t("wants")}</h2>
          <p className="text-xs text-blue-600 dark:text-blue-400">{t("wantsDescription")}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {/* My Wants */}
          <Link
            href="/profile"
            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/30"
          >
            <User className="h-3.5 w-3.5" />
            {t("myWants")}
          </Link>
          {/* Add Want */}
          <button
            type="button"
            onClick={onAddWant}
            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("addWant")}
          </button>
          {/* View toggle */}
          <div className="flex rounded-lg border border-blue-200 dark:border-blue-700">
            <button
              type="button"
              onClick={() => setMode("swipe")}
              className={`rounded-l-lg px-2 py-1.5 text-xs ${mode === "swipe" ? "bg-blue-600 text-white" : "text-blue-600 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-900/30"}`}
              title="Swipe"
            >
              ♠
            </button>
            <button
              type="button"
              onClick={() => setMode("grid")}
              className={`px-2 py-1.5 ${mode === "grid" ? "bg-blue-600 text-white" : "text-blue-600 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-900/30"}`}
              title="Grid"
            >
              <LayoutGrid className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => setMode("list")}
              className={`rounded-r-lg px-2 py-1.5 ${mode === "list" ? "bg-blue-600 text-white" : "text-blue-600 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-900/30"}`}
              title="List"
            >
              <List className="h-3 w-3" />
            </button>
          </div>
          {mode === "swipe" && user && (
            <Pill color="blue">{t("chosenWants", { count: rightCount })}</Pill>
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
                className="inline-flex items-center gap-1 rounded-full border border-blue-200 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/30"
              >
                <Undo2 className="h-3 w-3" />
                {t("undoSwipe")}
              </button>
            </div>
          )}

          <div className="mx-auto max-w-sm">
            {!user ? (
              /* Guest — preview + auth gate on right swipe */
              current ? (
                <AuthGateModal returnTo="/register?returnTo=/explore" gaEvent="explore_swipe_guest">
                  <SwipeCard item={current} onSwipeLeft={handleLeft} onSwipeRight={() => {}} />
                </AuthGateModal>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-8 text-center dark:border-blue-800 dark:bg-blue-950/20">
                  <p className="text-sm text-zinc-500">{t("loginToSwipe")}</p>
                  <CTAButton href="/register">{tc("nudgeLogin")}</CTAButton>
                </div>
              )
            ) : blocked ? (
              <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-6 text-center dark:border-blue-800 dark:bg-blue-950/30">
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                  {t("chosenWants", { count: MAX_SWIPES })}
                </p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-3 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  {t("resetAndChoose")}
                </button>
              </div>
            ) : current ? (
              <SwipeCard item={current} onSwipeLeft={handleLeft} onSwipeRight={handleRight} />
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-8 text-center dark:border-blue-800 dark:bg-blue-950/20">
                <p className="text-sm text-zinc-500">{t("noMoreItems")}</p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-2 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  {t("reload")}
                </button>
              </div>
            )}
          </div>

          {/* 3 slots */}
          {user && (
            <div className="mt-4 grid grid-cols-3 gap-2" style={{ minHeight: 80 }}>
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
          {!loading.items && otherItems.length === 0 && (
            <p className="py-6 text-center text-sm text-zinc-400">{tc("noData")}</p>
          )}
          {mode === "grid" && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {otherItems.slice(0, 20).map((item) => (
                <ExploreItemCard key={item.id} item={item} mode="grid" />
              ))}
            </div>
          )}
          {mode === "list" && (
            <div className="space-y-2">
              {otherItems.slice(0, 20).map((item) => (
                <ExploreItemCard key={item.id} item={item} mode="list" />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
