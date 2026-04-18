"use client";

import { useTranslations } from "next-intl";
import { ValueTierSelector } from "@/components/wizard/shared/ValueTierSelector";
import type { ServiceFormData } from "@/lib/wizard/serviceWizardStore";

interface Props {
  form: ServiceFormData;
  updateForm: (updates: Partial<ServiceFormData>) => void;
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
        value ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-600"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
          value ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function toggleMulti(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

const SWAP_FOR_TYPES = [
  { emoji: "🛠️", key: "swapForService", value: "service" },
  { emoji: "🏠", key: "swapForProperty", value: "property" },
  { emoji: "📦", key: "swapForObject", value: "object" },
  { emoji: "🎫", key: "swapForEvent", value: "event" },
  { emoji: "🌐", key: "swapForAnything", value: "anything" },
];

const VALUE_MATCH = [
  { emoji: "⚖️", key: "valueMatchExact", value: "Exact" },
  { emoji: "~", key: "valueMatchApprox", value: "Approximate" },
  { emoji: "🌊", key: "valueMatchFlexible", value: "Flexible" },
];

const GEO_PREFS = [
  { emoji: "📍", key: "geoLocal", value: "Local" },
  { emoji: "🗺️", key: "geoRegional", value: "Regional" },
  { emoji: "🌍", key: "geoInternational", value: "International" },
  { emoji: "💻", key: "geoRemote", value: "Remote" },
];

export function Step4ExchangeTerms({ form, updateForm }: Props) {
  const t = useTranslations("serviceWizard");
  const tShared = useTranslations("wizardShared");

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("step4Subtitle")}</p>

      {/* Swap for type */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          {t("step4SwapForLabel")} *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {SWAP_FOR_TYPES.map((st) => (
            <button
              key={st.value}
              type="button"
              onClick={() => updateForm({ swap_for_type: toggleMulti(form.swap_for_type, st.value) })}
              className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition ${
                form.swap_for_type.includes(st.value)
                  ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30"
                  : "border-zinc-200 bg-white hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-400"
              }`}
            >
              <span className="text-xl">{st.emoji}</span>
              <span className="text-xs font-medium text-zinc-900 dark:text-zinc-50">{t(st.key)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Swap wants description */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("step4SwapWantsLabel")} *
        </label>
        <textarea
          value={form.swap_wants_description}
          onChange={(e) => updateForm({ swap_wants_description: e.target.value })}
          placeholder={t("step4SwapWantsPlaceholder")}
          rows={3}
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {/* Value match */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          {t("step4ValueMatchLabel")}
        </label>
        <div className="flex gap-2">
          {VALUE_MATCH.map((vm) => (
            <button
              key={vm.value}
              type="button"
              onClick={() => updateForm({ swap_value_match: vm.value })}
              className={`flex-1 flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition ${
                form.swap_value_match === vm.value
                  ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30"
                  : "border-zinc-200 bg-white hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-400"
              }`}
            >
              <span className="text-lg">{vm.emoji}</span>
              <span className="text-xs font-medium text-zinc-900 dark:text-zinc-50">{t(vm.key)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Value tier */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          {tShared("valueTierLabel")} *
        </label>
        <ValueTierSelector
          value={form.perceived_value_tier}
          onChange={(v) => updateForm({ perceived_value_tier: v })}
        />
      </div>

      {/* Escrow accepted */}
      <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
        <span className="text-sm text-zinc-900 dark:text-zinc-50">🔐 {t("step4EscrowLabel")}</span>
        <Toggle value={form.escrow_accepted} onChange={(v) => updateForm({ escrow_accepted: v })} />
      </div>

      {/* Geo preference */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          {t("step4GeoLabel")}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {GEO_PREFS.map((gp) => (
            <button
              key={gp.value}
              type="button"
              onClick={() => updateForm({ swap_geo_preference: gp.value })}
              className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition ${
                form.swap_geo_preference === gp.value
                  ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30"
                  : "border-zinc-200 bg-white hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-400"
              }`}
            >
              <span className="text-xl">{gp.emoji}</span>
              <span className="text-xs font-medium text-zinc-900 dark:text-zinc-50">{t(gp.key)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Geo radius — only if on-site */}
      {(form.service_modality === "On-site" || form.service_modality === "Both") && (
        <div>
          <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
            {t("step4GeoRadiusLabel")}: {form.swap_geo_radius_km} km
          </label>
          <input
            type="range"
            min={0}
            max={500}
            step={10}
            value={form.swap_geo_radius_km}
            onChange={(e) => updateForm({ swap_geo_radius_km: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>
      )}

      {/* Partial swap */}
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
          <span className="text-sm text-zinc-900 dark:text-zinc-50">💸 {t("step4PartialLabel")}</span>
          <Toggle
            value={form.swap_partial_allowed}
            onChange={(v) => updateForm({ swap_partial_allowed: v })}
          />
        </div>
        {form.swap_partial_allowed && (
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {t("step4PartialTopupLabel")}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">€</span>
              <input
                type="number"
                min={0}
                value={form.swap_partial_topup_eur}
                onChange={(e) => updateForm({ swap_partial_topup_eur: e.target.value })}
                placeholder="0"
                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 pl-7 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
