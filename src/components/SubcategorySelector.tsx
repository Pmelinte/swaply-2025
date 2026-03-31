"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { AlertTriangle, Info } from "lucide-react";

export interface Subcategory {
  slug: string;
  name_ro: string;
  name_en: string;
  icon: string;
  sort_order: number;
  requires_disclaimer: boolean;
  disclaimer_key: string | null;
  extra_fields: Record<string, unknown>;
}

interface SubcategorySelectorProps {
  /** Category slug (e.g. "electronics") */
  categorySlug: string;
  /** Currently selected subcategory slug */
  value: string;
  /** Called when user selects a subcategory */
  onChange: (slug: string) => void;
  /** Called when extra fields change (vehicles, experiences) */
  onExtraFieldsChange?: (fields: Record<string, string>) => void;
}

/** Map category names to slugs for the API */
const CATEGORY_SLUG_MAP: Record<string, string> = {
  "Electronică": "electronics",
  "Sport & Outdoor": "sport",
  "Modă & Accesorii": "fashion",
  "Cărți & Media": "books",
  "Casă & Grădină": "home",
  "Hobby & Jocuri": "art",
  "Vehicule": "vehicles",
  "Experiențe": "experiences",
  "Medical": "medical",
  "Auto": "auto",
  "Muzică": "music",
  "Jucării": "toys",
  "Grădină": "garden",
  "Unelte": "tools",
  "Servicii": "services",
  "Proprietăți": "properties",
  // English fallbacks (skip duplicates: Medical, Auto already above)
  Electronics: "electronics",
  Sport: "sport",
  Fashion: "fashion",
  Books: "books",
  Home: "home",
  Art: "art",
  Vehicles: "vehicles",
  Experiences: "experiences",
  Music: "music",
  Toys: "toys",
  Garden: "garden",
  Tools: "tools",
  Services: "services",
  Properties: "properties",
};

export function getCategorySlug(categoryName: string): string {
  return CATEGORY_SLUG_MAP[categoryName] ?? categoryName.toLowerCase().replace(/\s+/g, "-");
}

export function SubcategorySelector({
  categorySlug,
  value,
  onChange,
  onExtraFieldsChange,
}: SubcategorySelectorProps) {
  const t = useTranslations("subcategories");
  const locale = useLocale();
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [extraValues, setExtraValues] = useState<Record<string, string>>({});

  const slug = getCategorySlug(categorySlug);

  useEffect(() => {
    if (!slug) return;

    fetch(`/api/subcategories?category=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.subcategories) setSubcategories(data.subcategories);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const selected = subcategories.find((s) => s.slug === value);
  const extraFields = (selected?.extra_fields ?? {}) as Record<string, unknown>;
  const hasExtraFields = !!(selected && Object.keys(extraFields).length > 0);
  const isExperience = slug === "experiences";
  const inputCls = "rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800";

  const handleExtraChange = (key: string, val: string) => {
    const updated = { ...extraValues, [key]: val };
    setExtraValues(updated);
    onExtraFieldsChange?.(updated);
  };

  if (loading || subcategories.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Subcategory grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {subcategories.map((sub) => {
          const isSelected = value === sub.slug;
          const label = locale === "ro" ? sub.name_ro : sub.name_en;
          return (
            <button
              key={sub.slug}
              type="button"
              onClick={() => onChange(sub.slug)}
              className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-sm transition ${
                isSelected
                  ? "border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-950/30 dark:text-blue-300"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              <span className="text-lg">{sub.icon}</span>
              <span className="truncate font-medium">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Medical disclaimer */}
      {selected && selected.requires_disclaimer ? (
        <div className="flex gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{t("medicalDisclaimer")}</p>
        </div>
      ) : null}

      {/* Extra fields for vehicles */}
      {hasExtraFields && !!extraFields.make && (
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            type="text"
            placeholder={t("fieldMake")}
            value={extraValues.make ?? ""}
            onChange={(e) => handleExtraChange("make", e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
          <input
            type="text"
            placeholder={t("fieldModel")}
            value={extraValues.model ?? ""}
            onChange={(e) => handleExtraChange("model", e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
          <input
            type="number"
            placeholder={t("fieldYear")}
            value={extraValues.year ?? ""}
            onChange={(e) => handleExtraChange("year", e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
          <input
            type="number"
            placeholder={t("fieldMileage")}
            value={extraValues.mileage ?? ""}
            onChange={(e) => handleExtraChange("mileage", e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
          <select
            value={extraValues.transmission ?? ""}
            onChange={(e) => handleExtraChange("transmission", e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            <option value="">{t("fieldTransmission")}</option>
            <option value="manual">{t("transmissionManual")}</option>
            <option value="automatic">{t("transmissionAutomatic")}</option>
            <option value="semi-auto">{t("transmissionSemiAuto")}</option>
          </select>
          <select
            value={extraValues.fuel ?? ""}
            onChange={(e) => handleExtraChange("fuel", e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            <option value="">{t("fieldFuel")}</option>
            <option value="petrol">{t("fuelPetrol")}</option>
            <option value="diesel">{t("fuelDiesel")}</option>
            <option value="electric">{t("fuelElectric")}</option>
            <option value="hybrid">{t("fuelHybrid")}</option>
          </select>
        </div>
      )}

      {/* Experience disclaimer — shown for ALL experience subcategories */}
      {isExperience ? (
        <div className="flex gap-2 rounded-xl border border-blue-300 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-700 dark:bg-blue-950/30 dark:text-blue-200">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{t("experienceDisclaimer")}</p>
        </div>
      ) : null}

      {/* ── Flights fields ── */}
      {isExperience && value === "flights" ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <input type="text" placeholder={t("fieldFrom")} value={extraValues.from ?? ""} onChange={(e) => handleExtraChange("from", e.target.value)} className={inputCls} />
          <input type="text" placeholder={t("fieldTo")} value={extraValues.to ?? ""} onChange={(e) => handleExtraChange("to", e.target.value)} className={inputCls} />
          <input type="date" placeholder={t("fieldFlightDate")} value={extraValues.date ?? ""} onChange={(e) => handleExtraChange("date", e.target.value)} className={inputCls} />
          <input type="text" placeholder={t("fieldAirline")} value={extraValues.airline ?? ""} onChange={(e) => handleExtraChange("airline", e.target.value)} className={inputCls} />
          <input type="text" placeholder={t("fieldFlightNumber")} value={extraValues.flightNumber ?? ""} onChange={(e) => handleExtraChange("flightNumber", e.target.value)} className={inputCls} />
          <select value={extraValues.flightClass ?? ""} onChange={(e) => handleExtraChange("flightClass", e.target.value)} className={inputCls}>
            <option value="">{t("fieldFlightClass")}</option>
            <option value="economy">{t("classEconomy")}</option>
            <option value="business">{t("classBusiness")}</option>
            <option value="first">{t("classFirst")}</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input type="checkbox" checked={extraValues.transferable === "true"} onChange={(e) => handleExtraChange("transferable", String(e.target.checked))} className="rounded" />
            {t("fieldTransferable")}
          </label>
          <input type="number" placeholder={t("fieldEstimatedValue")} value={extraValues.estimatedValue ?? ""} onChange={(e) => handleExtraChange("estimatedValue", e.target.value)} className={inputCls} />
        </div>
      ) : null}

      {/* ── Accommodation fields ── */}
      {isExperience && value === "accommodation" ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <input type="text" placeholder={t("fieldLocation")} value={extraValues.location ?? ""} onChange={(e) => handleExtraChange("location", e.target.value)} className={inputCls} />
          <input type="date" placeholder={t("fieldCheckin")} value={extraValues.checkin ?? ""} onChange={(e) => handleExtraChange("checkin", e.target.value)} className={inputCls} />
          <input type="date" placeholder={t("fieldCheckout")} value={extraValues.checkout ?? ""} onChange={(e) => handleExtraChange("checkout", e.target.value)} className={inputCls} />
          {extraValues.checkin && extraValues.checkout ? (
            <p className="flex items-center text-xs text-zinc-500">
              {Math.max(0, Math.ceil((new Date(extraValues.checkout).getTime() - new Date(extraValues.checkin).getTime()) / 86400000))} {t("nights")}
            </p>
          ) : null}
          <select value={extraValues.platform ?? ""} onChange={(e) => handleExtraChange("platform", e.target.value)} className={inputCls}>
            <option value="">{t("fieldPlatform")}</option>
            <option value="airbnb">Airbnb</option>
            <option value="booking">Booking.com</option>
            <option value="direct">{t("platformDirect")}</option>
            <option value="other">{t("platformOther")}</option>
          </select>
          <select value={extraValues.accommodationType ?? ""} onChange={(e) => handleExtraChange("accommodationType", e.target.value)} className={inputCls}>
            <option value="">{t("fieldAccommodationType")}</option>
            <option value="room">{t("typeRoom")}</option>
            <option value="apartment">{t("typeApartment")}</option>
            <option value="villa">{t("typeVilla")}</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input type="checkbox" checked={extraValues.transferable === "true"} onChange={(e) => handleExtraChange("transferable", String(e.target.checked))} className="rounded" />
            {t("fieldTransferable")}
          </label>
        </div>
      ) : null}

      {/* ── Events / Concerts fields ── */}
      {isExperience && (value === "events-concerts" || value === "sports-events") ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <input type="text" placeholder={t("fieldEventName")} value={extraValues.eventName ?? ""} onChange={(e) => handleExtraChange("eventName", e.target.value)} className={inputCls} />
          <input type="text" placeholder={t("fieldVenue")} value={extraValues.venue ?? ""} onChange={(e) => handleExtraChange("venue", e.target.value)} className={inputCls} />
          <input type="date" placeholder={t("fieldEventDate")} value={extraValues.eventDate ?? ""} onChange={(e) => handleExtraChange("eventDate", e.target.value)} className={inputCls} />
          <input type="number" min="1" placeholder={t("fieldTicketCount")} value={extraValues.ticketCount ?? ""} onChange={(e) => handleExtraChange("ticketCount", e.target.value)} className={inputCls} />
          <input type="text" placeholder={t("fieldSector")} value={extraValues.sector ?? ""} onChange={(e) => handleExtraChange("sector", e.target.value)} className={inputCls} />
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input type="checkbox" checked={extraValues.transferable === "true"} onChange={(e) => handleExtraChange("transferable", String(e.target.checked))} className="rounded" />
            {t("fieldTransferable")}
          </label>
        </div>
      ) : null}

      {/* ── Generic extra fields (non-experience, non-vehicle) ── */}
      {hasExtraFields && !isExperience && !extraFields.make && !!extraFields.from ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <input type="text" placeholder={t("fieldFrom")} value={extraValues.from ?? ""} onChange={(e) => handleExtraChange("from", e.target.value)} className={inputCls} />
          <input type="text" placeholder={t("fieldTo")} value={extraValues.to ?? ""} onChange={(e) => handleExtraChange("to", e.target.value)} className={inputCls} />
        </div>
      ) : null}
    </div>
  );
}
