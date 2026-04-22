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
  CalendarDays,
  Clock,
  Globe,
} from "lucide-react";

interface EventRow {
  id: string;
  title?: string;
  event_title?: string;
  status?: string;
  created_at?: string;
  owner_id?: string;
  event_type_l1?: string;
  event_type_l2?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  city?: string;
  country?: string;
  region?: string;
  venue_name?: string;
  is_online?: boolean;
  description?: string;
  event_description?: string;
  photos?: string[] | null;
  images?: string[] | null;
  capacity_available?: number;
  swap_wants_description?: string;
  [key: string]: unknown;
}

type BrowseMode = "grid" | "list";

function getTitle(row: EventRow): string {
  return row.title || row.event_title || "Event listing";
}

function getPhotos(row: EventRow): string[] {
  const raw = row.photos ?? row.images;
  if (Array.isArray(raw)) return raw.filter((p): p is string => typeof p === "string");
  return [];
}

function getLocation(row: EventRow): string {
  if (row.is_online) return "Online";
  if (row.city && row.country) return `${row.city}, ${row.country}`;
  if (row.city) return row.city;
  if (row.country) return row.country;
  if (row.venue_name) return row.venue_name;
  return "";
}

function getDescription(row: EventRow): string {
  return row.description || row.event_description || row.swap_wants_description || "";
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function EventCard({ row, mode }: { row: EventRow; mode: BrowseMode }) {
  const router = useRouter();
  const photos = getPhotos(row);
  const location = getLocation(row);
  const title = getTitle(row);
  const description = getDescription(row);
  const category = row.event_type_l1 || row.event_type_l2 || "";
  const dateLabel = row.start_date ? formatDate(row.start_date) : "";

  if (mode === "list") {
    return (
      <button
        onClick={() => router.push(`/events/${row.id}`)}
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
            {category && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                {category}
              </span>
            )}
            {row.is_online && (
              <span className="flex items-center gap-0.5">
                <Globe className="h-3 w-3" />Online
              </span>
            )}
            {dateLabel && (
              <span className="flex items-center gap-0.5">
                <Clock className="h-3 w-3" />{dateLabel}
              </span>
            )}
            {location && !row.is_online && (
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
      onClick={() => router.push(`/events/${row.id}`)}
      className="item-card group flex w-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800"
    >
      <div className="item-card__image relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-700">
        <SafeImage
          src={photos[0] || NO_IMAGE_URL}
          alt={title}
          fill
          className="object-cover transition group-hover:scale-105"
          sizes="100cqi"
          unoptimized={!photos[0]}
        />
        {category && (
          <span className="absolute left-2 top-2 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
            {category}
          </span>
        )}
        {row.is_online && (
          <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 backdrop-blur dark:bg-zinc-900/80 dark:text-zinc-200">
            <Globe className="inline h-2.5 w-2.5 mr-0.5" />Online
          </span>
        )}
      </div>
      <div className="item-card__body flex flex-1 flex-col p-3">
        <h3 className="item-card__title truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          {dateLabel && (
            <span className="flex items-center gap-0.5">
              <Clock className="h-3 w-3" />{dateLabel}
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

export default function EventsPage() {
  const { user } = useAppState();
  const { favoriteIds: favorites, toggleFavorite } = useFavorites(user?.id);
  const t = useTranslations("objects");
  const tb = useTranslations("branches");
  const te = useTranslations("events");

  const [browseMode, setBrowseMode] = useState<BrowseMode>("grid");
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);

  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMore = useCallback(() => {
    setVisibleCount((c) => c + 20);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchEvents() {
      setLoading(true);

      const supabase = getSupabaseClient();
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("events_listings")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(500);

      if (!cancelled) {
        if (!error && data) {
          setEvents(data as EventRow[]);
        }
        setLoading(false);
      }
    }

    void fetchEvents();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let result = events;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e) => {
        const title = getTitle(e).toLowerCase();
        const loc = getLocation(e).toLowerCase();
        const cat = (e.event_type_l1 || e.event_type_l2 || "").toLowerCase();
        const desc = getDescription(e).toLowerCase();
        return title.includes(q) || loc.includes(q) || cat.includes(q) || desc.includes(q);
      });
    }
    if (locationFilter.trim()) {
      const loc = locationFilter.toLowerCase();
      result = result.filter((e) => getLocation(e).toLowerCase().includes(loc));
    }
    return result;
  }, [events, search, locationFilter]);

  const hasFilters = !!search || !!locationFilter;

  return (
    <div>
      {!user && <GuestBanner />}

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-amber-500" />
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{tb("events")}</h1>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{tb("eventsDesc")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={user ? "/events/new" : "/register?returnTo=/events/new"}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-600"
            >
              <Plus className="h-4 w-4" />
              Add event
            </Link>
          </div>
        </div>

        {/* View mode + search */}
        <div className="mb-4 flex items-center gap-2">
          <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setBrowseMode("grid")}
              className={`rounded-l-lg px-2.5 py-2 ${browseMode === "grid" ? "bg-amber-500 text-white" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setBrowseMode("list")}
              className={`rounded-r-lg px-2.5 py-2 ${browseMode === "list" ? "bg-amber-500 text-white" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
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
              placeholder="Search by title, category, location…"
              className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
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
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {hasFilters && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
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
                    className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
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
                className="mt-3 text-xs font-medium text-amber-600 hover:text-amber-800 dark:text-amber-400"
              >
                {t("clearFilters")}
              </button>
            )}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
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

        {!loading && (
          <p className="mb-3 text-xs text-zinc-400">
            {filtered.length} events found
          </p>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-16 dark:border-zinc-700">
            {user ? (
              <>
                <CalendarDays className="mb-4 h-12 w-12 text-zinc-300 dark:text-zinc-600" />
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
                    href="/events/new"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                  >
                    <Plus className="h-4 w-4" />
                    Add event
                  </Link>
                </div>
              </>
            ) : (
              <>
                <span className="mb-4 text-5xl">🎫</span>
                <p className="mb-1 text-base font-semibold text-zinc-700 dark:text-zinc-200">
                  {hasFilters ? t("emptyGuestTitleFiltered") : te("noEvents")}
                </p>
                <p className="mb-5 max-w-sm text-center text-sm text-zinc-500 dark:text-zinc-400">
                  {te("noEventsDesc")}
                </p>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-amber-600"
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
                  <EventCard row={row} mode="grid" />
                  {user ? (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(row.id); }}
                      className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-1.5 shadow-sm backdrop-blur hover:bg-white dark:bg-zinc-900/80 dark:hover:bg-zinc-800"
                    >
                      <Heart className={`h-3.5 w-3.5 ${favorites.has(row.id) ? "fill-red-500 text-red-500" : "text-zinc-400"}`} />
                    </button>
                  ) : (
                    <AuthGateModal returnTo="/register?returnTo=/events" gaEvent="favorite_click_guest">
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
                <button type="button" onClick={loadMore} className="rounded-full bg-amber-500 px-6 py-2 text-sm font-semibold text-white hover:bg-amber-600">
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
                  <EventCard row={row} mode="list" />
                  {user ? (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(row.id); }}
                      className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-1.5 shadow-sm backdrop-blur hover:bg-white dark:bg-zinc-900/80 dark:hover:bg-zinc-800"
                    >
                      <Heart className={`h-3.5 w-3.5 ${favorites.has(row.id) ? "fill-red-500 text-red-500" : "text-zinc-400"}`} />
                    </button>
                  ) : (
                    <AuthGateModal returnTo="/register?returnTo=/events" gaEvent="favorite_click_guest">
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
                <button type="button" onClick={loadMore} className="rounded-full bg-amber-500 px-6 py-2 text-sm font-semibold text-white hover:bg-amber-600">
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
