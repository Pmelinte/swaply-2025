"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X, Star, ChevronDown, ChevronUp } from "lucide-react";
import { useDrawerStore } from "@/lib/state/drawerStore";
import {
  SERVICE_L1_CATEGORIES,
  SERVICE_L2_MAP,
} from "@/lib/wizard/serviceWizardStore";
import {
  EVENT_L1_CATEGORIES,
  EVENT_L2_MAP,
} from "@/lib/wizard/eventWizardStore";

export const EXPLORE_APPLY_EVENT = "unified-drawer-explore-apply";

/* ─── Types ─── */

export type ObjectFilters = {
  categoryL1: string[];
  condition: string[];
  perceivedValueTier: string[];
  ageYearsMax: number;
  originalPackaging: boolean | null;
  swapOpenTo: string[];
  swapValueMatch: string | null;
  swapFlexibility: string | null;
  swapChainAllowed: boolean | null;
  swapPartialAllowed: boolean | null;
  crossCategorySwap: boolean | null;
};

export type PropertyFilters = {
  propertyType: string[];
  propertyCategory: string[];
  bedroomsMin: number;
  bathroomsMin: number;
  areaMin: number;
  areaMax: number;
  furnishingLevel: string[];
  exchangeType: string[];
  hasPool: boolean | null;
  hasGarage: boolean | null;
  hasElevator: boolean | null;
  country: string;
};

export type ServiceFilters = {
  categoryL1: string[];
  categoryL2: string[];
  modality: string[];
  experienceLevel: string[];
  swapFor: string[];
  valueMatch: string | null;
  geoPreference: string | null;
};

export type EventFilters = {
  eventTypeL1: string[];
  eventTypeL2: string[];
  isOnline: boolean | null;
  startDateFrom: string;
  startDateTo: string;
  country: string;
  swapFor: string[];
  valueMatch: string | null;
};

export type CatalogFilter = {
  selectedCategories: string[];
  distance: number;
  geography: string[];
  fulfilment: string[];
  objects: ObjectFilters;
  properties: PropertyFilters;
  services: ServiceFilters;
  events: EventFilters;
};

export type ProfileFilter = {
  distance: number;
  userType: "individual" | "business" | "both";
  verifiedOnly: boolean;
  minRating: number;
  languages: string[];
  badgeTier: string[];
};

export type ExploreFilters = {
  wantsFilters: CatalogFilter;
  offersFilters: CatalogFilter;
  profileFilters: ProfileFilter;
};

/* ─── Defaults ─── */

const defaultObjects = (): ObjectFilters => ({
  categoryL1: [],
  condition: [],
  perceivedValueTier: [],
  ageYearsMax: 0,
  originalPackaging: null,
  swapOpenTo: [],
  swapValueMatch: null,
  swapFlexibility: null,
  swapChainAllowed: null,
  swapPartialAllowed: null,
  crossCategorySwap: null,
});

const defaultProperties = (): PropertyFilters => ({
  propertyType: [],
  propertyCategory: [],
  bedroomsMin: 0,
  bathroomsMin: 0,
  areaMin: 0,
  areaMax: 0,
  furnishingLevel: [],
  exchangeType: [],
  hasPool: null,
  hasGarage: null,
  hasElevator: null,
  country: "",
});

const defaultServices = (): ServiceFilters => ({
  categoryL1: [],
  categoryL2: [],
  modality: [],
  experienceLevel: [],
  swapFor: [],
  valueMatch: null,
  geoPreference: null,
});

const defaultEvents = (): EventFilters => ({
  eventTypeL1: [],
  eventTypeL2: [],
  isOnline: null,
  startDateFrom: "",
  startDateTo: "",
  country: "",
  swapFor: [],
  valueMatch: null,
});

const defaultCatalog = (): CatalogFilter => ({
  selectedCategories: [],
  distance: 500,
  geography: [],
  fulfilment: [],
  objects: defaultObjects(),
  properties: defaultProperties(),
  services: defaultServices(),
  events: defaultEvents(),
});

const defaultProfile = (): ProfileFilter => ({
  distance: 50,
  userType: "both",
  verifiedOnly: false,
  minRating: 0,
  languages: [],
  badgeTier: [],
});

/* ─── Static option lists ─── */

const OBJECT_CATEGORIES = [
  "Electronics", "Sports", "Art & Hobby", "Books", "Home", "Fashion",
  "Auto", "Music", "Garden", "Toys", "Tools", "Other",
];

const OBJECT_CONDITIONS = [
  { key: "new", label: "New" },
  { key: "like_new", label: "Like new" },
  { key: "good", label: "Good" },
  { key: "fair", label: "Fair" },
];

const PERCEIVED_VALUE_TIERS = [
  { key: "small", label: "Small" },
  { key: "medium", label: "Medium" },
  { key: "large", label: "Large" },
  { key: "sentimental", label: "Sentimental" },
];

const SWAP_OPEN_TO = [
  { key: "service", label: "Service" },
  { key: "property", label: "Property" },
  { key: "object", label: "Object" },
  { key: "event", label: "Event" },
  { key: "anything", label: "Anything" },
];

const SWAP_VALUE_MATCH = [
  { key: "Exact", label: "Exact" },
  { key: "Approximate", label: "Approx." },
  { key: "Flexible", label: "Flexible" },
];

const SWAP_FLEXIBILITY = [
  { key: "strict", label: "Strict" },
  { key: "moderate", label: "Moderate" },
  { key: "broad", label: "Broad" },
];

const PROPERTY_TYPES = [
  "House", "Apartment", "Villa", "Cabin", "Farm",
  "Cottage", "Townhouse", "Studio", "Room", "Mobile Home", "Other",
];

const PROPERTY_CATEGORIES = ["Residential", "Farm", "Land"];

const FURNISHING_LEVELS = ["Unfurnished", "Partially", "Fully", "Luxury"];

const PROPERTY_EXCHANGE_TYPES = [
  "Simultaneous", "Non-Simultaneous", "Points-Based",
  "Property ↔ Object", "Property ↔ Service", "Flexible",
];

const SERVICE_MODALITIES = ["Remote", "On-site", "Both"];

const EXPERIENCE_LEVELS = ["Junior", "Mid", "Senior", "Expert"];

const GEO_PREFS = ["Local", "Regional", "International", "Remote"];

const SWAP_FOR_TYPES = [
  { key: "service", label: "Service" },
  { key: "property", label: "Property" },
  { key: "object", label: "Object" },
  { key: "event", label: "Event" },
  { key: "anything", label: "Anything" },
];

const TOP_LANGUAGES = [
  "English", "Romanian", "French", "German", "Spanish", "Italian",
  "Portuguese", "Dutch", "Polish", "Russian", "Turkish", "Arabic",
  "Chinese", "Japanese", "Korean",
];

const BADGE_TIERS = [
  { key: "free", label: "Free" },
  { key: "premium", label: "Premium" },
  { key: "platinum", label: "Platinum" },
];

/* ─── Reusable primitives ─── */

function Pills({
  options,
  selected,
  onToggle,
  multi = true,
}: {
  options: { key: string; label: string }[];
  selected: string[];
  onToggle: (key: string) => void;
  multi?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onToggle(o.key)}
          className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
            selected.includes(o.key)
              ? "bg-blue-600 text-white"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function StringPills({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (key: string) => void;
}) {
  return (
    <Pills
      options={options.map((o) => ({ key: o, label: o }))}
      selected={selected}
      onToggle={onToggle}
    />
  );
}

function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean | null;
  onChange: (v: boolean | null) => void;
  label: string;
}) {
  const isOn = value === true;
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-800/50">
      <span className="text-sm text-zinc-700 dark:text-zinc-200">{label}</span>
      <button
        type="button"
        onClick={() => onChange(value === true ? null : true)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          isOn ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-600"
        }`}
        aria-checked={isOn}
        role="switch"
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
            isOn ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function RangeField({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  zeroLabel,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
  zeroLabel?: string;
}) {
  const display = value === 0 && zeroLabel ? zeroLabel : `${value}${unit ?? ""}`;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {label}
        </span>
        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-600"
      />
      <div className="mt-0.5 flex justify-between text-xs text-zinc-400">
        <span>{zeroLabel ?? `${min}${unit ?? ""}`}</span>
        <span>{`${max}${unit ?? ""}`}</span>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      {children}
    </div>
  );
}

function Divider() {
  return <hr className="border-zinc-200 dark:border-zinc-700" />;
}

function toggleArr(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

function toggleOne<T>(current: T | null, val: T): T | null {
  return current === val ? null : val;
}

/* ─── Object filters panel ─── */
function ObjectPanel({
  f,
  onChange,
}: {
  f: ObjectFilters;
  onChange: (f: ObjectFilters) => void;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-700/50 dark:bg-zinc-800/30">
      <FilterGroup label="Category">
        <StringPills
          options={OBJECT_CATEGORIES}
          selected={f.categoryL1}
          onToggle={(v) => onChange({ ...f, categoryL1: toggleArr(f.categoryL1, v) })}
        />
      </FilterGroup>

      <Divider />

      <FilterGroup label="Condition">
        <Pills
          options={OBJECT_CONDITIONS}
          selected={f.condition}
          onToggle={(v) => onChange({ ...f, condition: toggleArr(f.condition, v) })}
        />
      </FilterGroup>

      <FilterGroup label="Perceived value">
        <Pills
          options={PERCEIVED_VALUE_TIERS}
          selected={f.perceivedValueTier}
          onToggle={(v) =>
            onChange({ ...f, perceivedValueTier: toggleArr(f.perceivedValueTier, v) })
          }
        />
      </FilterGroup>

      <RangeField
        label="Max age (years)"
        value={f.ageYearsMax}
        min={0}
        max={50}
        step={1}
        unit=" yr"
        onChange={(v) => onChange({ ...f, ageYearsMax: v })}
        zeroLabel="Any"
      />

      <Divider />

      <FilterGroup label="Swap open to">
        <Pills
          options={SWAP_OPEN_TO}
          selected={f.swapOpenTo}
          onToggle={(v) => onChange({ ...f, swapOpenTo: toggleArr(f.swapOpenTo, v) })}
        />
      </FilterGroup>

      <FilterGroup label="Value match">
        <Pills
          options={SWAP_VALUE_MATCH}
          selected={f.swapValueMatch ? [f.swapValueMatch] : []}
          onToggle={(v) => onChange({ ...f, swapValueMatch: toggleOne(f.swapValueMatch, v) })}
        />
      </FilterGroup>

      <FilterGroup label="Swap flexibility">
        <Pills
          options={SWAP_FLEXIBILITY}
          selected={f.swapFlexibility ? [f.swapFlexibility] : []}
          onToggle={(v) => onChange({ ...f, swapFlexibility: toggleOne(f.swapFlexibility, v) })}
        />
      </FilterGroup>

      <Divider />

      <div className="space-y-2">
        <Toggle
          label="Original packaging"
          value={f.originalPackaging}
          onChange={(v) => onChange({ ...f, originalPackaging: v })}
        />
        <Toggle
          label="Chain swap allowed"
          value={f.swapChainAllowed}
          onChange={(v) => onChange({ ...f, swapChainAllowed: v })}
        />
        <Toggle
          label="Partial swap allowed"
          value={f.swapPartialAllowed}
          onChange={(v) => onChange({ ...f, swapPartialAllowed: v })}
        />
        <Toggle
          label="Cross-category swap"
          value={f.crossCategorySwap}
          onChange={(v) => onChange({ ...f, crossCategorySwap: v })}
        />
      </div>
    </div>
  );
}

/* ─── Property filters panel ─── */
function PropertyPanel({
  f,
  onChange,
}: {
  f: PropertyFilters;
  onChange: (f: PropertyFilters) => void;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-700/50 dark:bg-zinc-800/30">
      <FilterGroup label="Property type">
        <StringPills
          options={PROPERTY_TYPES}
          selected={f.propertyType}
          onToggle={(v) => onChange({ ...f, propertyType: toggleArr(f.propertyType, v) })}
        />
      </FilterGroup>

      <FilterGroup label="Category">
        <StringPills
          options={PROPERTY_CATEGORIES}
          selected={f.propertyCategory}
          onToggle={(v) =>
            onChange({ ...f, propertyCategory: toggleArr(f.propertyCategory, v) })
          }
        />
      </FilterGroup>

      <Divider />

      <RangeField
        label="Bedrooms (min)"
        value={f.bedroomsMin}
        min={0}
        max={10}
        step={1}
        unit="+"
        onChange={(v) => onChange({ ...f, bedroomsMin: v })}
        zeroLabel="Any"
      />

      <RangeField
        label="Bathrooms (min)"
        value={f.bathroomsMin}
        min={0}
        max={6}
        step={1}
        unit="+"
        onChange={(v) => onChange({ ...f, bathroomsMin: v })}
        zeroLabel="Any"
      />

      <RangeField
        label="Min area"
        value={f.areaMin}
        min={0}
        max={500}
        step={10}
        unit=" m²"
        onChange={(v) => onChange({ ...f, areaMin: v })}
        zeroLabel="Any"
      />

      <RangeField
        label="Max area"
        value={f.areaMax}
        min={0}
        max={2000}
        step={50}
        unit=" m²"
        onChange={(v) => onChange({ ...f, areaMax: v })}
        zeroLabel="Any"
      />

      <Divider />

      <FilterGroup label="Furnishing">
        <StringPills
          options={FURNISHING_LEVELS}
          selected={f.furnishingLevel}
          onToggle={(v) => onChange({ ...f, furnishingLevel: toggleArr(f.furnishingLevel, v) })}
        />
      </FilterGroup>

      <FilterGroup label="Exchange type">
        <StringPills
          options={PROPERTY_EXCHANGE_TYPES}
          selected={f.exchangeType}
          onToggle={(v) => onChange({ ...f, exchangeType: toggleArr(f.exchangeType, v) })}
        />
      </FilterGroup>

      <Divider />

      <div className="space-y-2">
        <Toggle
          label="Has swimming pool"
          value={f.hasPool}
          onChange={(v) => onChange({ ...f, hasPool: v })}
        />
        <Toggle
          label="Has garage / parking"
          value={f.hasGarage}
          onChange={(v) => onChange({ ...f, hasGarage: v })}
        />
        <Toggle
          label="Has elevator"
          value={f.hasElevator}
          onChange={(v) => onChange({ ...f, hasElevator: v })}
        />
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Country
        </p>
        <input
          type="text"
          value={f.country}
          onChange={(e) => onChange({ ...f, country: e.target.value })}
          placeholder="Any country"
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
        />
      </div>
    </div>
  );
}

/* ─── Service filters panel ─── */
function ServicePanel({
  f,
  onChange,
}: {
  f: ServiceFilters;
  onChange: (f: ServiceFilters) => void;
}) {
  const l2Options = f.categoryL1
    .flatMap((c) => SERVICE_L2_MAP[c] ?? [])
    .filter((v, i, arr) => arr.indexOf(v) === i);

  return (
    <div className="space-y-4 rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-700/50 dark:bg-zinc-800/30">
      <FilterGroup label="Service category">
        <Pills
          options={SERVICE_L1_CATEGORIES.map((c) => ({ key: c.value, label: c.emoji + " " + c.value }))}
          selected={f.categoryL1}
          onToggle={(v) => onChange({ ...f, categoryL1: toggleArr(f.categoryL1, v), categoryL2: [] })}
        />
      </FilterGroup>

      {l2Options.length > 0 && (
        <FilterGroup label="Subcategory">
          <StringPills
            options={l2Options}
            selected={f.categoryL2}
            onToggle={(v) => onChange({ ...f, categoryL2: toggleArr(f.categoryL2, v) })}
          />
        </FilterGroup>
      )}

      <Divider />

      <FilterGroup label="Modality">
        <StringPills
          options={SERVICE_MODALITIES}
          selected={f.modality}
          onToggle={(v) => onChange({ ...f, modality: toggleArr(f.modality, v) })}
        />
      </FilterGroup>

      <FilterGroup label="Experience level">
        <StringPills
          options={EXPERIENCE_LEVELS}
          selected={f.experienceLevel}
          onToggle={(v) =>
            onChange({ ...f, experienceLevel: toggleArr(f.experienceLevel, v) })
          }
        />
      </FilterGroup>

      <Divider />

      <FilterGroup label="Swap for">
        <Pills
          options={SWAP_FOR_TYPES}
          selected={f.swapFor}
          onToggle={(v) => onChange({ ...f, swapFor: toggleArr(f.swapFor, v) })}
        />
      </FilterGroup>

      <FilterGroup label="Value match">
        <Pills
          options={SWAP_VALUE_MATCH}
          selected={f.valueMatch ? [f.valueMatch] : []}
          onToggle={(v) => onChange({ ...f, valueMatch: toggleOne(f.valueMatch, v) })}
        />
      </FilterGroup>

      <FilterGroup label="Geo preference">
        <StringPills
          options={GEO_PREFS}
          selected={f.geoPreference ? [f.geoPreference] : []}
          onToggle={(v) => onChange({ ...f, geoPreference: toggleOne(f.geoPreference, v) })}
        />
      </FilterGroup>
    </div>
  );
}

/* ─── Event filters panel ─── */
function EventPanel({
  f,
  onChange,
}: {
  f: EventFilters;
  onChange: (f: EventFilters) => void;
}) {
  const l2Options = f.eventTypeL1
    .flatMap((c) => EVENT_L2_MAP[c] ?? [])
    .filter((v, i, arr) => arr.indexOf(v) === i);

  return (
    <div className="space-y-4 rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-700/50 dark:bg-zinc-800/30">
      <FilterGroup label="Event type">
        <Pills
          options={EVENT_L1_CATEGORIES.map((c) => ({ key: c.value, label: c.emoji + " " + c.value }))}
          selected={f.eventTypeL1}
          onToggle={(v) =>
            onChange({ ...f, eventTypeL1: toggleArr(f.eventTypeL1, v), eventTypeL2: [] })
          }
        />
      </FilterGroup>

      {l2Options.length > 0 && (
        <FilterGroup label="Sub-type">
          <StringPills
            options={l2Options}
            selected={f.eventTypeL2}
            onToggle={(v) => onChange({ ...f, eventTypeL2: toggleArr(f.eventTypeL2, v) })}
          />
        </FilterGroup>
      )}

      <Divider />

      <Toggle
        label="Online event"
        value={f.isOnline}
        onChange={(v) => onChange({ ...f, isOnline: v })}
      />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            From date
          </p>
          <input
            type="date"
            value={f.startDateFrom}
            onChange={(e) => onChange({ ...f, startDateFrom: e.target.value })}
            className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            To date
          </p>
          <input
            type="date"
            value={f.startDateTo}
            onChange={(e) => onChange({ ...f, startDateTo: e.target.value })}
            className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Country
        </p>
        <input
          type="text"
          value={f.country}
          onChange={(e) => onChange({ ...f, country: e.target.value })}
          placeholder="Any country"
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
        />
      </div>

      <Divider />

      <FilterGroup label="Swap for">
        <Pills
          options={SWAP_FOR_TYPES}
          selected={f.swapFor}
          onToggle={(v) => onChange({ ...f, swapFor: toggleArr(f.swapFor, v) })}
        />
      </FilterGroup>

      <FilterGroup label="Value match">
        <Pills
          options={SWAP_VALUE_MATCH}
          selected={f.valueMatch ? [f.valueMatch] : []}
          onToggle={(v) => onChange({ ...f, valueMatch: toggleOne(f.valueMatch, v) })}
        />
      </FilterGroup>
    </div>
  );
}

/* ─── Category pill row ─── */
const TOP_CATEGORIES = [
  { key: "objects", label: "Objects", emoji: "📦" },
  { key: "properties", label: "Properties", emoji: "🏠" },
  { key: "services", label: "Services", emoji: "🛠️" },
  { key: "events", label: "Events", emoji: "🎫" },
];

const GEOGRAPHY_OPTIONS = [
  { key: "nearby", label: "Nearby" },
  { key: "country", label: "Country" },
  { key: "world", label: "Worldwide" },
  { key: "travel", label: "Travel" },
  { key: "online", label: "Online" },
];

const FULFILMENT_OPTIONS = [
  { key: "in_person", label: "In person" },
  { key: "transport", label: "Courier / transport" },
  { key: "digital", label: "Digital / online" },
  { key: "hybrid", label: "Hybrid" },
];

function CategorySelector({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (key: string) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {TOP_CATEGORIES.map((cat) => {
        const active = selected.includes(cat.key);
        return (
          <button
            key={cat.key}
            type="button"
            onClick={() => onToggle(cat.key)}
            className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-center transition ${
              active
                ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30"
                : "border-zinc-200 bg-white hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-400"
            }`}
          >
            <span className="text-lg">{cat.emoji}</span>
            <span
              className={`text-xs font-medium leading-tight ${
                active
                  ? "text-blue-700 dark:text-blue-300"
                  : "text-zinc-700 dark:text-zinc-200"
              }`}
            >
              {cat.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Catalog sector (Wants / Offers) ─── */
function CatalogSector({
  title,
  subtitle,
  accentColor,
  filters,
  onChange,
}: {
  title: string;
  subtitle: string;
  accentColor: string;
  filters: CatalogFilter;
  onChange: (f: CatalogFilter) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const ta = useTranslations("explore.architecture");

  const toggleCat = (key: string) => {
    const next = filters.selectedCategories.includes(key)
      ? filters.selectedCategories.filter((c) => c !== key)
      : [...filters.selectedCategories, key];
    onChange({ ...filters, selectedCategories: next });
  };

  const hasObjects = filters.selectedCategories.includes("objects");
  const hasProperties = filters.selectedCategories.includes("properties");
  const hasServices = filters.selectedCategories.includes("services");
  const hasEvents = filters.selectedCategories.includes("events");

  return (
    <div>
      {/* Sector header */}
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center justify-between py-3"
      >
        <div>
          <span className={`text-sm font-bold ${accentColor}`}>{title}</span>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        </div>
        {collapsed ? (
          <ChevronDown className="h-4 w-4 text-zinc-400" />
        ) : (
          <ChevronUp className="h-4 w-4 text-zinc-400" />
        )}
      </button>

      {!collapsed && (
        <div className="space-y-4 pb-2">
          <CategorySelector
            selected={filters.selectedCategories}
            onToggle={toggleCat}
          />

          <FilterGroup label={ta("geographyTitle")}>
            <Pills
              options={GEOGRAPHY_OPTIONS.map((option) => ({
                ...option,
                label: ta(`reach${option.key[0].toUpperCase()}${option.key.slice(1)}`),
              }))}
              selected={filters.geography}
              onToggle={(value) => onChange({ ...filters, geography: toggleArr(filters.geography, value) })}
            />
          </FilterGroup>

          <FilterGroup label={ta("fulfilmentTitle")}>
            <Pills
              options={FULFILMENT_OPTIONS.map((option) => ({
                ...option,
                label: ta(`fulfilment${option.key.split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join("")}`),
              }))}
              selected={filters.fulfilment}
              onToggle={(value) => onChange({ ...filters, fulfilment: toggleArr(filters.fulfilment, value) })}
            />
          </FilterGroup>

          {hasObjects && (
            <ObjectPanel
              f={filters.objects}
              onChange={(obj) => onChange({ ...filters, objects: obj })}
            />
          )}

          {hasProperties && (
            <PropertyPanel
              f={filters.properties}
              onChange={(prop) => onChange({ ...filters, properties: prop })}
            />
          )}

          {hasServices && (
            <ServicePanel
              f={filters.services}
              onChange={(svc) => onChange({ ...filters, services: svc })}
            />
          )}

          {hasEvents && (
            <EventPanel
              f={filters.events}
              onChange={(evt) => onChange({ ...filters, events: evt })}
            />
          )}

          <RangeField
            label="Distance"
            value={filters.distance}
            min={5}
            max={500}
            step={5}
            unit=" km"
            onChange={(v) => onChange({ ...filters, distance: v })}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Profile sector ─── */
function ProfileSector({
  filters,
  onChange,
}: {
  filters: ProfileFilter;
  onChange: (f: ProfileFilter) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const t = useTranslations("explore.filterDrawer");

  const USER_TYPES: Array<{ key: ProfileFilter["userType"]; label: string }> = [
    { key: "individual", label: t("profileUserTypeIndividual") },
    { key: "business", label: t("profileUserTypeBusiness") },
    { key: "both", label: t("profileUserTypeBoth") },
  ];

  return (
    <div>
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center justify-between py-3"
      >
        <div>
          <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">
            {t("profileTitle")}
          </span>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t("profileSubtitle")}
          </p>
        </div>
        {collapsed ? (
          <ChevronDown className="h-4 w-4 text-zinc-400" />
        ) : (
          <ChevronUp className="h-4 w-4 text-zinc-400" />
        )}
      </button>

      {!collapsed && (
        <div className="space-y-4 pb-2">
          <RangeField
            label={t("distance")}
            value={filters.distance}
            min={5}
            max={500}
            step={5}
            unit=" km"
            onChange={(v) => onChange({ ...filters, distance: v })}
          />

          <FilterGroup label={t("profileUserTypeTitle")}>
            <div className="flex flex-wrap gap-1.5">
              {USER_TYPES.map((ut) => (
                <button
                  key={ut.key}
                  type="button"
                  onClick={() => onChange({ ...filters, userType: ut.key })}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                    filters.userType === ut.key
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  }`}
                >
                  {ut.label}
                </button>
              ))}
            </div>
          </FilterGroup>

          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800/50">
            <span className="text-sm text-zinc-700 dark:text-zinc-200">
              {t("profileVerifiedOnly")}
            </span>
            <input
              type="checkbox"
              checked={filters.verifiedOnly}
              onChange={(e) => onChange({ ...filters, verifiedOnly: e.target.checked })}
              className="h-4 w-4 accent-blue-600"
            />
          </label>

          <FilterGroup label={t("profileMinRating")}>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() =>
                    onChange({ ...filters, minRating: filters.minRating === n ? 0 : n })
                  }
                  className="rounded-md p-1 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
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
          </FilterGroup>

          <FilterGroup label={t("profileBadgeTier")}>
            <Pills
              options={BADGE_TIERS}
              selected={filters.badgeTier}
              onToggle={(v) =>
                onChange({ ...filters, badgeTier: toggleArr(filters.badgeTier, v) })
              }
            />
          </FilterGroup>

          <FilterGroup label={t("profileLanguages")}>
            <StringPills
              options={TOP_LANGUAGES}
              selected={filters.languages}
              onToggle={(v) =>
                onChange({ ...filters, languages: toggleArr(filters.languages, v) })
              }
            />
          </FilterGroup>
        </div>
      )}
    </div>
  );
}

/* ─── Main DrawerExplore component ─── */
export default function DrawerExplore() {
  const t = useTranslations("explore.filterDrawer");
  const close = useDrawerStore((s) => s.close);

  const [wantsFilters, setWantsFilters] = useState<CatalogFilter>(defaultCatalog);
  const [offersFilters, setOffersFilters] = useState<CatalogFilter>(defaultCatalog);
  const [profileFilters, setProfileFilters] = useState<ProfileFilter>(defaultProfile);

  const handleReset = () => {
    setWantsFilters(defaultCatalog());
    setOffersFilters(defaultCatalog());
    setProfileFilters(defaultProfile());
  };

  const handleApply = () => {
    const filters: ExploreFilters = { wantsFilters, offersFilters, profileFilters };
    window.dispatchEvent(new CustomEvent(EXPLORE_APPLY_EVENT, { detail: filters }));
    close();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-4 dark:border-zinc-700">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{t("title")}</h2>
        <button
          type="button"
          onClick={close}
          className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label={t("close")}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Scrollable body — 3 sectors */}
      <div className="flex-1 overflow-y-auto">
        {/* Sector 1 — What you want */}
        <div className="border-b-4 border-blue-100 px-4 dark:border-zinc-700">
          <CatalogSector
            title={t("wantsTitle")}
            subtitle={t("wantsSubtitle")}
            accentColor="text-blue-700 dark:text-blue-400"
            filters={wantsFilters}
            onChange={setWantsFilters}
          />
        </div>

        {/* Sector 2 — What you offer */}
        <div className="border-b-4 border-emerald-100 px-4 dark:border-zinc-700">
          <CatalogSector
            title={t("offersTitle")}
            subtitle={t("offersSubtitle")}
            accentColor="text-emerald-700 dark:text-emerald-400"
            filters={offersFilters}
            onChange={setOffersFilters}
          />
        </div>

        {/* Sector 3 — Partner profile */}
        <div className="px-4">
          <ProfileSector filters={profileFilters} onChange={setProfileFilters} />
        </div>

        <div className="h-4" />
      </div>

      {/* Footer — fixed at bottom */}
      <div className="flex shrink-0 gap-3 border-t border-zinc-200 bg-white px-4 py-4 dark:border-zinc-700 dark:bg-zinc-900">
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
    </div>
  );
}
