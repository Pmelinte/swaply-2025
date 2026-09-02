import type { Item } from "@/lib/types";
import type { ExploreFilters } from "@/components/drawer/variants/DrawerExplore";
import { getItemFulfilment, getItemReach } from "@/lib/explore/exploreArchitecture";

export type ExploreDomain = "objects" | "properties" | "services" | "events";

export type GlobalExploreItem = Item & {
  domain: ExploreDomain;
  detailPath: string;
  approximateLocation: string;
  searchableText: string;
};

function domainFor(item: Item): ExploreDomain {
  if (item.experienceData || item.listingType === "event") return "events";
  if (item.listingType === "property") return "properties";
  if (item.listingType === "service") return "services";
  return "objects";
}

export function getDomainPath(domain: ExploreDomain, id: string): string {
  const base = domain === "objects" ? "objects" : domain;
  return `/${base}/${id}`;
}

export function getApproximateLocation(location: string | null | undefined): string {
  if (!location) return "Approximate area only";
  const parts = location.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) return parts.slice(-2).join(", ");
  return parts[0] ?? "Approximate area only";
}

export function toGlobalExploreItems(items: Item[]): GlobalExploreItem[] {
  return items
    .filter((item) => item.isActive && item.status === "active")
    .map((item) => {
      const domain = domainFor(item);
      return {
        ...item,
        domain,
        detailPath: getDomainPath(domain, item.id),
        approximateLocation: getApproximateLocation(item.location),
        searchableText: [item.title, item.description, item.category, item.wishlist, item.location, domain]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      };
    });
}

function includesAny(value: string, options: string[]): boolean {
  return options.length === 0 || options.some((option) => value.toLowerCase().includes(option.toLowerCase()));
}

function matchesCatalog(item: GlobalExploreItem, filters: ExploreFilters["wantsFilters"]): boolean {
  if (!includesAny(item.domain, filters.selectedCategories)) return false;
  if (filters.geography.length && !filters.geography.some((value) => getItemReach(item).includes(value as ReturnType<typeof getItemReach>[number]))) return false;
  if (filters.fulfilment.length && !filters.fulfilment.some((value) => getItemFulfilment(item).includes(value as ReturnType<typeof getItemFulfilment>[number]))) return false;
  if (filters.objects.categoryL1.length && item.domain === "objects" && !includesAny(item.category, filters.objects.categoryL1)) return false;
  if (filters.objects.condition.length && item.domain === "objects" && !filters.objects.condition.includes(item.condition)) return false;
  if (filters.properties.country && item.domain === "properties" && !item.searchableText.includes(filters.properties.country.toLowerCase())) return false;
  if (filters.services.categoryL1.length && item.domain === "services" && !includesAny(item.category, filters.services.categoryL1)) return false;
  if (filters.services.modality.length && item.domain === "services" && !includesAny(item.searchableText, filters.services.modality)) return false;
  if (filters.events.eventTypeL1.length && item.domain === "events" && !includesAny(item.category, filters.events.eventTypeL1)) return false;
  if (filters.events.country && item.domain === "events" && !item.searchableText.includes(filters.events.country.toLowerCase())) return false;
  return true;
}

export function filterGlobalExploreItems(
  items: GlobalExploreItem[],
  filters: ExploreFilters,
  query: string,
): GlobalExploreItem[] {
  const q = query.trim().toLowerCase();
  return items.filter((item) => {
    if (q && !item.searchableText.includes(q)) return false;
    return matchesCatalog(item, filters.wantsFilters) && matchesCatalog(item, filters.offersFilters);
  });
}
