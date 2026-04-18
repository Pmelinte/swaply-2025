"use client";

import { useTranslations } from "next-intl";
import type { PropertyFormData } from "@/lib/wizard/propertyWizardStore";

interface Props {
  form: PropertyFormData;
  updateForm: (updates: Partial<PropertyFormData>) => void;
}

function Stepper({
  value,
  min = 0,
  max = 20,
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
      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
        selected
          ? "bg-blue-600 text-white"
          : "border border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-blue-400"
      }`}
    >
      {label}
    </button>
  );
}

const BUILDING_CONDITIONS = [
  { emoji: "✨", key: "step3ConditionExcellent", value: "Excellent" },
  { emoji: "👍", key: "step3ConditionGood", value: "Good" },
  { emoji: "👌", key: "step3ConditionFair", value: "Fair" },
  { emoji: "⚠️", key: "step3ConditionNeedsWork", value: "Needs Work" },
];

const CONSTRUCTION_MATERIALS = [
  { key: "step3MaterialBrick", value: "Brick" },
  { key: "step3MaterialWood", value: "Wood" },
  { key: "step3MaterialStone", value: "Stone" },
  { key: "step3MaterialConcrete", value: "Concrete" },
  { key: "step3MaterialMixed", value: "Mixed" },
  { key: "step3MaterialOther", value: "Other" },
];

function toggleMulti(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function Step3Structure({ form, updateForm }: Props) {
  const t = useTranslations("propertyWizard");

  const showElevator = form.floor_count > 1 || form.property_floor > 0;
  const showPoolArea = form.has_swimming_pool;

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("step3Subtitle")}</p>

      {/* Total Buildings */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {t("step3TotalBuildingsLabel")}
        </label>
        <Stepper
          value={form.total_buildings}
          min={1}
          max={10}
          onChange={(v) => updateForm({ total_buildings: v })}
        />
      </div>

      {/* Building Condition */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          {t("step3BuildingConditionLabel")}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {BUILDING_CONDITIONS.map((bc) => (
            <button
              key={bc.value}
              type="button"
              onClick={() => updateForm({ building_condition: bc.value })}
              className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition ${
                form.building_condition === bc.value
                  ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30"
                  : "border-zinc-200 bg-white hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-400"
              }`}
            >
              <span className="text-xl">{bc.emoji}</span>
              <span className="text-xs font-medium text-zinc-900 dark:text-zinc-50">
                {t(bc.key)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Construction Material */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          {t("step3ConstructionMaterialLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {CONSTRUCTION_MATERIALS.map((mat) => (
            <ToggleChip
              key={mat.value}
              label={t(mat.key)}
              selected={form.construction_material.includes(mat.value)}
              onClick={() =>
                updateForm({
                  construction_material: toggleMulti(form.construction_material, mat.value),
                })
              }
            />
          ))}
        </div>
      </div>

      {/* Floor Count */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {t("step3FloorCountLabel")}
        </label>
        <Stepper
          value={form.floor_count}
          min={0}
          max={50}
          onChange={(v) => updateForm({ floor_count: v })}
        />
      </div>

      {/* Property Floor (for apartments) */}
      {form.property_type === "Apartment" && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {t("step3PropertyFloorLabel")}
          </label>
          <Stepper
            value={form.property_floor}
            min={0}
            max={80}
            onChange={(v) => updateForm({ property_floor: v })}
          />
        </div>
      )}

      {/* Elevator — conditional */}
      {showElevator && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {t("step3HasElevatorLabel")}
          </label>
          <button
            type="button"
            onClick={() => updateForm({ has_elevator: !form.has_elevator })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
              form.has_elevator ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-600"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                form.has_elevator ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      )}

      {/* Room Steppers */}
      <div className="space-y-3">
        {[
          { key: "step3BedroomsLabel", field: "bedrooms" as const, max: 20 },
          { key: "step3BathroomsLabel", field: "bathrooms" as const, max: 10 },
          { key: "step3ToiletsExtraLabel", field: "toilets_extra" as const, max: 10 },
          { key: "step3LivingRoomsLabel", field: "living_rooms" as const, max: 10 },
          { key: "step3KitchenCountLabel", field: "kitchen_count" as const, max: 5 },
          { key: "step3OfficeRoomsLabel", field: "office_rooms" as const, max: 10 },
          { key: "step3StorageRoomsLabel", field: "storage_rooms" as const, max: 10 },
        ].map(({ key, field, max }) => (
          <div key={field} className="flex items-center justify-between">
            <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {t(key)}
            </label>
            <Stepper
              value={form[field]}
              min={0}
              max={max}
              onChange={(v) => updateForm({ [field]: v })}
            />
          </div>
        ))}
      </div>

      {/* Surface Areas */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          Surfaces
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: "step3TotalAreaLabel", field: "total_area_sqm" as const, required: true },
            { key: "step3LivingAreaLabel", field: "living_area_sqm" as const },
            { key: "step3GardenAreaLabel", field: "garden_area_sqm" as const },
            { key: "step3TerraceAreaLabel", field: "terrace_area_sqm" as const },
          ].map(({ key, field, required }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t(key)} {required && "*"}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={form[field]}
                  onChange={(e) => updateForm({ [field]: e.target.value })}
                  placeholder="0"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 pr-12 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                  m²
                </span>
              </div>
            </div>
          ))}

          {showPoolArea && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t("step3PoolAreaLabel")}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={form.pool_area_sqm}
                  onChange={(e) => updateForm({ pool_area_sqm: e.target.value })}
                  placeholder="0"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 pr-12 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                  m²
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
