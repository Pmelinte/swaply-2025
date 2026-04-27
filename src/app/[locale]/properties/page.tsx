"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { useFavorites } from "@/hooks/useFavorites";
import { NO_IMAGE_URL } from "@/lib/storage";
import { SafeImage } from "@/components/SafeImage";
import { GuestBanner } from "@/components/GuestBanner";
import { AuthGateModal } from "@/components/AuthGateModal";
import { AdBanner } from "@/components/AdBanner";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  Search,
  LayoutGrid,
  List,
  Plus,
  MapPin,
  SlidersHorizontal,
  X,
  Heart,
  Home,
  BedDouble,
  Bath,
  Maximize2,
} from "lucide-react";
import { CAT } from "@/lib/categoryColors";

interface PropertyRow {
  id: string;
  title?: string;
  status?: string;
  created_at?: string;
  owner_id?: string;
  city?: string;
  country?: string;
  region?: string;
  property_type?: string;
  property_category?: string;
  property_subtype?: string;
  bedrooms?: number;
  bathrooms?: number;
  total_area_sqm?: number;
  photos?: string[] | null;
  images?: (string | { url?: string; order?: number })[] | null;
  image_url?: string | null;
  description?: string;
  exchange_type?: string;
  desired_exchange_description?: string;
  // items table fallback fields
  category?: string;
  location?: string;
  is_active?: boolean;
  wizard_type?: string;
  property_data?: Record<string, unknown>;
  items?: {
    title?: string;
    image_url?: string | null;
    images?: (string | { url?: string; order?: number })[] | null;
    description?: string;
  } | null;
}

type BrowseMode = "grid" | "list";

function getPhotos(row: PropertyRow): string[] {
  if (Array.isArray(row.photos)) {
    const strings = row.photos.filter((p): p is string => typeof p === "string");
    if (strings.length > 0) return strings;
  }
  if (Array.isArray(row.images)) {
    const urls = row.images
      .map((p) => (typeof p === "string" ? p : p?.url))
      .filter((u): u is string => typeof u === "string" && u.length > 0);
    if (urls.length > 0) return urls;
  }
  if (row.image_url) return [row.image_url];
  const it = row.items;
  if (it?.image_url) return [it.image_url];
  if (Array.isArray(it?.images)) {
    const urls = (it.images as (string | { url?: string })[])
      .map((p) => (typeof p === "string" ? p : p?.url))
      .filter((u): u is string => typeof u === "string" && u.length > 0);
    if (urls.length > 0) return urls;
  }
  return [];
}

function getLocation(row: PropertyRow): string {
  if (row.city && row.country) return `${row.city}, ${row.country}`;
  if (row.city) return row.city;
  if (row.country) return row.country;
  if (row.location) return row.location;
  // try property_data
  const pd = row.property_data;
  if (pd && typeof pd === "object") {
    const city = (pd as Record<string, unknown>).city;
    const country = (pd as Record<string, unknown>).country;
    if (city && country) return `${city}, ${country}`;
    if (city) return String(city);
    if (country) return String(country);
  }
  return "";
}

function getPropertyType(row: PropertyRow): string {
  if (row.property_type) return row.property_type;
  const pd = row.property_data;
  if (pd && typeof pd === "object") {
    const pt = (pd as Record<string, unknown>).property_type;
    if (pt) return String(pt);
  }
  return "";
}

function getBedrooms(row: PropertyRow): number | null {
  if (typeof row.bedrooms === "number") return row.bedrooms;
  const pd = row.property_data;
  if (pd && typeof pd === "object") {
    const b = (pd as Record<string, unknown>).bedrooms;
    if (typeof b === "number") return b;
  }
  return null;
}

function getBathrooms(row: PropertyRow): number | null {
  if (typeof row.bathrooms === "number") return row.bathrooms;
  const pd = row.property_data;
  if (pd && typeof pd === "object") {
    const b = (pd as Record<string, unknown>).bathrooms;
    if (typeof b === "number") return b;
  }
  return null;
}

function getArea(row: PropertyRow): number | null {
  if (typeof row.total_area_sqm === "number") return row.total_area_sqm;
  const pd = row.property_data;
  if (pd && typeof pd === "object") {
    const a = (pd as Record<string, unknown>).total_area_sqm;
    if (typeof a === "number") return a;
  }
  return null;
}

function getTitle(row: PropertyRow): string {
  if (row.title) return row.title;
  if (row.items?.title) return row.items.title;
  const type = getPropertyType(row);
  const loc = getLocation(row);
  if (type && loc) return `${type} in ${loc}`;
  if (type) return type;
  if (loc) return loc;
  return "Property listing";
}

function PropertyCard({ row, mode }: { row: PropertyRow; mode: BrowseMode }) {
  const router = useRouter();
  const photos = getPhotos(row);
  const location = getLocation(row);
  const propType = getPropertyType(row);
  const bedrooms = getBedrooms(row);
  const bathrooms = getBathrooms(row);
  const area = getArea(row);
  const title = getTitle(row);
  const description = row.description || row.desired_exchange_description || "";

  if (mode === "list") {
    return (
      <button
        onClick={() => router.push(`/properties/${row.id}`)}
        className="flex w-full items-center gap-4 rounded-xl border border-zinc-200 bg-white p-3 text-left shadow-sm transition hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800"
      >
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-700">
          <SafeImage
            src={photos[0] || NO_IMAGE_URL}
            alt={title}
            fill
            className="object-cover"
            sizes="64px"
            unoptimized={!photos[0]}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            {propType && (
              <span className="rounded-full bg-purple-100 px-2 py-0.5 font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                {propType}
              </span>
            )}
            {bedrooms !== null && (
              <span className="flex items-center gap-0.5">
                <BedDouble className="h-3 w-3" />{bedrooms}
              </span>
            )}
            {bathrooms !== null && (
              <span className="flex items-center gap-0.5">
                <Bath className="h-3 w-3" />{bathrooms}
              </span>
            )}
            {area !== null && (
              <span className="flex items-center gap-0.5">
                <Maximize2 className="h-3 w-3" />{area} m²
              </span>
            )}
            {location && (
              <span className="flex items-center gap-0.5">
                <MapPin className="h-3 w-3" />{location}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-1 truncate text-xs text-blue-600 dark:text-blue-400">{description}</p>
          )}
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => router.push(`/properties/${row.id}`)}
      className={`item-card group flex w-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800 ${CAT.properties.topBorder}`}
    >
      <div className={`item-card__image relative aspect-[4/3] w-full overflow-hidden dark:bg-zinc-700 ${CAT.properties.placeholder}`}>
        <SafeImage
          src={photos[0] || NO_IMAGE_URL}
          alt={title}
          fill
          className="object-cover transition group-hover:scale-105"
          sizes="100cqi"
          unoptimized={!photos[0]}
        />
        {propType && (
          <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur ${CAT.properties.badge}`}>
            <Home className="inline h-2.5 w-2.5 mr-0.5" />{propType}
          </span>
        )}
        {row.exchange_type && (
          <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 backdrop-blur dark:bg-zinc-900/80 dark:text-zinc-200">
            {row.exchange_type}
          </span>
        )}
      </div>
      <div className="item-card__body flex flex-1 flex-col p-3">
        <h3 className="item-card__title truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          {bedrooms !== null && (
            <span className="flex items-center gap-0.5">
              <BedDouble className="h-3 w-3" />{bedrooms} bed
            </span>
          )}
          {bathrooms !== null && (
            <span className="flex items-center gap-0.5">
              <Bath className="h-3 w-3" />{bathrooms} bath
            </span>
          )}
          {area !== null && (
            <span className="flex items-center gap-0.5">
              <Maximize2 className="h-3 w-3" />{area} m²
            </span>
          )}
        </div>
        {location && (
          <p className="item-card__location mt-1 flex items-center gap-0.5 text-xs text-zinc-400">
            <MapPin className="h-3 w-3" />{location}
          </p>
        )}
        {description && (
          <p className="mt-1.5 line-clamp-2 text-xs text-blue-600 dark:text-blue-400">{description}</p>
        )}
      </div>
    </button>
  );
}

export default function PropertiesPage() {
  const router = useRouter();
  const { user, items, loading: stateLoading } = useAppState();
  const { favoriteIds: favorites, toggleFavorite } = useFavorites(user?.id);
  const t = useTranslations("objects");
  const tb = useTranslations("branches");

  const [browseMode, setBrowseMode] = useState<BrowseMode>("grid");
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);

  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [loadingProps, setLoadingProps] = useState(true);

  const loadMore = useCallback(() => {
    setVisibleCount((c) => c + 20);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchProperties() {
      setLoadingProps(true);

      const supabase = getSupabaseClient();
      if (!supabase) {
        // Fall back to items from state
        setLoadingProps(false);
        return;
      }

      // Try dedicated properties table first
      const { data: propsData, error: propsError } = await supabase
        .from("properties")
        .select("*, items(title, image_url, images, description)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(500);

      if (!cancelled && !propsError && propsData && propsData.length > 0) {
        setProperties(propsData as PropertyRow[]);
        setLoadingProps(false);
        return;
      }

      // Fall back to items table filtered by category/wizard_type
      const { data: itemsData } = await supabase
        .from("items")
        .select("*")
        .or("category.eq.property,wizard_type.eq.property,item_type.eq.property")
        .eq("status", "active")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(500);

      if (!cancelled) {
        setProperties((itemsData as PropertyRow[]) ?? []);
        setLoadingProps(false);
      }
    }

    fetchProperties();
    return () => { cancelled = true; };
  }, []);

  // Also include property items already loaded in state (merged, deduped)
  const stateProperties = useMemo(
    () => items.filter((i) => (i.category === "property" || i.listingType === "property") && i.isActive && i.status === "active"),
    [items],
  );

  const allProperties = useMemo<PropertyRow[]>(() => {
    const merged: PropertyRow[] = [...properties];
    const ids = new Set(properties.map((p) => p.id));
    for (const item of stateProperties) {
      if (!ids.has(item.id)) {
        merged.push({
          id: item.id,
          title: item.title,
          status: item.status,
          created_at: item.createdAt,
          owner_id: item.ownerId,
          location: item.location,
          photos: item.photos,
          description: item.description,
          category: item.category,
        });
      }
    }
    return merged;
  }, [properties, stateProperties]);

  const filtered = useMemo(() => {
    let result = allProperties;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => {
        const title = getTitle(p).toLowerCase();
        const loc = getLocation(p).toLowerCase();
        const type = getPropertyType(p).toLowerCase();
        const desc = (p.description || p.desired_exchange_description || "").toLowerCase();
        return title.includes(q) || loc.includes(q) || type.includes(q) || desc.includes(q);
      });
    }
    if (locationFilter.trim()) {
      const loc = locationFilter.toLowerCase();
      result = result.filter((p) => getLocation(p).toLowerCase().includes(loc));
    }
    return result;
  }, [allProperties, search, locationFilter]);

  const hasFilters = !!search || !!locationFilter;
  const isLoading = loadingProps && stateLoading.items;

  return (
    <div>
      {!user && <GuestBanner />}

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{tb("properties")}</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{tb("propertiesDesc")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={user ? "/properties/new" : "/register?returnTo=/properties/new"}
              className="inline-flex items-center gap-1.5 rounded-xl bg-cat-prop px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-500"
            >
              <Plus className="h-4 w-4" />
              Add property
            </Link>
          </div>
        </div>

        {/* View mode + search */}
        <div className="mb-4 flex items-center gap-2">
          <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setBrowseMode("grid")}
              className={`rounded-l-lg px-2.5 py-2 ${browseMode === "grid" ? "bg-purple-600 text-white" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setBrowseMode("list")}
              className={`rounded-r-lg px-2.5 py-2 ${browseMode === "list" ? "bg-purple-600 text-white" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, city, type…"
              className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
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
                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {hasFilters && <span className="h-1.5 w-1.5 rounded-full bg-purple-600" />}
          </button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase text-zinc-500">{t("filterLocation")}</p>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    placeholder={t("locationFilterPlaceholder")}
                    className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                  {locationFilter && (
                    <button onClick={() => setLocationFilter("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            {hasFilters && (
              <button
                onClick={() => { setSearch(""); setLocationFilter(""); }}
                className="mt-3 text-xs font-medium text-purple-600 hover:text-purple-800 dark:text-purple-400"
              >
                {t("clearFilters")}
              </button>
            )}
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && filtered.length === 0 && (
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
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && (
          <p className="mb-3 text-xs text-zinc-400">
            {filtered.length} properties found
          </p>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-16 dark:border-zinc-700">
            {user ? (
              <>
                <Home className="mb-4 h-12 w-12 text-zinc-300 dark:text-zinc-600" />
                <p className="mb-1 text-base font-semibold text-zinc-700 dark:text-zinc-200">
                  {t("emptyLoggedTitle")}
                </p>
                <p className="mb-4 max-w-sm text-center text-sm text-zinc-500 dark:text-zinc-400">
                  {hasFilters ? t("emptyLoggedSubFilters") : t("emptyLoggedSub")}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  {hasFilters && (
                    <button
                      onClick={() => { setSearch(""); setLocationFilter(""); }}
                      className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                    >
                      {t("clearFilters")}
                    </button>
                  )}
                  <Link
                    href="/properties/new"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add property
                  </Link>
                </div>
              </>
            ) : (
              <>
                <span className="mb-4 text-5xl">🏠</span>
                <p className="mb-1 text-base font-semibold text-zinc-700 dark:text-zinc-200">
                  {hasFilters ? t("emptyGuestTitleFiltered") : "No properties available right now"}
                </p>
                <p className="mb-5 max-w-sm text-center text-sm text-zinc-500 dark:text-zinc-400">
                  {t("emptyGuestSub")}
                </p>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 rounded-full bg-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-purple-700"
                >
                  {t("emptyGuestCta")}
                </Link>
              </>
            )}
          </div>
        )}

        <AdBanner placement="inline_feed" className="mb-4" />

        {/* Grid */}
        {filtered.length > 0 && browseMode === "grid" && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.slice(0, visibleCount).map((row) => (
                <div key={row.id} className="item-card-container relative" style={{ containerType: "inline-size" }}>
                  <PropertyCard row={row} mode="grid" />
                  {user ? (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(row.id); }}
                      className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-1.5 shadow-sm backdrop-blur hover:bg-white dark:bg-zinc-900/80 dark:hover:bg-zinc-800"
                    >
                      <Heart className={`h-3.5 w-3.5 ${favorites.has(row.id) ? "fill-red-500 text-red-500" : "text-zinc-400"}`} />
                    </button>
                  ) : (
                    <AuthGateModal returnTo="/register?returnTo=/properties" gaEvent="favorite_click_guest">
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
                <button type="button" onClick={loadMore} className="rounded-full bg-purple-600 px-6 py-2 text-sm font-semibold text-white hover:bg-purple-700">
                  {t("loadMoreItems")} ({filtered.length - visibleCount} {t("remainingItems")})
                </button>
              </div>
            )}
          </>
        )}

        {/* List */}
        {filtered.length > 0 && browseMode === "list" && (
          <>
            <div className="space-y-2">
              {filtered.slice(0, visibleCount).map((row) => (
                <div key={row.id} className="relative">
                  <PropertyCard row={row} mode="list" />
                  {user ? (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(row.id); }}
                      className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-1.5 shadow-sm backdrop-blur hover:bg-white dark:bg-zinc-900/80 dark:hover:bg-zinc-800"
                    >
                      <Heart className={`h-3.5 w-3.5 ${favorites.has(row.id) ? "fill-red-500 text-red-500" : "text-zinc-400"}`} />
                    </button>
                  ) : (
                    <AuthGateModal returnTo="/register?returnTo=/properties" gaEvent="favorite_click_guest">
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
                <button type="button" onClick={loadMore} className="rounded-full bg-purple-600 px-6 py-2 text-sm font-semibold text-white hover:bg-purple-700">
                  {t("loadMoreItems")} ({filtered.length - visibleCount} {t("remainingItems")})
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
