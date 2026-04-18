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

function Stepper({
  value,
  min = 0,
  max = 10,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="h-8 w-8 rounded-full border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center font-bold text-lg leading-none transition"
      >
        −
      </button>
      <span className="min-w-[2rem] text-center text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="h-8 w-8 rounded-full border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center font-bold text-lg leading-none transition"
      >
        +
      </button>
    </div>
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

const EXTERIOR_FEATURES: { key: string; field: keyof PropertyFormData; emoji: string }[] = [
  { emoji: "🏊", key: "step4HasPool", field: "has_swimming_pool" },
  { emoji: "♨️", key: "step4HasHotTub", field: "has_hot_tub" },
  { emoji: "🧖", key: "step4HasSauna", field: "has_sauna" },
  { emoji: "🏋️", key: "step4HasGym", field: "has_gym" },
  { emoji: "🎾", key: "step4HasTennisCourt", field: "has_tennis_court" },
  { emoji: "🛝", key: "step4HasPlayground", field: "has_playground" },
  { emoji: "🔥", key: "step4HasBbqArea", field: "has_bbq_area" },
  { emoji: "🪵", key: "step4OutdoorFireplace", field: "outdoor_fireplace" },
  { emoji: "🍳", key: "step4OutdoorKitchen", field: "outdoor_kitchen" },
  { emoji: "🌿", key: "step4HasGarden", field: "has_garden" },
];

const POOL_TYPES = [
  { key: "step4PoolInGround", value: "InGround" },
  { key: "step4PoolAboveGround", value: "AboveGround" },
  { key: "step4PoolSaltWater", value: "SaltWater" },
  { key: "step4PoolHeated", value: "Heated" },
];

const GARAGE_TYPES = [
  { key: "step4GarageNone", value: "None" },
  { key: "step4GarageOpen", value: "Open" },
  { key: "step4GarageCovered", value: "Covered" },
  { key: "step4GarageEnclosed", value: "Enclosed" },
  { key: "step4GarageUnderground", value: "Underground" },
];

const KITCHEN_APPLIANCES = [
  "Fridge", "Freezer", "Dishwasher", "Oven", "Microwave",
  "Coffee Machine", "Espresso Machine", "Toaster", "Blender", "Mixer",
  "Air Fryer", "Slow Cooker", "Rice Cooker", "Bread Maker", "Kettle",
  "Wine Fridge", "Ice Maker", "Washing Machine", "Dryer", "Ironing Board",
  "Vacuum", "Robot Vacuum", "Air Purifier", "Dehumidifier", "AC Split",
  "Fan", "Portable Heater",
];

const BED_TYPES = [
  { key: "step4BedSingle", value: "Single" },
  { key: "step4BedDouble", value: "Double" },
  { key: "step4BedQueen", value: "Queen" },
  { key: "step4BedKing", value: "King" },
  { key: "step4BedBunk", value: "BunkBed" },
  { key: "step4BedSofa", value: "Sofa Bed" },
  { key: "step4BedCrib", value: "Crib" },
];

const MATTRESS_QUALITIES = [
  { key: "step4MattressBasic", value: "Basic" },
  { key: "step4MattressStandard", value: "Standard" },
  { key: "step4MattressPremium", value: "Premium" },
  { key: "step4MattressLuxury", value: "Luxury" },
];

const FURNISHING_LEVELS = [
  { emoji: "📦", key: "step4FurnishingUnfurnished", value: "Unfurnished" },
  { emoji: "🪑", key: "step4FurnishingPartially", value: "Partially" },
  { emoji: "🛋️", key: "step4FurnishingFully", value: "Fully" },
  { emoji: "💎", key: "step4FurnishingLuxury", value: "Luxury" },
];

export function Step4Amenities({ form, updateForm }: Props) {
  const t = useTranslations("propertyWizard");

  return (
    <div className="space-y-8">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("step4Subtitle")}</p>

      {/* Exterior & Recreation */}
      <section>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3 uppercase tracking-wide">
          {t("step4ExteriorLabel")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {EXTERIOR_FEATURES.map(({ key, field, emoji }) => (
            <div key={field} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
              <span className="flex items-center gap-2 text-sm text-zinc-900 dark:text-zinc-50">
                <span>{emoji}</span> {t(key)}
              </span>
              <Toggle
                value={form[field] as boolean}
                onChange={(v) => updateForm({ [field]: v })}
              />
            </div>
          ))}
        </div>

        {/* Pool type — conditional */}
        {form.has_swimming_pool && (
          <div className="mt-3">
            <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              {t("step4PoolTypeLabel")}
            </label>
            <div className="flex flex-wrap gap-2">
              {POOL_TYPES.map((pt) => (
                <ToggleChip
                  key={pt.value}
                  label={t(pt.key)}
                  selected={form.pool_type === pt.value}
                  onClick={() => updateForm({ pool_type: pt.value })}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Parking */}
      <section>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3 uppercase tracking-wide">
          {t("step4ParkingLabel")}
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm text-zinc-900 dark:text-zinc-50">
              {t("step4ParkingSpacesLabel")}
            </label>
            <Stepper
              value={form.parking_spaces}
              min={0}
              max={10}
              onChange={(v) => updateForm({ parking_spaces: v })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              {t("step4GarageTypeLabel")}
            </label>
            <div className="flex flex-wrap gap-2">
              {GARAGE_TYPES.map((gt) => (
                <ToggleChip
                  key={gt.value}
                  label={t(gt.key)}
                  selected={form.garage_type === gt.value}
                  onClick={() => updateForm({ garage_type: gt.value })}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
            <span className="text-sm text-zinc-900 dark:text-zinc-50">
              ⚡ {t("step4EvCharging")}
            </span>
            <Toggle
              value={form.ev_charging}
              onChange={(v) => updateForm({ ev_charging: v })}
            />
          </div>

          {form.garage_type === "None" && (
            <div>
              <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                {t("step4ParkingDistanceLabel")}
              </label>
              <input
                type="number"
                min={0}
                value={form.parking_distance_m}
                onChange={(e) => updateForm({ parking_distance_m: e.target.value })}
                placeholder="meters"
                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          )}
        </div>
      </section>

      {/* Kitchen Appliances */}
      <section>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3 uppercase tracking-wide">
          {t("step4KitchenLabel")}
        </h3>
        <div className="flex flex-wrap gap-2">
          {KITCHEN_APPLIANCES.map((appliance) => (
            <ToggleChip
              key={appliance}
              label={appliance}
              selected={form.kitchen_appliances.includes(appliance)}
              onClick={() =>
                updateForm({
                  kitchen_appliances: toggleMulti(form.kitchen_appliances, appliance),
                })
              }
            />
          ))}
        </div>
      </section>

      {/* Bedroom & Bedding */}
      <section>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3 uppercase tracking-wide">
          {t("step4BedroomsLabel")}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              {t("step4BedTypesLabel")}
            </label>
            <div className="flex flex-wrap gap-2">
              {BED_TYPES.map((bt) => (
                <ToggleChip
                  key={bt.value}
                  label={t(bt.key)}
                  selected={form.bed_types.includes(bt.value)}
                  onClick={() =>
                    updateForm({ bed_types: toggleMulti(form.bed_types, bt.value) })
                  }
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              {t("step4MattressQualityLabel")}
            </label>
            <div className="flex flex-wrap gap-2">
              {MATTRESS_QUALITIES.map((mq) => (
                <ToggleChip
                  key={mq.value}
                  label={t(mq.key)}
                  selected={form.mattress_quality === mq.value}
                  onClick={() => updateForm({ mattress_quality: mq.value })}
                />
              ))}
            </div>
          </div>

          {[
            { key: "step4LinenProvided", field: "linen_provided" as const },
            { key: "step4TowelsProvided", field: "towels_provided" as const },
            { key: "step4ExtraPillows", field: "extra_pillows" as const },
          ].map(({ key, field }) => (
            <div
              key={field}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800"
            >
              <span className="text-sm text-zinc-900 dark:text-zinc-50">{t(key)}</span>
              <Toggle
                value={form[field] as boolean}
                onChange={(v) => updateForm({ [field]: v })}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Furnishing Level */}
      <section>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3 uppercase tracking-wide">
          {t("step4FurnishingLabel")} *
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {FURNISHING_LEVELS.map((fl) => (
            <button
              key={fl.value}
              type="button"
              onClick={() => updateForm({ furnishing_level: fl.value })}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition ${
                form.furnishing_level === fl.value
                  ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30"
                  : "border-zinc-200 bg-white hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-400"
              }`}
            >
              <span className="text-2xl">{fl.emoji}</span>
              <span className="text-xs font-medium text-zinc-900 dark:text-zinc-50">
                {t(fl.key)}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
