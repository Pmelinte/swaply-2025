"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { AlertTriangle } from "lucide-react";

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

    fetch(`/api/subcategories?category=${slug}`)
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

      {/* Extra fields for experiences (flights) */}
      {hasExtraFields && !!extraFields.from && (
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            type="text"
            placeholder={t("fieldFrom")}
            value={extraValues.from ?? ""}
            onChange={(e) => handleExtraChange("from", e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
          <input
            type="text"
            placeholder={t("fieldTo")}
            value={extraValues.to ?? ""}
            onChange={(e) => handleExtraChange("to", e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
          <input
            type="date"
            placeholder={t("fieldDate")}
            value={extraValues.date ?? ""}
            onChange={(e) => handleExtraChange("date", e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={extraValues.transferable === "true"}
              onChange={(e) => handleExtraChange("transferable", String(e.target.checked))}
              className="rounded"
            />
            {t("fieldTransferable")}
          </label>
        </div>
      )}

      {/* Extra fields for experiences (accommodation) */}
      {hasExtraFields && !!extraFields.checkin && (
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            type="text"
            placeholder={t("fieldLocation")}
            value={extraValues.location ?? ""}
            onChange={(e) => handleExtraChange("location", e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
          <input
            type="text"
            placeholder={t("fieldPlatform")}
            value={extraValues.platform ?? ""}
            onChange={(e) => handleExtraChange("platform", e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
          <input
            type="date"
            placeholder={t("fieldCheckin")}
            value={extraValues.checkin ?? ""}
            onChange={(e) => handleExtraChange("checkin", e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
          <input
            type="date"
            placeholder={t("fieldCheckout")}
            value={extraValues.checkout ?? ""}
            onChange={(e) => handleExtraChange("checkout", e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
      )}
    </div>
  );
}
