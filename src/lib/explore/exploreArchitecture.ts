import type { Item, ListingType, WantedRequest } from "@/lib/types";

export type ExploreDomain = "objects" | "properties" | "services" | "events";
export type ExploreReach = "nearby" | "country" | "world" | "travel" | "online";
export type ExploreFulfilment = "in_person" | "transport" | "digital" | "hybrid";

export type DemandSignal = Pick<
  WantedRequest,
  "id" | "userId" | "title" | "description" | "category" | "city" | "offerDescription" | "createdAt"
> & {
  domain: ExploreDomain;
};

const DOMAIN_LISTING_TYPE: Record<ExploreDomain, ListingType> = {
  objects: "object",
  properties: "property",
  services: "service",
  events: "event",
};

const DOMAIN_HINTS: Record<ExploreDomain, string[]> = {
  objects: ["object", "electronics", "home", "fashion", "sports", "book", "tool"],
  properties: ["property", "house", "apartment", "villa", "cabin", "studio", "room", "accommodation"],
  services: ["service", "creative", "technical", "education", "professional", "repair", "design", "translation"],
  events: ["event", "ticket", "concert", "festival", "conference", "sport", "webinar"],
};

export function getItemDomain(item: Item): ExploreDomain {
  if (item.experienceData || item.listingType === "event") return "events";
  if (item.listingType === "property") return "properties";
  if (item.listingType === "service") return "services";
  return "objects";
}

export function isItemInDomain(item: Item, domain: ExploreDomain): boolean {
  return getItemDomain(item) === domain;
}

export function filterDomainItems(items: Item[], domain: ExploreDomain, query = ""): Item[] {
  const normalized = query.trim().toLowerCase();
  return items.filter((item) => {
    if (!item.isActive || item.status !== "active" || !isItemInDomain(item, domain)) return false;
    if (!normalized) return true;
    return [item.title, item.description, item.category, item.wishlist, item.location]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalized);
  });
}

export function getItemReach(item: Item): ExploreReach[] {
  const domain = getItemDomain(item);
  const reach = new Set<ExploreReach>();

  if (domain === "services") {
    const delivery = item.serviceProfile?.delivery;
    if (delivery === "remote" || delivery === "hybrid") reach.add("online");
    if (delivery === "in_person" || delivery === "hybrid") reach.add("nearby");
    if (delivery === "remote") reach.add("world");
  } else if (domain === "properties") {
    reach.add("travel");
    reach.add("world");
  } else if (domain === "events") {
    const searchable = `${item.title} ${item.description} ${item.category}`.toLowerCase();
    if (/online|webinar|virtual|stream/.test(searchable)) reach.add("online");
    else reach.add("travel");
    reach.add("world");
  } else {
    reach.add("nearby");
    reach.add("country");
    if (item.context === "vacation") reach.add("travel");
    if (/international|worldwide|anywhere/.test(`${item.description} ${item.wishlist}`.toLowerCase())) reach.add("world");
  }

  return reach.size ? [...reach] : ["nearby"];
}

export function getItemFulfilment(item: Item): ExploreFulfilment[] {
  const domain = getItemDomain(item);
  if (domain === "services") {
    const delivery = item.serviceProfile?.delivery;
    if (delivery === "remote") return ["digital"];
    if (delivery === "hybrid") return ["hybrid"];
    return ["in_person"];
  }
  if (domain === "properties") return ["in_person"];
  if (domain === "events") {
    const searchable = `${item.title} ${item.description} ${item.category}`.toLowerCase();
    return /online|webinar|virtual|stream/.test(searchable) ? ["digital"] : ["in_person"];
  }
  return ["in_person", "transport"];
}

export function inferDemandDomain(request: Pick<WantedRequest, "category" | "title" | "description">): ExploreDomain {
  const haystack = [request.category, request.title, request.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let best: ExploreDomain = "objects";
  let bestScore = 0;
  for (const domain of Object.keys(DOMAIN_HINTS) as ExploreDomain[]) {
    const score = DOMAIN_HINTS[domain].reduce(
      (total, hint) => total + (haystack.includes(hint) ? 1 : 0),
      request.category?.toLowerCase() === DOMAIN_LISTING_TYPE[domain] ? 2 : 0,
    );
    if (score > bestScore) {
      best = domain;
      bestScore = score;
    }
  }
  return best;
}

export function itemFallbackDemand(items: Item[]): DemandSignal[] {
  return items
    .filter((item) => item.isActive && item.status === "active" && (item.wishlist ?? "").trim().length > 0)
    .map((item) => ({
      id: `item-wish-${item.id}`,
      userId: item.ownerId,
      title: (item.wishlist ?? "").trim(),
      description: undefined,
      category: item.category,
      city: approximateLocation(item.location),
      offerDescription: item.title,
      createdAt: item.createdAt,
      domain: getItemDomain(item),
    }));
}

export function normalizeDemandRequests(requests: WantedRequest[]): DemandSignal[] {
  return requests.map((request) => ({
    id: request.id,
    userId: request.userId,
    title: request.title,
    description: request.description,
    category: request.category,
    city: approximateLocation(request.city),
    offerDescription: request.offerDescription,
    createdAt: request.createdAt,
    domain: inferDemandDomain(request),
  }));
}

export function approximateLocation(location?: string | null): string | undefined {
  if (!location) return undefined;
  const parts = location.split(",").map((part) => part.trim()).filter(Boolean);
  return parts.length > 1 ? parts.slice(-2).join(", ") : parts[0];
}
