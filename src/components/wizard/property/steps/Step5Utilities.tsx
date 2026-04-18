"use client";

import { useTranslations } from "next-intl";
import type { PropertyFormData } from "@/lib/wizard/propertyWizardStore";

interface Props {
  form: PropertyFormData;
  updateForm: (updates: Partial<PropertyFormData>) => void;
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

function ToggleChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
        selected
          ? "bg-blue-600 text-white"
          : "border border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-blue-400"
      }`}
    >
      {label}
    </button>
  );
}

function toggleMulti(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

const HEATING_TYPES = [
  { key: "step5HeatingCentralGas", value: "Central Gas" },
  { key: "step5HeatingElectric", value: "Electric" },
  { key: "step5HeatingWood", value: "Wood/Fireplace" },
  { key: "step5HeatingPellet", value: "Pellet" },
  { key: "step5HeatingGeothermal", value: "Geothermal" },
  { key: "step5HeatingRadiant", value: "Radiant Floor" },
  { key: "step5HeatingNone", value: "None" },
];

const COOLING_TYPES = [
  { key: "step5CoolingSplitAc", value: "Split AC" },
  { key: "step5CoolingCentralAc", value: "Central AC" },
  { key: "step5CoolingFan", value: "Ceiling Fan" },
  { key: "step5CoolingNone", value: "None" },
];

const WATER_SOURCES = [
  { key: "step5WaterMunicipal", value: "Municipal" },
  { key: "step5WaterWell", value: "Well" },
  { key: "step5WaterBoth", value: "Both" },
];

const HOT_WATER_SYSTEMS = [
  { key: "step5HotWaterGasBoiler", value: "Gas Boiler" },
  { key: "step5HotWaterElectric", value: "Electric Boiler" },
  { key: "step5HotWaterHeatPump", value: "Heat Pump" },
  { key: "step5HotWaterSolar", value: "Solar" },
  { key: "step5HotWaterCombi", value: "Instant/Combi" },
];

const ELECTRICITY_SOURCES = [
  { key: "step5ElectricityGrid", value: "Grid" },
  { key: "step5ElectricitySolar", value: "Solar" },
  { key: "step5ElectricityGenerator", value: "Generator" },
  { key: "step5ElectricityMixed", value: "Mixed" },
];

const INTERNET_TYPES = [
  { key: "step5InternetFiber", value: "Fiber" },
  { key: "step5InternetCable", value: "Cable" },
  { key: "step5InternetDsl", value: "DSL" },
  { key: "step5Internet4g", value: "4G/5G" },
  { key: "step5InternetSatellite", value: "Satellite" },
  { key: "step5InternetNone", value: "None" },
];

const ECO_CERTIFICATIONS = [
  "Energy Class A", "Energy Class B", "Energy Class C",
  "Solar Powered", "Rain Water Collection", "Green Roof", "Passive House",
];

export function Step5Utilities({ form, updateForm }: Props) {
  const t = useTranslations("propertyWizard");

  return (
    <div className="space-y-8">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("step5Subtitle")}</p>

      {/* Heating */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          {t("step5HeatingLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {HEATING_TYPES.map((ht) => (
            <ToggleChip
              key={ht.value}
              label={t(ht.key)}
              selected={form.heating_type.includes(ht.value)}
              onClick={() =>
                updateForm({ heating_type: toggleMulti(form.heating_type, ht.value) })
              }
            />
          ))}
        </div>
      </div>

      {/* Cooling */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          {t("step5CoolingLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {COOLING_TYPES.map((ct) => (
            <ToggleChip
              key={ct.value}
              label={t(ct.key)}
              selected={form.cooling_type.includes(ct.value)}
              onClick={() =>
                updateForm({ cooling_type: toggleMulti(form.cooling_type, ct.value) })
              }
            />
          ))}
        </div>
      </div>

      {/* Water Source */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          {t("step5WaterSourceLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {WATER_SOURCES.map((ws) => (
            <ToggleChip
              key={ws.value}
              label={t(ws.key)}
              selected={form.water_source === ws.value}
              onClick={() => updateForm({ water_source: ws.value })}
            />
          ))}
        </div>
      </div>

      {/* Hot Water System */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          {t("step5HotWaterLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {HOT_WATER_SYSTEMS.map((hw) => (
            <ToggleChip
              key={hw.value}
              label={t(hw.key)}
              selected={form.hot_water_system === hw.value}
              onClick={() => updateForm({ hot_water_system: hw.value })}
            />
          ))}
        </div>
      </div>

      {/* Electricity Source */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          {t("step5ElectricityLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {ELECTRICITY_SOURCES.map((es) => (
            <ToggleChip
              key={es.value}
              label={t(es.key)}
              selected={form.electricity_source.includes(es.value)}
              onClick={() =>
                updateForm({ electricity_source: toggleMulti(form.electricity_source, es.value) })
              }
            />
          ))}
        </div>
      </div>

      {/* Solar Panels */}
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
          <span className="text-sm text-zinc-900 dark:text-zinc-50">
            ☀️ {t("step5SolarPanelsLabel")}
          </span>
          <Toggle
            value={form.solar_panels}
            onChange={(v) => updateForm({ solar_panels: v })}
          />
        </div>
        {form.solar_panels && (
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {t("step5SolarCapacityLabel")}
            </label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={form.solar_capacity_kw}
              onChange={(e) => updateForm({ solar_capacity_kw: e.target.value })}
              placeholder="kW"
              className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        )}
      </div>

      {/* Internet */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
            {t("step5InternetTypeLabel")}
          </label>
          <div className="flex flex-wrap gap-2">
            {INTERNET_TYPES.map((it) => (
              <ToggleChip
                key={it.value}
                label={t(it.key)}
                selected={form.internet_type === it.value}
                onClick={() => updateForm({ internet_type: it.value })}
              />
            ))}
          </div>
        </div>
        {form.internet_type && form.internet_type !== "None" && (
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {t("step5InternetSpeedLabel")}
            </label>
            <input
              type="number"
              min={0}
              value={form.internet_speed_mbps}
              onChange={(e) => updateForm({ internet_speed_mbps: e.target.value })}
              placeholder="Mbps"
              className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        )}
      </div>

      {/* Smart Home */}
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
          <span className="text-sm text-zinc-900 dark:text-zinc-50">
            🏠 {t("step5SmartHomeLabel")}
          </span>
          <Toggle
            value={form.smart_home_features}
            onChange={(v) => updateForm({ smart_home_features: v })}
          />
        </div>
        {form.smart_home_features && (
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {t("step5SmartHomeDetailsLabel")}
            </label>
            <textarea
              value={form.smart_home_details}
              onChange={(e) => updateForm({ smart_home_details: e.target.value })}
              placeholder="e.g., Smart thermostat, app-controlled lights..."
              rows={2}
              className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        )}
      </div>

      {/* Eco Certifications */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          {t("step5EcoCertificationsLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {ECO_CERTIFICATIONS.map((cert) => (
            <ToggleChip
              key={cert}
              label={cert}
              selected={form.eco_certifications.includes(cert)}
              onClick={() =>
                updateForm({
                  eco_certifications: toggleMulti(form.eco_certifications, cert),
                })
              }
            />
          ))}
        </div>
      </div>

      {/* Backup Generator & Septic Tank */}
      <div className="space-y-2">
        {[
          { key: "step5BackupGeneratorLabel", field: "backup_generator" as const, emoji: "⚡" },
          { key: "step5SepticTankLabel", field: "septic_tank" as const, emoji: "💧" },
        ].map(({ key, field, emoji }) => (
          <div
            key={field}
            className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800"
          >
            <span className="text-sm text-zinc-900 dark:text-zinc-50">
              {emoji} {t(key)}
            </span>
            <Toggle
              value={form[field] as boolean}
              onChange={(v) => updateForm({ [field]: v })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
