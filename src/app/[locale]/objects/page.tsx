"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { useFavorites } from "@/hooks/useFavorites";
import { useTranslatedText } from "@/hooks/useTranslation";
import { normalizeCategory, normalizeCondition } from "@/lib/normalize-i18n";
import { useSavedSearches } from "@/hooks/useSavedSearches";
import { NO_IMAGE_URL } from "@/lib/storage";
import { SafeImage } from "@/components/SafeImage";
import { CTAButton, Pill } from "@/components/ui-custom";
import { AdBanner } from "@/components/AdBanner";
import { GuestBanner } from "@/components/GuestBanner";
import { AuthGateModal } from "@/components/AuthGateModal";
import { SaveSearchModal } from "@/components/SaveSearchModal";
import { SwipeCard } from "@/features/items/SwipeCard";
import type { Item, ListingType } from "@/lib/types";
import {
  Search,
  LayoutGrid,
  List,
  Plus,
  MapPin,
  Package,
  SlidersHorizontal,
  X,
  Briefcase,
  Tag,
  Home,
  Wrench,
  Heart,
  Undo2,
  Bell,
  Zap,
} from "lucide-react";
import { CAT, getListingCat } from "@/lib/categoryColors";

const MAX_RIGHT_SWIPES = 3;

type BrowseMode = "grid" | "list";

/* ─── Slot card for the 3 fixed slots below each swipe zone ─── */
function SlotCard({
  item,
  onRemove,
  onView,
  color,
}: {
  item: Item | null;
  onRemove?: () => void;
  onView?: () => void;
  color: "blue" | "green";
}) {
  const router = useRouter();
  const t = useTranslations("objects");
  const tCat = useTranslations("categories");
  const td = useTranslations("objectDetail");
  const borderColor =
    color === "blue"
      ? "border-blue-300 dark:border-blue-700"
      : "border-emerald-300 dark:border-emerald-700";
  const bgColor =
    color === "blue"
      ? "bg-blue-50/50 dark:bg-blue-950/30"
      : "bg-emerald-50/50 dark:bg-emerald-950/30";

  if (!item) {
    return (
      <button
        type="button"
        onClick={() => router.push("/objects/new")}
        className={`flex h-44 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed ${borderColor} ${bgColor} text-xs text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition`}
      >
        <span className="text-lg">+</span>
        <span className="font-semibold">{t("addButton")}</span>
      </button>
    );
  }

  const tags = item.userFinalTags?.length ? item.userFinalTags : item.aiSuggestedTags;

  return (
    <div className={`relative overflow-hidden rounded-xl border ${borderColor} ${bgColor} p-2`}>
      <div className="relative mx-auto h-20 w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
        <SafeImage
          src={item.photos?.[0] || NO_IMAGE_URL}
          alt={item.title}
          fill
          className="object-cover"
          sizes="120px"
          unoptimized={!item.photos?.[0]}
        />
      </div>
      <SlotTitle title={item.title} />
      <p className="truncate text-[10px] text-zinc-500">
        {tCat(normalizeCategory(item.category))} &middot; {t("condition_" + normalizeCondition(item.condition))}
      </p>
      {item.location && (
        <p className="mt-0.5 flex items-center gap-0.5 truncate text-[10px] text-zinc-400">
          <MapPin className="h-2.5 w-2.5 shrink-0" />
          <TranslatedLoc text={item.location} />
        </p>
      )}
      {item.wishlist && (
        <p className="mt-0.5 truncate text-[10px] text-blue-500">{item.wishlist}</p>
      )}
      {item.intent && (
        <p className="mt-0.5 truncate text-[10px] text-zinc-400">
          {td("intent")}: {item.intent}
        </p>
      )}
      {tags && tags.length > 0 && (
        <div className="mt-0.5 flex items-center gap-0.5 overflow-hidden">
          <Tag className="h-2.5 w-2.5 shrink-0 text-zinc-300" />
          <span className="truncate text-[9px] text-zinc-400">{tags.slice(0, 3).join(", ")}</span>
        </div>
      )}
      <div className="mt-1 flex gap-1">
        {onView && (
          <button
            type="button"
            onClick={onView}
            className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200"
          >
            {t("viewButton")}
          </button>
        )}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-200"
          >
            {t("removeButton")}
          </button>
        )}
      </div>
    </div>
  );
}

function SlotTitle({ title }: { title: string }) {
  const translated = useTranslatedText(title);
  return (
    <p className="mt-1 truncate text-xs font-semibold text-zinc-800 dark:text-zinc-100">
      {translated}
    </p>
  );
}

function TranslatedLoc({ text }: { text: string }) {
  const translated = useTranslatedText(text);
  return <>{translated}</>;
}

function ObjectCard({ item, mode }: { item: Item; mode: BrowseMode }) {
  const t = useTranslations("objects");
  const tCat = useTranslations("categories");
  const router = useRouter();
  const translatedTitle = useTranslatedText(item.title);
  const translatedDescription = useTranslatedText(item.description ?? "");

  if (mode === "list") {
    return (
      <button
        onClick={() => router.push(`/objects/${item.id}`)}
        className="flex w-full items-center gap-4 rounded-xl border border-zinc-200 bg-white p-3 text-left shadow-sm transition hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800"
      >
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-700">
          <SafeImage
            src={item.photos?.[0] || NO_IMAGE_URL}
            alt={item.title}
            fill
            className="object-cover"
            sizes="64px"
            unoptimized={!item.photos?.[0]}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-semibold text-zinc-900 dark:text-zinc-50">{translatedTitle}</h3>
            {item.isBoosted && (
              <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                <Zap className="h-2.5 w-2.5" />
                {t("promoted")}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-700">{tCat(normalizeCategory(item.category))}</span>
            <span>{t("condition_" + normalizeCondition(item.condition))}</span>
            {item.location && (
              <span className="flex items-center gap-0.5">
                <MapPin className="h-3 w-3" />
                <TranslatedLoc text={item.location} />
              </span>
            )}
          </div>
          {item.wishlist && (
            <p className="mt-1 truncate text-xs text-blue-600 dark:text-blue-400">
              {t("lookingFor")} {item.wishlist}
            </p>
          )}
        </div>
      </button>
    );
  }

  const cat = getListingCat(item.listingType);
  return (
    <button
      onClick={() => router.push(`/objects/${item.id}`)}
      className={`item-card group flex w-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800 ${CAT[cat].topBorder}`}
    >
      <div className={`item-card__image relative aspect-[4/3] w-full overflow-hidden dark:bg-zinc-700 ${CAT[cat].placeholder}`}>
        <SafeImage
          src={item.photos?.[0] || NO_IMAGE_URL}
          alt={item.title}
          fill
          className="object-cover transition group-hover:scale-105"
          sizes="100cqi"
          unoptimized={!item.photos?.[0]}
        />
        <span className={`item-card__badge absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur ${CAT[cat].badge}`}>
          {CAT[cat].icon}
        </span>
        {item.isBoosted && (
          <span className="absolute left-2 top-8 flex items-center gap-0.5 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
            <Zap className="h-2.5 w-2.5" />
            {t("promoted")}
          </span>
        )}
        <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 backdrop-blur dark:bg-zinc-900/80 dark:text-zinc-200">
          {t("condition_" + normalizeCondition(item.condition))}
        </span>
      </div>
      <div className="item-card__body flex flex-1 flex-col p-3">
        <h3 className="item-card__title truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{translatedTitle}</h3>
        <p className="mt-0.5">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${CAT[cat].chip}`}>{tCat(normalizeCategory(item.category))}</span>
        </p>
        {item.location && (
          <p className="item-card__location mt-1 flex items-center gap-0.5 text-xs text-zinc-400">
            <MapPin className="h-3 w-3" />
            <TranslatedLoc text={item.location} />
          </p>
        )}
        {item.wishlist && (
          <p className="item-card__wishlist mt-1.5 line-clamp-2 text-xs text-blue-600 dark:text-blue-400">
            {t("lookingFor")} {item.wishlist}
          </p>
        )}
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   Default layout = two swipe zones (Desires + Offers).
   Grid / List = secondary browse mode toggled by user.
   ═══════════════════════════════════════════════════════════════ */
export default function ObjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, items, loading } = useAppState();
  const { favoriteIds: favorites, toggleFavorite } = useFavorites(user?.id);
  const { createSearch } = useSavedSearches(user?.id);
  const t = useTranslations("objects");
  const tc = useTranslations("common");
  const tCat = useTranslations("categories");
  const tss = useTranslations("savedSearches");


  const initialTypeFromUrl = searchParams.get("type");
  const initialListingType: ListingType | "all" =
    initialTypeFromUrl === "property" || initialTypeFromUrl === "service" || initialTypeFromUrl === "object"
      ? initialTypeFromUrl
      : "all";

  // --- Browse mode ---
  const [browseMode, setBrowseMode] = useState<BrowseMode | null>("grid");
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<"newest" | "category" | "condition" | "popular" | "trusted">("newest");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [conditionFilter, setConditionFilter] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [listingTypeFilter, setListingTypeFilter] = useState<ListingType | "all">(initialListingType);
  const [saveSearchOpen, setSaveSearchOpen] = useState(false);
  const [searchSavedToast, setSearchSavedToast] = useState(false);

  // --- Infinite scroll for browse ---
  const [visibleCount, setVisibleCount] = useState(20);
  const loadMore = useCallback(() => {
    setVisibleCount((c) => c + 20);
  }, []);

  // --- SWIPE: WISHES (dorinte) state ---
  const [wishSwipeIndex, setWishSwipeIndex] = useState(0);
  const [wishRightCount, setWishRightCount] = useState(0);
  const [wishSlots, setWishSlots] = useState<(Item | null)[]>([null, null, null]);
  const [wishDismissed, setWishDismissed] = useState<Set<string>>(new Set());
  const [wishHistory, setWishHistory] = useState<Array<{ item: Item; action: "left" | "right" }>>([]);

  // --- SWIPE: OFFERS (oferte) state ---
  const [offerSwipeIndex, setOfferSwipeIndex] = useState(0);
  const [offerRightCount, setOfferRightCount] = useState(0);
  const [offerSlots, setOfferSlots] = useState<(Item | null)[]>([null, null, null]);
  const [offerDismissed, setOfferDismissed] = useState<Set<string>>(new Set());
  const [offerHistory, setOfferHistory] = useState<Array<{ item: Item; action: "left" | "right" }>>([]);

  // ── Data ──
  const allObjects = useMemo(
    () => items.filter((i) => i.isActive && i.status === "active"),
    [items],
  );

  const otherItems = useMemo(
    () => items.filter((i) => user && i.ownerId !== user.id && i.isActive),
    [items, user],
  );

  const myItems = useMemo(
    () => items.filter((i) => user && i.ownerId === user.id && i.isActive),
    [items, user],
  );

  // Swipe candidates (filtered by listing type)
  const wishCandidates = useMemo(() => {
    const slottedIds = new Set(wishSlots.filter(Boolean).map((i) => i!.id));
    return otherItems.filter((i) => {
      if (wishDismissed.has(i.id) || slottedIds.has(i.id)) return false;
      if (listingTypeFilter !== "all" && (i.listingType ?? "object") !== listingTypeFilter) return false;
      return true;
    });
  }, [otherItems, wishDismissed, wishSlots, listingTypeFilter]);

  const offerCandidates = useMemo(() => {
    const slottedIds = new Set(offerSlots.filter(Boolean).map((i) => i!.id));
    return myItems.filter((i) => {
      if (offerDismissed.has(i.id) || slottedIds.has(i.id)) return false;
      if (listingTypeFilter !== "all" && (i.listingType ?? "object") !== listingTypeFilter) return false;
      return true;
    });
  }, [myItems, offerDismissed, offerSlots, listingTypeFilter]);

  const currentWishItem = wishCandidates[wishSwipeIndex] ?? null;
  const currentOfferItem = offerCandidates[offerSwipeIndex] ?? null;
  const wishBlocked = wishRightCount >= MAX_RIGHT_SWIPES;
  const offerBlocked = offerRightCount >= MAX_RIGHT_SWIPES;

  // ── Swipe handlers ──
  const handleWishRight = useCallback(() => {
    if (!currentWishItem || wishBlocked) return;
    setWishHistory((h) => [...h, { item: currentWishItem, action: "right" }]);
    setWishSlots((prev) => {
      const next = [...prev];
      const emptyIdx = next.findIndex((s) => s === null);
      if (emptyIdx !== -1) next[emptyIdx] = currentWishItem;
      return next;
    });
    setWishRightCount((c) => c + 1);
    setWishSwipeIndex((idx) => Math.min(idx + 1, wishCandidates.length - 1));
  }, [currentWishItem, wishBlocked, wishCandidates.length]);

  const handleWishLeft = useCallback(() => {
    if (!currentWishItem) return;
    setWishHistory((h) => [...h, { item: currentWishItem, action: "left" }]);
    setWishDismissed((prev) => new Set(prev).add(currentWishItem.id));
    setWishSwipeIndex((idx) => Math.min(idx + 1, wishCandidates.length));
  }, [currentWishItem, wishCandidates.length]);

  const undoWishSwipe = useCallback(() => {
    if (wishHistory.length === 0) return;
    const last = wishHistory[wishHistory.length - 1];
    setWishHistory((h) => h.slice(0, -1));
    if (last.action === "left") {
      setWishDismissed((prev) => { const n = new Set(prev); n.delete(last.item.id); return n; });
    } else {
      setWishSlots((prev) => {
        const next = [...prev];
        const idx = next.findIndex((s) => s?.id === last.item.id);
        if (idx !== -1) next[idx] = null;
        return next;
      });
      setWishRightCount((c) => Math.max(0, c - 1));
    }
    setWishSwipeIndex((idx) => Math.max(0, idx - 1));
  }, [wishHistory]);

  const handleOfferRight = useCallback(() => {
    if (!currentOfferItem || offerBlocked) return;
    setOfferHistory((h) => [...h, { item: currentOfferItem, action: "right" }]);
    setOfferSlots((prev) => {
      const next = [...prev];
      const emptyIdx = next.findIndex((s) => s === null);
      if (emptyIdx !== -1) next[emptyIdx] = currentOfferItem;
      return next;
    });
    setOfferRightCount((c) => c + 1);
    setOfferSwipeIndex((idx) => Math.min(idx + 1, offerCandidates.length - 1));
  }, [currentOfferItem, offerBlocked, offerCandidates.length]);

  const handleOfferLeft = useCallback(() => {
    if (!currentOfferItem) return;
    setOfferHistory((h) => [...h, { item: currentOfferItem, action: "left" }]);
    setOfferDismissed((prev) => new Set(prev).add(currentOfferItem.id));
    setOfferSwipeIndex((idx) => Math.min(idx + 1, offerCandidates.length));
  }, [currentOfferItem, offerCandidates.length]);

  const undoOfferSwipe = useCallback(() => {
    if (offerHistory.length === 0) return;
    const last = offerHistory[offerHistory.length - 1];
    setOfferHistory((h) => h.slice(0, -1));
    if (last.action === "left") {
      setOfferDismissed((prev) => { const n = new Set(prev); n.delete(last.item.id); return n; });
    } else {
      setOfferSlots((prev) => {
        const next = [...prev];
        const idx = next.findIndex((s) => s?.id === last.item.id);
        if (idx !== -1) next[idx] = null;
        return next;
      });
      setOfferRightCount((c) => Math.max(0, c - 1));
    }
    setOfferSwipeIndex((idx) => Math.max(0, idx - 1));
  }, [offerHistory]);

  // ── Browse filter logic ──
  const filtered = useMemo(() => {
    let result = allObjects;
    if (listingTypeFilter !== "all") {
      result = result.filter((i) => (i.listingType ?? "object") === listingTypeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.userFinalTags?.some((tag) => tag.toLowerCase().includes(q)) ||
          i.aiSuggestedTags?.some((tag) => tag.toLowerCase().includes(q)),
      );
    }
    if (categoryFilter) result = result.filter((i) => i.category === categoryFilter);
    if (conditionFilter) result = result.filter((i) => i.condition === conditionFilter);
    if (locationFilter.trim()) {
      const loc = locationFilter.toLowerCase();
      result = result.filter((i) => i.location?.toLowerCase().includes(loc));
    }
    // Helper: boosted items always appear first regardless of sort
    const boostFirst = (arr: typeof result) =>
      [...arr].sort((a, b) => {
        const aBoost = a.isBoosted ? 1 : 0;
        const bBoost = b.isBoosted ? 1 : 0;
        return bBoost - aBoost;
      });

    switch (sortMode) {
      case "newest":
        result = boostFirst([...result].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")));
        break;
      case "category":
        result = boostFirst([...result].sort((a, b) => a.category.localeCompare(b.category)));
        break;
      case "condition":
        result = boostFirst([...result].sort((a, b) => a.condition.localeCompare(b.condition)));
        break;
      case "popular":
        // Sort by photo count (proxy for completeness/effort) then by tags count
        result = boostFirst([...result].sort((a, b) => {
          const aScore = (a.photos?.length ?? 0) * 2 + (a.userFinalTags?.length ?? 0) + (a.aiSuggestedTags?.length ?? 0);
          const bScore = (b.photos?.length ?? 0) * 2 + (b.userFinalTags?.length ?? 0) + (b.aiSuggestedTags?.length ?? 0);
          return bScore - aScore;
        }));
        break;
      case "trusted":
        // Sort by owner's completedSwaps (proxy for trust) — items from experienced swappers first
        result = boostFirst([...result].sort((a, b) => {
          // Prefer non-demo items from real users
          const aDemoScore = a.isDemo ? -10 : 0;
          const bDemoScore = b.isDemo ? -10 : 0;
          return bDemoScore - aDemoScore || (b.createdAt || "").localeCompare(a.createdAt || "");
        }));
        break;
    }
    return result;
  }, [allObjects, search, categoryFilter, conditionFilter, locationFilter, sortMode, listingTypeFilter]);

  const hasFilters = !!search || !!categoryFilter || !!conditionFilter || !!locationFilter || listingTypeFilter !== "all";
  const clearAllFilters = () => {
    setSearch("");
    setCategoryFilter(null);
    setConditionFilter(null);
    setLocationFilter("");
    setListingTypeFilter("all");
  };
  const availableCategories = useMemo(() => {
    const cats = new Set(allObjects.map((i) => i.category));
    return [...cats].sort();
  }, [allObjects]);

  const isSwipeView = browseMode === null;

  return (
    <div>
      {/* Guest banner */}
      {!user && <GuestBanner />}

      <div className="mx-auto max-w-6xl px-4 py-6">
      {/* ── Header ── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{t("title")}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <Link
              href="/my-objects"
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 px-3.5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <Briefcase className="h-4 w-4" />
              {t("myObjects")}
            </Link>
          )}
          <Link
            href={user ? "/objects/new" : "/register?returnTo=/objects/new"}
            className="inline-flex items-center gap-1.5 rounded-xl bg-cat-obj px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500"
          >
            <Plus className="h-4 w-4" />
            {t("addObject")}
          </Link>
        </div>
      </div>

      {/* ── View mode switcher ── */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700">
          <button
            onClick={() => setBrowseMode("grid")}
            className={`rounded-l-lg px-2.5 py-2 ${browseMode === "grid" ? "bg-blue-600 text-white" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setBrowseMode("list")}
            className={`rounded-r-lg px-2.5 py-2 ${browseMode === "list" ? "bg-blue-600 text-white" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Show search/filter/sort only in browse modes */}
        {!isSwipeView && (
          <>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition ${
                showFilters || hasFilters
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {hasFilters && <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />}
            </button>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as typeof sortMode)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <option value="newest">{t("sortNewest")}</option>
              <option value="category">{t("sortCategory")}</option>
              <option value="condition">{t("sortCondition")}</option>
              <option value="popular">{t("sortPopular")}</option>
              <option value="trusted">{t("sortTrusted")}</option>
            </select>

            {/* Save search alert button */}
            {user && hasFilters && (
              <button
                type="button"
                onClick={() => setSaveSearchOpen(true)}
                className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 transition hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50"
              >
                <Bell className="h-3.5 w-3.5" />
                {tss("saveSearch")}
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Browse: filters panel ── */}
      {!isSwipeView && showFilters && (
        <div className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <div className="flex flex-wrap gap-4">
            <div>
              <p className="mb-1.5 text-xs font-semibold text-zinc-500 uppercase">{t("filterCategory")}</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setCategoryFilter(null)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${!categoryFilter ? "bg-blue-600 text-white" : "bg-white text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300"}`}
                >
                  {t("filterAll")}
                </button>
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat === categoryFilter ? null : cat)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${categoryFilter === cat ? "bg-blue-600 text-white" : "bg-white text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300"}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold text-zinc-500 uppercase">{t("filterCondition")}</p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setConditionFilter(null)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${!conditionFilter ? "bg-blue-600 text-white" : "bg-white text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300"}`}
                >
                  {t("filterAll")}
                </button>
                {(["new", "good", "used"] as const).map((cond) => (
                  <button
                    key={cond}
                    onClick={() => setConditionFilter(cond === conditionFilter ? null : cond)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${conditionFilter === cond ? "bg-blue-600 text-white" : "bg-white text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300"}`}
                  >
                    {t(`condition${cond.charAt(0).toUpperCase() + cond.slice(1)}` as Parameters<typeof t>[0])}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold text-zinc-500 uppercase">{t("filterLocation")}</p>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  placeholder={t("locationFilterPlaceholder")}
                  className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
                {locationFilter && (
                  <button
                    onClick={() => setLocationFilter("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
          {hasFilters && (
            <button onClick={clearAllFilters} className="mt-3 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400">
              {t("clearFilters")}
            </button>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          DEFAULT VIEW: Two swipe zones (Desires + Offers)
         ════════════════════════════════════════════════════════ */}
      {isSwipeView && (
        <div className="space-y-5">
          {/* ── DESIRES (Blue) ── */}
          <div className="rounded-2xl border-2 border-blue-300 bg-gradient-to-b from-blue-50 to-white p-4 shadow-sm dark:border-blue-800 dark:from-blue-950/40 dark:to-zinc-900">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-blue-800 dark:text-blue-200">
                  {t("desires")}
                </h2>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  {t("desiresDescription")}
                </p>
              </div>
              <Pill color="blue">{t("chosenDesired", { count: wishRightCount })}</Pill>
            </div>

            {/* Undo button for wishes */}
            {wishHistory.length > 0 && (
              <div className="mb-2 flex justify-center">
                <button type="button" onClick={undoWishSwipe} className="inline-flex items-center gap-1 rounded-full border border-blue-200 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/30">
                  <Undo2 className="h-3 w-3" />
                  {t("undoSwipe")}
                </button>
              </div>
            )}

            {/* Swipe zone */}
            <div className="mx-auto max-w-sm">
              {!user ? (
                <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-8 text-center dark:border-blue-800 dark:bg-blue-950/20">
                  <p className="text-sm text-zinc-500">{t("loginToList")}</p>
                  <CTAButton href="/register">{t("loginButton")}</CTAButton>
                </div>
              ) : wishBlocked ? (
                <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-6 text-center dark:border-blue-800 dark:bg-blue-950/30">
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                    {t("chosenDesired", { count: MAX_RIGHT_SWIPES })}
                  </p>
                  <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                    {t("analyzeAndDecide")}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setWishRightCount(0);
                      setWishSwipeIndex(0);
                      setWishDismissed(new Set());
                    }}
                    className="mt-3 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    {t("resetAndChoose")}
                  </button>
                </div>
              ) : currentWishItem ? (
                <SwipeCard
                  item={currentWishItem}
                  onSwipeLeft={handleWishLeft}
                  onSwipeRight={handleWishRight}
                />
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-8 text-center dark:border-blue-800 dark:bg-blue-950/20">
                  <p className="text-sm text-zinc-500">{t("noMoreObjects")}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setWishSwipeIndex(0);
                      setWishDismissed(new Set());
                    }}
                    className="mt-2 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    {t("reload")}
                  </button>
                </div>
              )}
            </div>

            {/* 3 fixed slots */}
            {user && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold text-blue-700 dark:text-blue-300">
                  {t("yourDesiredObjects")}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {wishSlots.map((item, idx) => (
                    <SlotCard
                      key={idx}
                      item={item}
                      color="blue"
                      onView={item ? () => router.push(`/objects/${item.id}`) : undefined}
                      onRemove={
                        item
                          ? () =>
                              setWishSlots((prev) => {
                                const next = [...prev];
                                next[idx] = null;
                                return next;
                              })
                          : undefined
                      }
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── OFFERS (Green) ── */}
          <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-b from-emerald-50 to-white p-4 shadow-sm dark:border-emerald-800 dark:from-emerald-950/40 dark:to-zinc-900">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
                  {t("offers")}
                </h2>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  {t("offersDescription")}
                </p>
              </div>
              <Pill color="green">{t("chosenOffered", { count: offerRightCount })}</Pill>
            </div>

            {/* Undo button for offers */}
            {offerHistory.length > 0 && (
              <div className="mb-2 flex justify-center">
                <button type="button" onClick={undoOfferSwipe} className="inline-flex items-center gap-1 rounded-full border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/30">
                  <Undo2 className="h-3 w-3" />
                  {t("undoSwipe")}
                </button>
              </div>
            )}

            {/* Swipe zone */}
            <div className="mx-auto max-w-sm">
              {!user ? (
                <div className="rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 p-8 text-center dark:border-emerald-800 dark:bg-emerald-950/20">
                  <p className="text-sm text-zinc-500">{t("loginToList")}</p>
                  <CTAButton href="/register">{t("loginButton")}</CTAButton>
                </div>
              ) : offerBlocked ? (
                <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-800 dark:bg-emerald-950/30">
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                    {t("chosenOffered", { count: MAX_RIGHT_SWIPES })}
                  </p>
                  <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                    {t("enoughSignals")}
                  </p>
                  <div className="mt-3 flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOfferRightCount(0);
                        setOfferSwipeIndex(0);
                        setOfferDismissed(new Set());
                      }}
                      className="rounded-full border border-emerald-300 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-300"
                    >
                      {tc("reset")}
                    </button>
                    <CTAButton href="/matching">{t("matchingTitle")}</CTAButton>
                  </div>
                </div>
              ) : currentOfferItem ? (
                <SwipeCard
                  item={currentOfferItem}
                  onSwipeLeft={handleOfferLeft}
                  onSwipeRight={handleOfferRight}
                />
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 p-8 text-center dark:border-emerald-800 dark:bg-emerald-950/20">
                  <p className="text-sm text-zinc-500">
                    {myItems.length === 0 ? t("noActiveObjects") : t("browsedAllObjects")}
                  </p>
                  {myItems.length === 0 ? (
                    <CTAButton href="/objects/new">{t("addButton")}</CTAButton>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setOfferSwipeIndex(0);
                        setOfferDismissed(new Set());
                      }}
                      className="mt-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      {t("reload")}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 3 fixed slots */}
            {user && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  {t("yourOfferedObjects")}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {offerSlots.map((item, idx) => (
                    <SlotCard
                      key={idx}
                      item={item}
                      color="green"
                      onView={item ? () => router.push(`/objects/${item.id}`) : undefined}
                      onRemove={
                        item
                          ? () =>
                              setOfferSlots((prev) => {
                                const next = [...prev];
                                next[idx] = null;
                                return next;
                              })
                          : undefined
                      }
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Nudge banner ── */}
          {(wishRightCount >= MAX_RIGHT_SWIPES || offerRightCount >= MAX_RIGHT_SWIPES) && (
            <div className="rounded-2xl border border-purple-300 bg-purple-50 p-4 text-center dark:border-purple-800 dark:bg-purple-950/30">
              <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                {t("enoughSignalsForAnalysis")}
              </p>
              <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">
                {t("aiAnalyzesCompatibility")}
              </p>
              <div className="mt-3 flex justify-center gap-2">
                <CTAButton href="/matching">{t("matchingTitle")}</CTAButton>
                <button
                  type="button"
                  onClick={() => {
                    setWishRightCount(0); setOfferRightCount(0);
                    setWishSwipeIndex(0); setOfferSwipeIndex(0);
                    setWishDismissed(new Set()); setOfferDismissed(new Set());
                  }}
                  className="rounded-full border border-purple-300 px-4 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-100 dark:border-purple-700 dark:text-purple-300"
                >
                  {t("later")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          BROWSE VIEW (grid / list)
         ════════════════════════════════════════════════════════ */}
      {!isSwipeView && (
        <>
          {/* Loading skeleton for guests while items load */}
          {loading.items && filtered.length === 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
                  <div className="aspect-[4/3] w-full bg-zinc-200 dark:bg-zinc-700" />
                  <div className="space-y-2.5 p-3">
                    <div className="h-4 w-4/5 rounded bg-zinc-200 dark:bg-zinc-700" />
                    <div className="h-3 w-1/2 rounded bg-zinc-100 dark:bg-zinc-700/60" />
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                      <div className="h-3 w-2/5 rounded bg-zinc-100 dark:bg-zinc-700/60" />
                    </div>
                    <div className="h-5 w-1/3 rounded-full bg-zinc-100 dark:bg-zinc-700/60" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading.items && (
            <p className="mb-3 text-xs text-zinc-400">
              {t("resultsCount", { count: filtered.length })}
            </p>
          )}

          {!loading.items && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-16 dark:border-zinc-700">
              {user ? (
                <>
                  <Package className="mb-4 h-12 w-12 text-zinc-300 dark:text-zinc-600" />
                  <p className="mb-1 text-base font-semibold text-zinc-700 dark:text-zinc-200">
                    {t("emptyLoggedTitle")}
                  </p>
                  <p className="mb-4 max-w-sm text-center text-sm text-zinc-500 dark:text-zinc-400">
                    {hasFilters ? t("emptyLoggedSubFilters") : t("emptyLoggedSub")}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    {hasFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                      >
                        {t("clearFilters")}
                      </button>
                    )}
                    <Link
                      href="/objects/new"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                      {t("emptyLoggedCta")}
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <span className="mb-4 text-5xl">📦</span>
                  <p className="mb-1 text-base font-semibold text-zinc-700 dark:text-zinc-200">
                    {hasFilters ? t("emptyGuestTitleFiltered") : t("emptyGuestTitle")}
                  </p>
                  <p className="mb-5 max-w-sm text-center text-sm text-zinc-500 dark:text-zinc-400">
                    {t("emptyGuestSub")}
                  </p>
                  <div className="flex flex-col items-center gap-2">
                    <Link
                      href="/register"
                      className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-700"
                    >
                      {t("emptyGuestCta")}
                    </Link>
                    {hasFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {t("emptyGuestBack")}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Ad banner for free tier users */}
          <AdBanner placement="inline_feed" className="mb-4" />

          {filtered.length > 0 && browseMode === "grid" && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {filtered.slice(0, visibleCount).map((item) => (
                  <div key={item.id} className="item-card-container relative" style={{ containerType: "inline-size" }}>
                    <ObjectCard item={item} mode="grid" />
                    {user ? (
                      <>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                          className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-1.5 shadow-sm backdrop-blur hover:bg-white dark:bg-zinc-900/80 dark:hover:bg-zinc-800"
                        >
                          <Heart className={`h-3.5 w-3.5 ${favorites.has(item.id) ? "fill-red-500 text-red-500" : "text-zinc-400"}`} />
                        </button>
                      </>
                    ) : (
                      <AuthGateModal returnTo="/register?returnTo=/objects" gaEvent="favorite_click_guest">
                        <button
                          type="button"
                          className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-1.5 shadow-sm backdrop-blur hover:bg-white dark:bg-zinc-900/80 dark:hover:bg-zinc-800"
                        >
                          <Heart className="h-3.5 w-3.5 text-zinc-400" />
                        </button>
                      </AuthGateModal>
                    )}
                  </div>
                ))}
              </div>
              {visibleCount < filtered.length && (
                <div className="mt-4 flex justify-center">
                  <button type="button" onClick={loadMore} className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                    {t("loadMoreItems")} ({filtered.length - visibleCount} {t("remainingItems")})
                  </button>
                </div>
              )}
            </>
          )}

          {filtered.length > 0 && browseMode === "list" && (
            <>
              <div className="space-y-2">
                {filtered.slice(0, visibleCount).map((item) => (
                  <div key={item.id} className="relative">
                    <ObjectCard item={item} mode="list" />
                    {user ? (
                      <>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                          className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-1.5 shadow-sm backdrop-blur hover:bg-white dark:bg-zinc-900/80 dark:hover:bg-zinc-800"
                        >
                          <Heart className={`h-3.5 w-3.5 ${favorites.has(item.id) ? "fill-red-500 text-red-500" : "text-zinc-400"}`} />
                        </button>
                      </>
                    ) : (
                      <AuthGateModal returnTo="/register?returnTo=/objects" gaEvent="favorite_click_guest">
                        <button
                          type="button"
                          className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-1.5 shadow-sm backdrop-blur hover:bg-white dark:bg-zinc-900/80 dark:hover:bg-zinc-800"
                        >
                          <Heart className="h-3.5 w-3.5 text-zinc-400" />
                        </button>
                      </AuthGateModal>
                    )}
                  </div>
                ))}
              </div>
              {visibleCount < filtered.length && (
                <div className="mt-4 flex justify-center">
                  <button type="button" onClick={loadMore} className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                    {t("loadMoreItems")} ({filtered.length - visibleCount} {t("remainingItems")})
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>

    {/* Save search modal */}
    <SaveSearchModal
      open={saveSearchOpen}
      onClose={() => setSaveSearchOpen(false)}
      onSave={async (name, filters) => {
        await createSearch(name, filters);
        setSearchSavedToast(true);
        setTimeout(() => setSearchSavedToast(false), 3000);
      }}
      filters={{
        category: categoryFilter,
        city: locationFilter || null,
        keywords: search || null,
        listingType: listingTypeFilter !== "all" ? listingTypeFilter : null,
        condition: conditionFilter,
      }}
    />

    {/* Toast */}
    {searchSavedToast && (
      <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg">
        <Bell className="mr-1.5 inline h-4 w-4" />
        {tss("searchSaved")}
      </div>
    )}
    </div>
  );
}
