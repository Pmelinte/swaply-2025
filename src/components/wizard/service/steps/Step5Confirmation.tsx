"use client";

import { useTranslations } from "next-intl";
import { CrossCategoryConsent } from "@/components/wizard/shared/CrossCategoryConsent";
import type { ServiceFormData } from "@/lib/wizard/serviceWizardStore";

interface Props {
  form: ServiceFormData;
  updateForm: (updates: Partial<ServiceFormData>) => void;
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

export function Step5Confirmation({ form, updateForm }: Props) {
  const t = useTranslations("serviceWizard");
  const tShared = useTranslations("wizardShared");

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("step5Subtitle")}</p>

      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{t("step5Summary")}</h3>

      <div className="space-y-3">
        <SummarySection title={t("step5SectionType")}>
          <SummaryRow label="Title" value={form.service_title} />
          <SummaryRow
            label="Category"
            value={[form.service_category_l1, form.service_category_l2, form.service_category_l3].filter(Boolean).join(" · ")}
          />
          <SummaryRow label="Modality" value={form.service_modality} />
        </SummarySection>

        <SummarySection title={t("step5SectionExperience")}>
          <SummaryRow label="Experience" value={`${form.experience_years}y · ${form.experience_level}`} />
          <SummaryRow label="Provider" value={form.provider_type} />
          <SummaryRow
            label="Certifications"
            value={form.certifications.length > 0 ? form.certifications.join(", ") : null}
          />
          <SummaryRow
            label="Languages"
            value={form.languages_service.length > 0 ? form.languages_service.join(", ") : null}
          />
        </SummarySection>

        <SummarySection title={t("step5SectionAvailability")}>
          <SummaryRow label="Days" value={form.availability_days.join(", ")} />
          <SummaryRow
            label="Time of Day"
            value={form.availability_time_of_day.length > 0 ? form.availability_time_of_day.join(", ") : null}
          />
          <SummaryRow label="Advance notice" value={`${form.advance_notice_days} days`} />
          <SummaryRow label="Urgent available" value={form.urgent_available ? "Yes" : null} />
        </SummarySection>

        <SummarySection title={t("step5SectionExchange")}>
          <SummaryRow label="Swap for" value={form.swap_for_type.join(", ")} />
          <SummaryRow label="Value tier" value={form.perceived_value_tier} />
          <SummaryRow label="Geo" value={form.swap_geo_preference} />
          <SummaryRow label="Looking for" value={form.swap_wants_description} />
        </SummarySection>
      </div>

      {/* Required confirmations */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900 space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Confirmations</h3>
        <CheckboxRow
          label={t("step5ConfirmAuthorized")}
          checked={form.confirm_authorized}
          onChange={(v) => updateForm({ confirm_authorized: v })}
          required
        />
        <CheckboxRow
          label={t("step5ConfirmAccurate")}
          checked={form.confirm_accurate}
          onChange={(v) => updateForm({ confirm_accurate: v })}
          required
        />
        <CheckboxRow
          label={t("step5ConfirmTerms")}
          checked={form.confirm_terms}
          onChange={(v) => updateForm({ confirm_terms: v })}
          required
        />

        <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
          <CrossCategoryConsent
            crossCategorySwap={form.cross_category_swap}
            chainSwapAllowed={form.chain_swap_allowed}
            onCrossCategoryChange={(v) => updateForm({ cross_category_swap: v })}
            onChainSwapChange={(v) => updateForm({ chain_swap_allowed: v })}
            crossCategoryLabel={tShared("crossCategoryLabel")}
            chainSwapLabel={tShared("chainSwapLabel")}
          />
        </div>
      </div>
    </div>
  );
}
