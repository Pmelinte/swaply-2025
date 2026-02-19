"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { NO_IMAGE_URL } from "@/lib/storage";
import { SafeImage } from "@/components/SafeImage";
import { CTAButton, Pill } from "@/components/ui";
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
  Layers,
  Tag,
  Home,
  Wrench,
} from "lucide-react";

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
      <p className="mt-1 truncate text-xs font-semibold text-zinc-800 dark:text-zinc-100">
        {item.title}
      </p>
      <p className="truncate text-[10px] text-zinc-500">
        {item.category} &middot; {item.condition}
      </p>
      {item.location && (
        <p className="mt-0.5 flex items-center gap-0.5 truncate text-[10px] text-zinc-400">
          <MapPin className="h-2.5 w-2.5 shrink-0" />
          {item.location}
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

/* ─── Browse card for grid/list secondary view ─── */
function ObjectCard({ item, mode }: { item: Item; mode: BrowseMode }) {
  const t = useTranslations("objects");
  const router = useRouter();

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
          <h3 className="truncate font-semibold text-zinc-900 dark:text-zinc-50">{item.title}</h3>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-700">{item.category}</span>
            <span>{item.condition}</span>
            {item.location && (
              <span className="flex items-center gap-0.5">
                <MapPin className="h-3 w-3" />
                {item.location}
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

  return (
    <button
      onClick={() => router.push(`/objects/${item.id}`)}
      className="group flex w-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-700">
        <SafeImage
          src={item.photos?.[0] || NO_IMAGE_URL}
          alt={item.title}
          fill
          className="object-cover transition group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          unoptimized={!item.photos?.[0]}
        />
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 backdrop-blur dark:bg-zinc-900/80 dark:text-zinc-200">
          {item.condition}
        </span>
        {item.listingType === "property" && (
          <span className="absolute right-2 top-2 rounded-full bg-purple-600/90 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
            <Home className="inline h-2.5 w-2.5 mr-0.5" />Property
          </span>
        )}
        {item.listingType === "service" && (
          <span className="absolute right-2 top-2 rounded-full bg-green-600/90 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
            <Wrench className="inline h-2.5 w-2.5 mr-0.5" />Service
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{item.title}</h3>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{item.category}</p>
        {item.location && (
          <p className="mt-1 flex items-center gap-0.5 text-xs text-zinc-400">
            <MapPin className="h-3 w-3" />
            {item.location}
          </p>
        )}
        {item.wishlist && (
          <p className="mt-1.5 line-clamp-2 text-xs text-blue-600 dark:text-blue-400">
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
  const { user, items } = useAppState();
  const t = useTranslations("objects");
  const tc = useTranslations("common");

  const initialTypeFromUrl = searchParams.get("type");
  const initialListingType: ListingType | "all" =
    initialTypeFromUrl === "property" || initialTypeFromUrl === "service" || initialTypeFromUrl === "object"
      ? initialTypeFromUrl
      : "all";

  // --- Browse mode (secondary) ---
  const [browseMode, setBrowseMode] = useState<BrowseMode | null>(initialListingType !== "all" ? "grid" : null);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<"newest" | "category" | "condition">("newest");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [conditionFilter, setConditionFilter] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [listingTypeFilter, setListingTypeFilter] = useState<ListingType | "all">(initialListingType);

  // --- SWIPE: WISHES (dorinte) state ---
  const [wishSwipeIndex, setWishSwipeIndex] = useState(0);
  const [wishRightCount, setWishRightCount] = useState(0);
  const [wishSlots, setWishSlots] = useState<(Item | null)[]>([null, null, null]);
  const [wishDismissed, setWishDismissed] = useState<Set<string>>(new Set());

  // --- SWIPE: OFFERS (oferte) state ---
  const [offerSwipeIndex, setOfferSwipeIndex] = useState(0);
  const [offerRightCount, setOfferRightCount] = useState(0);
  const [offerSlots, setOfferSlots] = useState<(Item | null)[]>([null, null, null]);
  const [offerDismissed, setOfferDismissed] = useState<Set<string>>(new Set());

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
    setWishDismissed((prev) => new Set(prev).add(currentWishItem.id));
    setWishSwipeIndex((idx) => Math.min(idx + 1, wishCandidates.length));
  }, [currentWishItem, wishCandidates.length]);

  const handleOfferRight = useCallback(() => {
    if (!currentOfferItem || offerBlocked) return;
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
    setOfferDismissed((prev) => new Set(prev).add(currentOfferItem.id));
    setOfferSwipeIndex((idx) => Math.min(idx + 1, offerCandidates.length));
  }, [currentOfferItem, offerCandidates.length]);

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
    switch (sortMode) {
      case "newest":
        result = [...result].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        break;
      case "category":
        result = [...result].sort((a, b) => a.category.localeCompare(b.category));
        break;
      case "condition":
        result = [...result].sort((a, b) => a.condition.localeCompare(b.condition));
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
            href="/objects/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
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
            onClick={() => setBrowseMode(null)}
            className={`rounded-l-lg px-3 py-2 text-xs font-medium ${isSwipeView ? "bg-blue-600 text-white" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
          >
            <Layers className="inline h-3.5 w-3.5 mr-1" />
            {t("swipeMode")}
          </button>
          <button
            onClick={() => setBrowseMode("grid")}
            className={`px-2.5 py-2 ${browseMode === "grid" ? "bg-blue-600 text-white" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
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

        {/* Listing type filter */}
        <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700">
          {([
            { key: "all" as const, icon: <Layers className="h-3.5 w-3.5" />, label: t("allTypes") },
            { key: "object" as const, icon: <Package className="h-3.5 w-3.5" />, label: t("objectsType") },
            { key: "property" as const, icon: <Home className="h-3.5 w-3.5" />, label: t("propertiesType") },
            { key: "service" as const, icon: <Wrench className="h-3.5 w-3.5" />, label: t("servicesType") },
          ]).map((lt, i) => (
            <button
              key={lt.key}
              onClick={() => setListingTypeFilter(lt.key)}
              className={`inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium ${
                i === 0 ? "rounded-l-lg" : i === 3 ? "rounded-r-lg" : ""
              } ${listingTypeFilter === lt.key ? "bg-purple-600 text-white" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
            >
              {lt.icon}
              <span className="hidden sm:inline">{lt.label}</span>
            </button>
          ))}
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
            </select>
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

            {/* Swipe zone */}
            <div className="mx-auto max-w-sm">
              {!user ? (
                <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-8 text-center dark:border-blue-800 dark:bg-blue-950/20">
                  <p className="text-sm text-zinc-500">{t("loginToList")}</p>
                  <CTAButton href="/login">{t("loginButton")}</CTAButton>
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

            {/* Listing type filter */}
            <div className="mb-3 flex justify-center">
              <div className="inline-flex rounded-lg border border-emerald-200 dark:border-emerald-700">
                {([
                  { key: "all" as const, icon: <Layers className="h-3.5 w-3.5" />, label: t("allTypes") },
                  { key: "object" as const, icon: <Package className="h-3.5 w-3.5" />, label: t("objectsType") },
                  { key: "property" as const, icon: <Home className="h-3.5 w-3.5" />, label: t("propertiesType") },
                  { key: "service" as const, icon: <Wrench className="h-3.5 w-3.5" />, label: t("servicesType") },
                ]).map((lt, i) => (
                  <button
                    key={lt.key}
                    onClick={() => setListingTypeFilter(lt.key)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium ${
                      i === 0 ? "rounded-l-lg" : i === 3 ? "rounded-r-lg" : ""
                    } ${listingTypeFilter === lt.key ? "bg-emerald-600 text-white" : "text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-800"}`}
                  >
                    {lt.icon}
                    <span className="hidden sm:inline">{lt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Swipe zone */}
            <div className="mx-auto max-w-sm">
              {!user ? (
                <div className="rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 p-8 text-center dark:border-emerald-800 dark:bg-emerald-950/20">
                  <p className="text-sm text-zinc-500">{t("loginToList")}</p>
                  <CTAButton href="/login">{t("loginButton")}</CTAButton>
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
                    <CTAButton href="/match">{t("matchingTitle")}</CTAButton>
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
                <CTAButton href="/match">{t("matchingTitle")}</CTAButton>
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
          <p className="mb-3 text-xs text-zinc-400">
            {t("resultsCount", { count: filtered.length })}
          </p>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-16 dark:border-zinc-700">
              <Package className="mb-4 h-12 w-12 text-zinc-300 dark:text-zinc-600" />
              <p className="mb-2 text-zinc-500 dark:text-zinc-400">
                {hasFilters ? t("noResults") : t("noObjects")}
              </p>
              {hasFilters && (
                <button
                  onClick={clearAllFilters}
                  className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  {t("clearFilters")}
                </button>
              )}
            </div>
          )}

          {filtered.length > 0 && browseMode === "grid" && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((item) => (
                <ObjectCard key={item.id} item={item} mode="grid" />
              ))}
            </div>
          )}

          {filtered.length > 0 && browseMode === "list" && (
            <div className="space-y-2">
              {filtered.map((item) => (
                <ObjectCard key={item.id} item={item} mode="list" />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
