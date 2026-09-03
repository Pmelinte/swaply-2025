import type { ExploreDomain } from "./exploreArchitecture";

export type SwipeChoice = "dismissed" | "interested" | "strong_interest";
export type SwipeDecision = { id: string; choice: SwipeChoice; title: string };
export type SwipeField = { label: string; value: string; kind?: "date" | "enum" | "weekdays" };
export type SwipeCandidate = {
  id: string; domain: ExploreDomain; title: string; image?: string;
  ownerId?: string; city?: string; fields: SwipeField[]; isDemo: boolean;
};
type Row = Record<string, unknown>;
const record = (value: unknown): Row => value && typeof value === "object" && !Array.isArray(value) ? value as Row : {};
const text = (...values: unknown[]) => values.find((v): v is string => typeof v === "string" && v.trim().length > 0)?.trim();
const numeric = (...values: unknown[]) => {
  const value = values.find((v) => (typeof v === "number" || typeof v === "string" && v.trim() !== "") && Number.isFinite(Number(v)) && Number(v) >= 0);
  return value === undefined ? undefined : String(Number(value));
};

function imageUrl(...sources: unknown[]): string | undefined {
  for (const source of sources) {
    if (Array.isArray(source)) { const image = imageUrl(...source); if (image) return image; }
    else {
      const url = text(source, record(source).url);
      if (url?.split(/[?#]/)[0].endsWith("/no-image.svg")) continue;
      if (url && (/^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url))) return url;
    }
  }
}

/** Never use venue, exact address or coordinates in a discovery card. */
export function swipeApproximateLocation(value: unknown): string | undefined {
  const raw = text(value);
  if (!raw) return;
  const parts = raw.split(",").map((part) => part.trim()).filter(Boolean);
  const safe = parts.filter((part) => !/\d|\b(street|strada|str\.?|avenue|road|rue|boulevard|postal|postcode|zip)\b/i.test(part));
  return safe.slice(-2).join(", ") || undefined;
}

const domainTypes: Record<string, ExploreDomain> = { object: "objects", property: "properties", service: "services", event: "events" };
export function swipeRowDomain(value: unknown): ExploreDomain {
  const row = record(value);
  for (const hint of [row.listingType, row.item_type, row.wizard_type, row.category]) {
    const domain = domainTypes[String(hint).toLowerCase()];
    if (domain) return domain;
  }
  if (row.experienceData || row.event_data) return "events";
  if (row.houseProfile || row.property_data) return "properties";
  if (row.serviceProfile || row.service_data) return "services";
  return "objects";
}

export function normalizeSwipeRows(rows: readonly unknown[], domain: ExploreDomain, viewerId?: string, query = ""): SwipeCandidate[] {
  const seen = new Set<string>();
  const search = query.trim().toLocaleLowerCase();
  return rows.flatMap((raw): SwipeCandidate[] => {
    const row = record(raw);
    const related = record(Array.isArray(row.items) ? row.items[0] : row.items);
    const data = record(row[domain === "properties" ? "property_data" : domain === "services" ? "service_data" : "event_data"]);
    const house = record(row.houseProfile);
    const service = record(row.serviceProfile);
    const experience = record(row.experienceData);
    const id = text(row.id);
    const ownerId = text(row.owner_id, row.ownerId, related.owner_id);
    const title = text(row.title, row.event_title, row.service_name, data.service_title, related.title);
    if (!id || !title || seen.has(id) || viewerId && ownerId === viewerId) return [];
    if (row.status && row.status !== "active" || row.is_active === false || row.isActive === false || related.is_active === false || related.status && related.status !== "active") return [];
    // Dedicated rows are supplied by their domain page; generic item rows must agree.
    if ((row.item_type || row.wizard_type || row.listingType) && swipeRowDomain(row) !== domain) return [];
    if (domain === "objects" && swipeRowDomain(row) !== "objects") return [];
    const fields: SwipeField[] = [];
    const add = (label: string, value: string | undefined, kind?: SwipeField["kind"]) => {
      if (!value || kind === "date" && !Number.isFinite(Date.parse(value))) return;
      fields.push({ label, value, kind });
    };
    const city = swipeApproximateLocation(text(row.location_city, row.city, data.city, related.location_city));
    const country = swipeApproximateLocation(text(row.country, row.country_code, data.country));
    const location = [city, country].filter(Boolean).join(", ") || swipeApproximateLocation(row.location);
    const wants = text(row.swap_wants_description, data.swap_wants_description, row.wishlist, row.desired_exchange_description, data.desired_exchange_description, related.swap_wants_description);
    if (domain === "objects") {
      add("category", text(row.category));
      add("condition", text(row.condition), "enum");
      add("location", location);
      add("reach", text(row.swap_geo_preference), "enum");
      if (!fields.some((field) => field.label === "reach")) add("reach", "notProvided", "enum");
      add("ownerWants", wants);
    } else if (domain === "properties") {
      add("propertyType", text(row.property_type, data.property_type, house.propertyType), "enum");
      add("location", location);
      add("availableFrom", text(row.available_from, data.available_start_date), "date");
      add("availableUntil", text(row.available_until, data.available_end_date), "date");
      add("capacity", numeric(row.max_guests, data.guests_limit, data.number_of_guests_allowed, house.maxGuests));
      add("bedrooms", numeric(row.bedrooms, data.bedrooms, house.bedrooms));
      add("exchangeType", text(row.exchange_type, data.exchange_type, house.swapMode), "enum");
      add("accepts", wants);
    } else if (domain === "services") {
      add("category", text(row.category_l1, data.service_category_l1, service.category, row.category));
      const delivery = text(row.delivery_mode, data.service_modality, service.delivery);
      add("delivery", delivery || "notProvided", "enum");
      if (delivery !== "remote" && delivery !== "online") add("location", location);
      add("availableFrom", text(row.available_date_from, data.available_from_date), "date");
      add("availableUntil", text(row.available_date_until, data.available_until_date), "date");
      const days = row.available_days ?? data.availability_days;
      if (Array.isArray(days)) add("availability", days.filter((day): day is string => typeof day === "string").join(", "), "weekdays");
      add("accepts", wants);
    } else {
      add("eventDate", text(row.start_date, data.start_date, experience.eventDate), "date");
      add("location", location);
      const modality = text(row.location_type, row.attendance_mode, data.location_type, data.event_format, row.event_format);
      add("eventMode", modality || (row.is_online === true ? "online" : row.is_online === false ? "in_person" : "notProvided"), "enum");
      add("transfer", text(row.ticket_format, data.ticket_format, row.transfer_method), "enum");
      add("deadline", text(row.transfer_deadline_at, data.booking_deadline_date), "date");
      add("availableUntil", text(row.end_date, row.expires_at), "date");
      add("capacity", numeric(row.capacity_available, data.capacity_available, experience.ticketCount));
    }
    if (search && ![title, wants, row.description, related.description, ...fields.map((field) => field.value)].filter(Boolean).join(" ").toLocaleLowerCase().includes(search)) return [];
    seen.add(id);
    return [{ id, domain, title, ownerId, city, fields, image: imageUrl(row.photos, row.images, row.image_url, row.gallery, related.images, related.image_url, data.portfolio_images), isDemo: row.is_demo === true || row.isDemo === true || related.is_demo === true }];
  });
}

export type SwipeAction = { type: "choose"; decision: SwipeDecision } | { type: "undo" } | { type: "restart" };
export function swipeReducer(history: SwipeDecision[], action: SwipeAction): SwipeDecision[] {
  if (action.type === "restart") return [];
  if (action.type === "undo") return history.slice(0, -1);
  if (history.some((entry) => entry.id === action.decision.id)) return history;
  return [...history, action.decision];
}
