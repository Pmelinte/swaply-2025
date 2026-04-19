"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X, ChevronDown, ChevronRight, Search, Star } from "lucide-react";
import { useDrawerStore } from "@/lib/state/drawerStore";

/** Custom event name that pages (explore, matching) listen for. */
export const EXPLORE_APPLY_EVENT = "unified-drawer-explore-apply";

type CatalogFilter = {
  categories: string[];
  subcategories: string[];
  distance: number;
  condition: string | null;
  exchangeType: string | null;
};

type UserType = "individual" | "business" | "both";

export type ProfileFilter = {
  distance: number;
  userType: UserType;
  verifiedOnly: boolean;
  minRating: number;
};

export type ExploreFilters = {
  wantsFilters: CatalogFilter;
  offersFilters: CatalogFilter;
  profileFilters: ProfileFilter;
};

const defaultCatalog = (): CatalogFilter => ({
  categories: [],
  subcategories: [],
  distance: 500,
  condition: null,
  exchangeType: null,
});

const defaultProfile = (): ProfileFilter => ({
  distance: 50,
  userType: "both",
  verifiedOnly: false,
  minRating: 0,
});

const OBJECT_SUBCATEGORIES = [
  { key: "electronics", label: "Electronics" },
  { key: "sport", label: "Sports" },
  { key: "arts", label: "Art & Hobby" },
  { key: "books", label: "Books" },
  { key: "home", label: "Home" },
  { key: "fashion", label: "Fashion" },
  { key: "automotive", label: "Auto" },
  { key: "music", label: "Music" },
  { key: "garden", label: "Garden" },
  { key: "toys", label: "Toys" },
  { key: "tools", label: "Tools" },
  { key: "other", label: "Other" },
];

const TOP_CATEGORIES = [
  { key: "objects", label: "Objects", hasSubcategories: true },
  { key: "properties", label: "Properties", hasSubcategories: false },
  { key: "services", label: "Services", hasSubcategories: false },
  { key: "events", label: "Events", hasSubcategories: false },
];

const CONDITIONS = [
  { key: "new", label: "New" },
  { key: "like_new", label: "Like new" },
  { key: "good", label: "Good" },
  { key: "fair", label: "Fair" },
];

const EXCHANGE_TYPES = [
  { key: "direct_swap", label: "Direct swap" },
  { key: "partial_exchange", label: "Partial exchange" },
  { key: "any", label: "Any" },
];

/* ─── Catalog tab (Wants / Offers) ─── */
function CatalogPanel({
  filters,
  onChange,
  searchQuery,
  t,
}: {
  filters: CatalogFilter;
  onChange: (f: CatalogFilter) => void;
  searchQuery: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const [objectsExpanded, setObjectsExpanded] = useState(false);
  const q = searchQuery.toLowerCase();

  const visibleTopCategories = TOP_CATEGORIES.filter(
    (c) => !q || c.label.toLowerCase().includes(q) || (c.hasSubcategories && "objects".includes(q)),
  );
  const visibleSubcats = OBJECT_SUBCATEGORIES.filter(
    (s) => !q || s.label.toLowerCase().includes(q) || s.key.includes(q),
  );

  const toggleCategory = (key: string) => {
    const next = filters.categories.includes(key)
      ? filters.categories.filter((c) => c !== key)
      : [...filters.categories, key];
    onChange({ ...filters, categories: next });
  };

  const toggleSubcategory = (key: string) => {
    const next = filters.subcategories.includes(key)
      ? filters.subcategories.filter((c) => c !== key)
      : [...filters.subcategories, key];
    onChange({ ...filters, subcategories: next });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        {visibleTopCategories.map((cat) => (
          <div key={cat.key}>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleCategory(cat.key)}
                className={`flex-1 rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                  filters.categories.includes(cat.key)
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {cat.label}
              </button>
              {cat.hasSubcategories && (
                <button
                  type="button"
                  onClick={() => setObjectsExpanded((v) => !v)}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  aria-label="Toggle subcategories"
                >
                  {objectsExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              )}
            </div>
            {cat.hasSubcategories && (objectsExpanded || q) && (
              <div className="ml-3 mt-1.5 flex flex-wrap gap-1.5">
                {visibleSubcats.map((sub) => (
                  <button
                    key={sub.key}
                    type="button"
                    onClick={() => toggleSubcategory(sub.key)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                      filters.subcategories.includes(sub.key)
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {t("distance")}: <span className="font-bold text-zinc-700 dark:text-zinc-200">{filters.distance} km</span>
        </p>
        <input
          type="range"
          min={5}
          max={500}
          step={5}
          value={filters.distance}
          onChange={(e) => onChange({ ...filters, distance: Number(e.target.value) })}
          className="w-full accent-blue-600"
        />
        <div className="mt-0.5 flex justify-between text-xs text-zinc-400">
          <span>5 km</span>
          <span>500 km</span>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {t("condition")}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {CONDITIONS.map((cond) => (
            <button
              key={cond.key}
              type="button"
              onClick={() =>
                onChange({
                  ...filters,
                  condition: filters.condition === cond.key ? null : cond.key,
                })
              }
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                filters.condition === cond.key
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300"
              }`}
            >
              {cond.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {t("exchangeType")}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {EXCHANGE_TYPES.map((et) => (
            <button
              key={et.key}
              type="button"
              onClick={() =>
                onChange({
                  ...filters,
                  exchangeType: filters.exchangeType === et.key ? null : et.key,
                })
              }
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                filters.exchangeType === et.key
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300"
              }`}
            >
              {et.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Profile tab ─── */
function ProfilePanel({
  filters,
  onChange,
  t,
}: {
  filters: ProfileFilter;
  onChange: (f: ProfileFilter) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const USER_TYPES: Array<{ key: UserType; labelKey: string }> = [
    { key: "individual", labelKey: "profileUserTypeIndividual" },
    { key: "business", labelKey: "profileUserTypeBusiness" },
    { key: "both", labelKey: "profileUserTypeBoth" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {t("distance")}: <span className="font-bold text-zinc-700 dark:text-zinc-200">{filters.distance} km</span>
        </p>
        <input
          type="range"
          min={5}
          max={500}
          step={5}
          value={filters.distance}
          onChange={(e) => onChange({ ...filters, distance: Number(e.target.value) })}
          className="w-full accent-blue-600"
        />
        <div className="mt-0.5 flex justify-between text-xs text-zinc-400">
          <span>5 km</span>
          <span>500 km</span>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {t("profileUserTypeTitle")}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {USER_TYPES.map((ut) => (
            <button
              key={ut.key}
              type="button"
              onClick={() => onChange({ ...filters, userType: ut.key })}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                filters.userType === ut.key
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300"
              }`}
            >
              {t(ut.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <label className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-800">
        <span className="font-medium text-zinc-700 dark:text-zinc-200">{t("profileVerifiedOnly")}</span>
        <input
          type="checkbox"
          checked={filters.verifiedOnly}
          onChange={(e) => onChange({ ...filters, verifiedOnly: e.target.checked })}
          className="h-4 w-4 accent-blue-600"
        />
      </label>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {t("profileMinRating")}
        </p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange({ ...filters, minRating: filters.minRating === n ? 0 : n })}
              className="rounded-md p-1.5 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
            >
              <Star
                className={`h-5 w-5 ${
                  n <= filters.minRating
                    ? "fill-amber-400 text-amber-400"
                    : "text-zinc-300 dark:text-zinc-600"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main drawer variant ─── */
type TabKey = "wants" | "offers" | "profile";

export default function DrawerExplore() {
  const t = useTranslations("explore.filterDrawer");
  const close = useDrawerStore((s) => s.close);

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabKey>("wants");
  const [wantsFilters, setWantsFilters] = useState<CatalogFilter>(defaultCatalog);
  const [offersFilters, setOffersFilters] = useState<CatalogFilter>(defaultCatalog);
  const [profileFilters, setProfileFilters] = useState<ProfileFilter>(defaultProfile);

  const handleReset = () => {
    setWantsFilters(defaultCatalog());
    setOffersFilters(defaultCatalog());
    setProfileFilters(defaultProfile());
    setSearch("");
  };

  const handleApply = () => {
    const filters: ExploreFilters = { wantsFilters, offersFilters, profileFilters };
    window.dispatchEvent(new CustomEvent(EXPLORE_APPLY_EVENT, { detail: filters }));
    close();
  };

  const TABS: Array<{ key: TabKey; labelKey: string }> = [
    { key: "wants", labelKey: "wantsTab" },
    { key: "offers", labelKey: "offersTab" },
    { key: "profile", labelKey: "profileTab" },
  ];

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4 dark:border-zinc-700">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{t("title")}</h2>
        <button
          type="button"
          onClick={close}
          className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label="Close filters"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-700" role="tablist">
        {TABS.map((tabDef) => (
          <button
            key={tabDef.key}
            type="button"
            role="tab"
            aria-selected={tab === tabDef.key}
            onClick={() => setTab(tabDef.key)}
            className={`flex-1 py-3 text-sm font-semibold transition ${
              tab === tabDef.key
                ? "border-b-2 border-blue-600 text-blue-700 dark:text-blue-300"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {t(tabDef.labelKey)}
          </button>
        ))}
      </div>

      {/* Search (catalog tabs only) */}
      {tab !== "profile" && (
        <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
            />
          </div>
        </div>
      )}

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {tab === "wants" && (
          <CatalogPanel
            filters={wantsFilters}
            onChange={setWantsFilters}
            searchQuery={search}
            t={t}
          />
        )}
        {tab === "offers" && (
          <CatalogPanel
            filters={offersFilters}
            onChange={setOffersFilters}
            searchQuery={search}
            t={t}
          />
        )}
        {tab === "profile" && <ProfilePanel filters={profileFilters} onChange={setProfileFilters} t={t} />}
        <div className="h-4" />
      </div>

      {/* Footer: Reset / Apply */}
      <div className="flex gap-3 border-t border-zinc-200 bg-white px-4 py-4 dark:border-zinc-700 dark:bg-zinc-900">
        <button
          type="button"
          onClick={handleReset}
          className="flex-1 rounded-xl border border-zinc-300 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {t("reset")}
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          {t("apply")}
        </button>
      </div>
    </>
  );
}
