"use client";

import { useTranslations } from "next-intl";
import type { ItemKind, ItemKindOrAny } from "@/lib/explore/exploreFilterTypes";

interface Props<T extends ItemKind | ItemKindOrAny> {
  value: T | null;
  onChange: (v: T | null) => void;
  includeAny?: boolean;
}

const BASE_TYPES = [
  { emoji: "📦", value: "object", key: "typeObject" },
  { emoji: "🏠", value: "property", key: "typeProperty" },
  { emoji: "🛠️", value: "service", key: "typeService" },
  { emoji: "🎫", value: "event", key: "typeEvent" },
] as const;

const ANY_TYPE = { emoji: "🔀", value: "any", key: "typeAny" } as const;

export function TypeSelector<T extends ItemKind | ItemKindOrAny>({
  value,
  onChange,
  includeAny,
}: Props<T>) {
  const t = useTranslations("exploreDrawer");
  const types = includeAny ? [...BASE_TYPES, ANY_TYPE] : BASE_TYPES;
  const cols = includeAny ? "grid-cols-5" : "grid-cols-4";

  return (
    <div className={`grid ${cols} gap-2`}>
      {types.map((tp) => (
        <button
          key={tp.value}
          type="button"
          onClick={() => onChange(value === (tp.value as T) ? null : (tp.value as T))}
          className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition ${
            value === tp.value
              ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30"
              : "border-zinc-200 bg-white hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-400"
          }`}
        >
          <span className="text-xl">{tp.emoji}</span>
          <span className="text-[11px] font-medium text-zinc-900 dark:text-zinc-50">
            {t(tp.key)}
          </span>
        </button>
      ))}
    </div>
  );
}
