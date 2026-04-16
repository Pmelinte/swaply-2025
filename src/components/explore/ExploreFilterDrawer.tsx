"use client";

import { useState } from "react";
import { X, ChevronDown, ChevronRight, Search } from "lucide-react";

type FilterState = {
  categories: string[];
  subcategories: string[];
  distance: number;
  condition: string | null;
  exchangeType: string | null;
};

export type ExploreFilters = {
  wantsFilters: FilterState;
  offersFilters: FilterState;
};

const defaultFilter = (): FilterState => ({
  categories: [],
  subcategories: [],
  distance: 500,
  condition: null,
  exchangeType: null,
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

/* ─── Single filter section (used for both Wants and Offers) ─── */
function FilterSection({
  title,
  filters,
  onChange,
  searchQuery,
}: {
  title: string;
  filters: FilterState;
  onChange: (f: FilterState) => void;
  searchQuery: string;
}) {
  const [objectsExpanded, setObjectsExpanded] = useState(false);

  const q = searchQuery.toLowerCase();

  const visibleTopCategories = TOP_CATEGORIES.filter(
    (c) => !q || c.label.toLowerCase().includes(q) || (c.hasSubcategories && "objects".includes(q))
  );

  const visibleSubcats = OBJECT_SUBCATEGORIES.filter(
    (s) => !q || s.label.toLowerCase().includes(q) || s.key.includes(q)
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
    <div className="mb-4">
      <h3 className="mb-3 text-sm font-bold text-zinc-900 dark:text-zinc-50">{title}</h3>

      {/* Categories */}
      <div className="mb-4 space-y-1.5">
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
                  {objectsExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
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

      {/* Distance slider */}
      <div className="mb-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Distance: <span className="font-bold text-zinc-700 dark:text-zinc-200">{filters.distance} km</span>
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

      {/* Condition */}
      <div className="mb-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Condition
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

      {/* Exchange type */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Exchange type
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

/* ─── Main drawer ─── */
type Props = {
  open: boolean;
  onClose: () => void;
  onApply: (filters: ExploreFilters) => void;
};

export function ExploreFilterDrawer({ open, onClose, onApply }: Props) {
  const [search, setSearch] = useState("");
  const [wantsFilters, setWantsFilters] = useState<FilterState>(defaultFilter);
  const [offersFilters, setOffersFilters] = useState<FilterState>(defaultFilter);

  const handleReset = () => {
    setWantsFilters(defaultFilter());
    setOffersFilters(defaultFilter());
    setSearch("");
  };

  const handleApply = () => {
    onApply({ wantsFilters, offersFilters });
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer — slides from right */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:bg-zinc-900 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Explore filters"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4 dark:border-zinc-700">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Filters</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Close filters"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories…"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
            />
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pt-4">
          <FilterSection
            title="Filter Wants"
            filters={wantsFilters}
            onChange={setWantsFilters}
            searchQuery={search}
          />
          <div className="my-4 border-t border-zinc-200 dark:border-zinc-700" />
          <FilterSection
            title="Filter Offers"
            filters={offersFilters}
            onChange={setOffersFilters}
            searchQuery={search}
          />
          {/* bottom padding so content isn't behind sticky footer */}
          <div className="h-4" />
        </div>

        {/* Sticky footer */}
        <div className="flex gap-3 border-t border-zinc-200 bg-white px-4 py-4 dark:border-zinc-700 dark:bg-zinc-900">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 rounded-xl border border-zinc-300 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Apply filters
          </button>
        </div>
      </div>
    </>
  );
}

export default ExploreFilterDrawer;
