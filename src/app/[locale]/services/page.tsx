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
  Wrench,
  Monitor,
  Users,
  Star,
} from "lucide-react";
import { CAT } from "@/lib/categoryColors";

interface ServiceRow {
  id: string;
  title?: string;
  status?: string;
  created_at?: string;
  owner_id?: string;
  description?: string;
  location?: string;
  photos?: string[] | null;
  images?: (string | { url?: string; order?: number })[] | null;
  image_url?: string | null;
  // items table fields
  category?: string;
  is_active?: boolean;
  wizard_type?: string;
  item_type?: string;
  swap_wants_description?: string;
  perceived_value_tier?: string;
  service_data?: {
    service_category_l1?: string;
    service_category_l2?: string;
    service_category_l3?: string;
    service_title?: string;
    service_short_description?: string;
    service_modality?: string;
    experience_years?: number;
    experience_level?: string;
    provider_type?: string;
    languages_service?: string[];
    portfolio_images?: string[];
    availability_days?: string[];
  } | null;
  items?: {
    title?: string;
    image_url?: string | null;
    images?: (string | { url?: string; order?: number })[] | null;
    description?: string;
  } | null;
}

type BrowseMode = "grid" | "list";

function getPhotos(row: ServiceRow): string[] {
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
    const urls = (it.images as (string | { url?: string; order?: number })[])
      .map((p) => (typeof p === "string" ? p : p?.url))
      .filter((u): u is string => typeof u === "string" && u.length > 0);
    if (urls.length > 0) return urls;
  }
  const sd = row.service_data;
  if (sd?.portfolio_images && Array.isArray(sd.portfolio_images)) return sd.portfolio_images;
  return [];
}

function getCategoryL1(row: ServiceRow): string {
  return row.service_data?.service_category_l1 || row.wizard_type || "";
}

function getCategoryL2(row: ServiceRow): string {
  return row.service_data?.service_category_l2 || "";
}

function getModality(row: ServiceRow): string {
  return row.service_data?.service_modality || "";
}

function getExperienceLevel(row: ServiceRow): string {
  return row.service_data?.experience_level || "";
}

function getTitle(row: ServiceRow): string {
  if (row.title) return row.title;
  if (row.items?.title) return row.items.title;
  const sd = row.service_data;
  if (sd?.service_title) return sd.service_title;
  const cat = getCategoryL1(row);
  if (cat) return cat;
  return "Service listing";
}

function getDescription(row: ServiceRow): string {
  return row.description || row.service_data?.service_short_description || row.swap_wants_description || "";
}

const MODALITY_ICONS: Record<string, React.ReactNode> = {
  remote: <Monitor className="inline h-2.5 w-2.5 mr-0.5" />,
  in_person: <Users className="inline h-2.5 w-2.5 mr-0.5" />,
  hybrid: <Wrench className="inline h-2.5 w-2.5 mr-0.5" />,
};

function ServiceCard({ row, mode }: { row: ServiceRow; mode: BrowseMode }) {
  const router = useRouter();
  const photos = getPhotos(row);
  const title = getTitle(row);
  const catL1 = getCategoryL1(row);
  const catL2 = getCategoryL2(row);
  const modality = getModality(row);
  const experienceLevel = getExperienceLevel(row);
  const description = getDescription(row);
  const location = row.location || "";

  if (mode === "list") {
    return (
      <button
        onClick={() => router.push(`/services/${row.id}`)}
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
            {catL1 && (
              <span className={`rounded-full px-2 py-0.5 font-medium ${CAT.services.chip}`}>
                {catL1}
              </span>
            )}
            {catL2 && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                {catL2}
              </span>
            )}
            {modality && (
              <span className="flex items-center gap-0.5">
                {MODALITY_ICONS[modality]}{modality}
              </span>
            )}
            {experienceLevel && (
              <span className="flex items-center gap-0.5">
                <Star className="h-3 w-3" />{experienceLevel}
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
      onClick={() => router.push(`/services/${row.id}`)}
      className={`item-card group flex w-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800 ${CAT.services.topBorder}`}
    >
      <div className={`item-card__image relative aspect-[4/3] w-full overflow-hidden dark:bg-zinc-700 ${CAT.services.placeholder}`}>
        <SafeImage
          src={photos[0] || NO_IMAGE_URL}
          alt={title}
          fill
          className="object-cover transition group-hover:scale-105"
          sizes="100cqi"
          unoptimized={!photos[0]}
        />
        {catL1 && (
          <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur ${CAT.services.badge}`}>
            <Wrench className="inline h-2.5 w-2.5 mr-0.5" />{catL1}
          </span>
        )}
        {modality && (
          <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 backdrop-blur dark:bg-zinc-900/80 dark:text-zinc-200">
            {MODALITY_ICONS[modality]}{modality}
          </span>
        )}
      </div>
      <div className="item-card__body flex flex-1 flex-col p-3">
        <h3 className="item-card__title truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
          {catL2 && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-700">{catL2}</span>
          )}
          {experienceLevel && (
            <span className="flex items-center gap-0.5">
              <Star className="h-3 w-3" />{experienceLevel}
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

export default function ServicesPage() {
  const { user, items, loading: stateLoading } = useAppState();
  const { favoriteIds: favorites, toggleFavorite } = useFavorites(user?.id);
  const t = useTranslations("objects");
  const tb = useTranslations("branches");
  const tc = useTranslations("common");

  const [browseMode, setBrowseMode] = useState<BrowseMode>("grid");
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [modalityFilter, setModalityFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "title">("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);

  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  const loadMore = useCallback(() => {
    setVisibleCount((c) => c + 20);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchServices() {
      setLoadingServices(true);

      const supabase = getSupabaseClient();
      if (!supabase) {
        setLoadingServices(false);
        return;
      }

      // Try dedicated services table first
      const { data: svcData, error: svcError } = await supabase
        .from("services")
        .select("*, items(title, image_url, images, description)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(500);

      if (!cancelled && !svcError && svcData && svcData.length > 0) {
        setServices(svcData as ServiceRow[]);
        setLoadingServices(false);
        return;
      }

      // Fall back to items table filtered by category/wizard_type
      const { data: itemsData } = await supabase
        .from("items")
        .select("*")
        .or("category.eq.service,item_type.eq.service")
        .eq("status", "active")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(500);

      if (!cancelled) {
        setServices((itemsData as ServiceRow[]) ?? []);
        setLoadingServices(false);
      }
    }

    fetchServices();
    return () => { cancelled = true; };
  }, []);

  // Merge with state items already loaded
  const stateServices = useMemo(
    () => items.filter((i) => (i.category === "service" || i.listingType === "service") && i.isActive && i.status === "active"),
    [items],
  );

  const allServices = useMemo<ServiceRow[]>(() => {
    const merged: ServiceRow[] = [...services];
    const ids = new Set(services.map((s) => s.id));
    for (const item of stateServices) {
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
  }, [services, stateServices]);

  const filtered = useMemo(() => {
    let result = allServices;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((s) => {
        const title = getTitle(s).toLowerCase();
        const cat = getCategoryL1(s).toLowerCase();
        const cat2 = getCategoryL2(s).toLowerCase();
        const desc = getDescription(s).toLowerCase();
        const loc = (s.location || "").toLowerCase();
        return title.includes(q) || cat.includes(q) || cat2.includes(q) || desc.includes(q) || loc.includes(q);
      });
    }
    if (locationFilter.trim()) {
      const loc = locationFilter.toLowerCase();
      result = result.filter((s) => (s.location || "").toLowerCase().includes(loc));
    }
    if (categoryFilter) result = result.filter((s) => getCategoryL1(s) === categoryFilter);
    if (modalityFilter) result = result.filter((s) => getModality(s) === modalityFilter);
    if (availabilityFilter) result = result.filter((s) => s.service_data?.availability_days?.includes(availabilityFilter));
    result = [...result].sort((a, b) => sortBy === "title"
      ? getTitle(a).localeCompare(getTitle(b))
      : String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")));
    return result;
  }, [allServices, search, locationFilter, categoryFilter, modalityFilter, availabilityFilter, sortBy]);

  const categoryOptions = useMemo(() => Array.from(new Set(allServices.map(getCategoryL1).filter(Boolean))).sort(), [allServices]);
  const modalityOptions = useMemo(() => Array.from(new Set(allServices.map(getModality).filter(Boolean))).sort(), [allServices]);
  const availabilityOptions = useMemo(() => Array.from(new Set(allServices.flatMap((s) => s.service_data?.availability_days ?? []))).sort(), [allServices]);
  const hasFilters = !!search || !!locationFilter || !!categoryFilter || !!modalityFilter || !!availabilityFilter || sortBy !== "newest";
  const isLoading = loadingServices && stateLoading.items;
  const serviceLabel = tb("services");
  const addServiceLabel = `${tc("add")} ${serviceLabel}`;
  const searchServicesPlaceholder = `${tc("search")} ${serviceLabel}…`;

  return (
    <div>
      {!user && <GuestBanner />}

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{serviceLabel}</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{tb("servicesDesc")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={user ? "/services/new" : "/register?returnTo=/services/new"}
              className="inline-flex items-center gap-1.5 rounded-xl bg-cat-svc px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-500"
            >
              <Plus className="h-4 w-4" />
              {addServiceLabel}
            </Link>
          </div>
        </div>

        {/* View mode + search */}
        <div className="mb-4 flex items-center gap-2">
          <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setBrowseMode("grid")}
              className={`rounded-l-lg px-2.5 py-2 ${browseMode === "grid" ? "bg-green-600 text-white" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setBrowseMode("list")}
              className={`rounded-r-lg px-2.5 py-2 ${browseMode === "list" ? "bg-green-600 text-white" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
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
              placeholder={searchServicesPlaceholder}
              className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
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
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {hasFilters && <span className="h-1.5 w-1.5 rounded-full bg-green-600" />}
          </button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
            <div className="flex flex-wrap gap-4">
              <FilterSelect label="Category" value={categoryFilter} onChange={setCategoryFilter} options={categoryOptions} />
              <FilterSelect label="Delivery" value={modalityFilter} onChange={setModalityFilter} options={modalityOptions} />
              <FilterSelect label="Availability" value={availabilityFilter} onChange={setAvailabilityFilter} options={availabilityOptions} />
              <FilterSelect label="Sort" value={sortBy} onChange={(value) => setSortBy(value === "title" ? "title" : "newest")} options={["newest", "title"]} />
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase text-zinc-500">{t("filterLocation")}</p>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    placeholder={t("locationFilterPlaceholder")}
                    className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
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
                onClick={() => { setSearch(""); setLocationFilter(""); setCategoryFilter(""); setModalityFilter(""); setAvailabilityFilter(""); setSortBy("newest"); }}
                className="mt-3 text-xs font-medium text-green-600 hover:text-green-800 dark:text-green-400"
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
            {filtered.length} {serviceLabel}
          </p>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-16 dark:border-zinc-700">
            {user ? (
              <>
                <Wrench className="mb-4 h-12 w-12 text-zinc-300 dark:text-zinc-600" />
                <p className="mb-1 text-base font-semibold text-zinc-700 dark:text-zinc-200">
                  {hasFilters ? t("emptyLoggedTitle") : serviceLabel}
                </p>
                <p className="mb-4 max-w-sm text-center text-sm text-zinc-500 dark:text-zinc-400">
                  {hasFilters ? t("emptyLoggedSubFilters") : tb("servicesDesc")}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  {hasFilters && (
                    <button
                      onClick={() => { setSearch(""); setLocationFilter(""); setCategoryFilter(""); setModalityFilter(""); setAvailabilityFilter(""); setSortBy("newest"); }}
                      className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                    >
                      {t("clearFilters")}
                    </button>
                  )}
                  <Link
                    href="/services/new"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4" />
                    {addServiceLabel}
                  </Link>
                </div>
              </>
            ) : (
              <>
                <span className="mb-4 text-5xl">🔧</span>
                <p className="mb-1 text-base font-semibold text-zinc-700 dark:text-zinc-200">
                  {hasFilters ? t("emptyGuestTitleFiltered") : serviceLabel}
                </p>
                <p className="mb-5 max-w-sm text-center text-sm text-zinc-500 dark:text-zinc-400">
                  {tb("servicesDesc")}
                </p>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-green-700"
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
                  <ServiceCard row={row} mode="grid" />
                  {user ? (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(row.id); }}
                      className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-1.5 shadow-sm backdrop-blur hover:bg-white dark:bg-zinc-900/80 dark:hover:bg-zinc-800"
                    >
                      <Heart className={`h-3.5 w-3.5 ${favorites.has(row.id) ? "fill-red-500 text-red-500" : "text-zinc-400"}`} />
                    </button>
                  ) : (
                    <AuthGateModal returnTo="/register?returnTo=/services" gaEvent="favorite_click_guest">
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
                <button type="button" onClick={loadMore} className="rounded-full bg-green-600 px-6 py-2 text-sm font-semibold text-white hover:bg-green-700">
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
                  <ServiceCard row={row} mode="list" />
                  {user ? (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(row.id); }}
                      className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-1.5 shadow-sm backdrop-blur hover:bg-white dark:bg-zinc-900/80 dark:hover:bg-zinc-800"
                    >
                      <Heart className={`h-3.5 w-3.5 ${favorites.has(row.id) ? "fill-red-500 text-red-500" : "text-zinc-400"}`} />
                    </button>
                  ) : (
                    <AuthGateModal returnTo="/register?returnTo=/services" gaEvent="favorite_click_guest">
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
                <button type="button" onClick={loadMore} className="rounded-full bg-green-600 px-6 py-2 text-sm font-semibold text-white hover:bg-green-700">
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


function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="text-xs font-semibold uppercase text-zinc-500">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 block rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs normal-case text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
        <option value="">Any</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}
