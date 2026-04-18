"use client";

import { useTranslations } from "next-intl";
import { TypeSelector } from "@/components/explore/filters/shared/TypeSelector";
import { ObjectFilters } from "@/components/explore/filters/offer/ObjectFilters";
import { PropertyFilters } from "@/components/explore/filters/offer/PropertyFilters";
import { ServiceFilters } from "@/components/explore/filters/offer/ServiceFilters";
import { EventFilters } from "@/components/explore/filters/offer/EventFilters";
import type {
  ItemKind,
  OfferFilters,
} from "@/lib/explore/exploreFilterTypes";

interface Props {
  filters: OfferFilters;
  onChange: (updates: Partial<OfferFilters>) => void;
}

export function OfferTab({ filters, onChange }: Props) {
  const t = useTranslations("exploreDrawer");

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("offerTypeLabel")}
        </label>
        <TypeSelector<ItemKind>
          value={filters.type}
          onChange={(v) =>
            onChange({
              type: v,
              // Reset type-specific fields when type changes
              category_l1: null,
              category_l2: null,
              condition: null,
              property_type: null,
              proximity: [],
              bedrooms: null,
              bathrooms: null,
              area_min: null,
              area_max: null,
              amenities: [],
              service_modality: null,
              service_days: [],
              certifications: [],
              event_online: false,
              capacity_bucket: null,
              includes: [],
            })
          }
        />
      </div>

      {filters.type === "object" && <ObjectFilters filters={filters} onChange={onChange} />}
      {filters.type === "property" && <PropertyFilters filters={filters} onChange={onChange} />}
      {filters.type === "service" && <ServiceFilters filters={filters} onChange={onChange} />}
      {filters.type === "event" && <EventFilters filters={filters} onChange={onChange} />}

      {filters.type === null && (
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 py-8">
          {t("offerSelectTypeHint")}
        </p>
      )}
    </div>
  );
}
