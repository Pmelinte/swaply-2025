"use client";

import { useTranslations } from "next-intl";
import type { PropertyFormData } from "@/lib/wizard/propertyWizardStore";

interface Props {
  form: PropertyFormData;
  updateForm: (updates: Partial<PropertyFormData>) => void;
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-2 py-1 text-sm">
      <span className="text-zinc-600 dark:text-zinc-400 shrink-0">{label}</span>
      <span className="text-zinc-900 dark:text-zinc-50 text-right">{value}</span>
    </div>
  );
}

function SummarySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
      <h4 className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
        {title}
      </h4>
      {children}
    </div>
  );
}

function CheckboxRow({
  label,
  checked,
  onChange,
  required,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  required?: boolean;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
      />
      <span className="text-sm text-zinc-900 dark:text-zinc-50">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </span>
    </label>
  );
}

export function Step8Confirmation({ form, updateForm }: Props) {
  const t = useTranslations("propertyWizard");

  const amenitiesCount = [
    form.has_swimming_pool, form.has_hot_tub, form.has_sauna, form.has_gym,
    form.has_tennis_court, form.has_playground, form.has_bbq_area,
    form.outdoor_fireplace, form.outdoor_kitchen, form.has_garden,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("step8Subtitle")}</p>

      {/* Vacation Disclaimer */}
      <div className="rounded-xl border border-orange-300 bg-orange-50 p-4 dark:border-orange-700 dark:bg-orange-950/30">
        <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">
          {t("step6Disclaimer")}
        </p>
      </div>

      {/* Summary */}
      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
        {t("step8Summary")}
      </h3>

      <div className="space-y-3">
        <SummarySection title={t("step8SectionType")}>
          <SummaryRow label="Type" value={[form.property_type, form.property_subtype].filter(Boolean).join(" · ")} />
          <SummaryRow label="Category" value={form.property_category} />
          <SummaryRow label="Year Built" value={form.year_built} />
        </SummarySection>

        <SummarySection title={t("step8SectionLocation")}>
          <SummaryRow label="Location" value={[form.city, form.region, form.country].filter(Boolean).join(", ")} />
          <SummaryRow label="Environment" value={form.location_type.join(", ")} />
          {form.lat && form.lon && (
            <SummaryRow label="GPS" value={`${form.lat}, ${form.lon}`} />
          )}
        </SummarySection>

        <SummarySection title={t("step8SectionStructure")}>
          <SummaryRow label="Total Area" value={form.total_area_sqm ? `${form.total_area_sqm} m²` : null} />
          <SummaryRow label="Rooms" value={
            `${form.bedrooms} bed · ${form.bathrooms} bath · ${form.living_rooms} living`
          } />
          <SummaryRow label="Condition" value={form.building_condition} />
          <SummaryRow label="Furnishing" value={form.furnishing_level} />
        </SummarySection>

        <SummarySection title={t("step8SectionAmenities")}>
          <SummaryRow label="Features" value={amenitiesCount > 0 ? `${amenitiesCount} amenities` : "None"} />
          <SummaryRow label="Parking" value={form.parking_spaces > 0 ? `${form.parking_spaces} spaces (${form.garage_type})` : "None"} />
          <SummaryRow label="Appliances" value={form.kitchen_appliances.length > 0 ? `${form.kitchen_appliances.length} items` : null} />
        </SummarySection>

        <SummarySection title={t("step8SectionExchange")}>
          <SummaryRow label="Exchange Type" value={form.exchange_type} />
          <SummaryRow label="Duration" value={form.exchange_duration.join(", ")} />
          <SummaryRow label="Guests" value={`Up to ${form.number_of_guests_allowed}`} />
          <SummaryRow label="Geo Preference" value={form.swap_geo_preference} />
          <SummaryRow label="Looking For" value={form.desired_exchange_description} />
        </SummarySection>

        <SummarySection title={t("step8SectionRules")}>
          <SummaryRow label="Check-in" value={form.check_in_time} />
          <SummaryRow label="Check-out" value={form.check_out_time} />
          <SummaryRow label="Smoking" value={form.smoking_allowed} />
          <SummaryRow label="Pets" value={form.pets_allowed ? (form.pets_types.join(", ") || "Allowed") : "Not allowed"} />
        </SummarySection>
      </div>

      {/* Required Confirmations */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900 space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
          Confirmations
        </h3>
        <CheckboxRow
          label={t("step8ConfirmVacationOnly")}
          checked={form.confirm_vacation_only}
          onChange={(v) => updateForm({ confirm_vacation_only: v })}
          required
        />
        <CheckboxRow
          label={t("step8ConfirmAccurate")}
          checked={form.confirm_accurate_info}
          onChange={(v) => updateForm({ confirm_accurate_info: v })}
          required
        />
        <CheckboxRow
          label={t("step8ConfirmTerms")}
          checked={form.confirm_terms}
          onChange={(v) => updateForm({ confirm_terms: v })}
          required
        />

        <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4 space-y-3">
          <CheckboxRow
            label={t("step8CrossCategorySwap")}
            checked={form.cross_category_swap}
            onChange={(v) => updateForm({ cross_category_swap: v })}
          />
          <CheckboxRow
            label={t("step8ChainSwap")}
            checked={form.chain_swap_allowed}
            onChange={(v) => updateForm({ chain_swap_allowed: v })}
          />
        </div>
      </div>
    </div>
  );
}
