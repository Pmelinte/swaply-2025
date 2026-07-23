export type EventListingRow = {
  id: string;
  title?: string | null;
  event_title?: string | null;
  status?: string | null;
  created_at?: string | null;
  event_type_l1?: string | null;
  event_type_l2?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  city?: string | null;
  country?: string | null;
  region?: string | null;
  venue_name?: string | null;
  is_online?: boolean | null;
  description?: string | null;
  event_description?: string | null;
  capacity_available?: number | null;
  swap_wants_description?: string | null;
  perceived_value_tier?: string | null;
  items?: { title?: string | null; description?: string | null } | null;
};

export type EventListingFilters = {
  search?: string;
  location?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  minSeats?: number;
  sort?: "newest" | "soonest" | "seats";
};

function lower(value: unknown): string {
  return typeof value === "string" ? value.toLowerCase() : "";
}

export function getEventTitle(row: EventListingRow): string {
  return row.title || row.event_title || row.items?.title || "Event listing";
}

export function getEventLocation(row: EventListingRow): string {
  if (row.is_online) return "Online";
  return [row.venue_name, row.city, row.region, row.country].filter(Boolean).join(", ");
}

export function isActiveUpcomingEvent(row: EventListingRow, now = new Date()): boolean {
  if (row.status && row.status !== "active") return false;
  const cutoff = row.end_date || row.start_date;
  if (!cutoff) return true;
  return new Date(cutoff).getTime() >= new Date(now.toDateString()).getTime();
}

export function filterEventListings(
  rows: EventListingRow[],
  filters: EventListingFilters,
  now = new Date(),
): EventListingRow[] {
  const search = lower(filters.search?.trim());
  const location = lower(filters.location?.trim());
  const type = lower(filters.type?.trim());
  const from = filters.dateFrom ? new Date(filters.dateFrom).getTime() : null;
  const to = filters.dateTo ? new Date(filters.dateTo).getTime() : null;
  const minSeats = Number.isFinite(filters.minSeats) ? Math.max(0, filters.minSeats ?? 0) : 0;

  const filtered = rows.filter((row) => {
    if (!isActiveUpcomingEvent(row, now)) return false;
    const haystack = [
      getEventTitle(row),
      row.description,
      row.event_description,
      row.swap_wants_description,
      row.event_type_l1,
      row.event_type_l2,
      getEventLocation(row),
    ].map(lower).join(" ");
    if (search && !haystack.includes(search)) return false;
    if (location && !lower(getEventLocation(row)).includes(location)) return false;
    if (type && ![row.event_type_l1, row.event_type_l2].map(lower).some((v) => v.includes(type))) return false;
    const start = row.start_date ? new Date(row.start_date).getTime() : null;
    if (from !== null && (start === null || start < from)) return false;
    if (to !== null && (start === null || start > to)) return false;
    if (minSeats > 0 && Number(row.capacity_available ?? 0) < minSeats) return false;
    return true;
  });

  return filtered.sort((a, b) => {
    if (filters.sort === "soonest") return new Date(a.start_date ?? 8640000000000000).getTime() - new Date(b.start_date ?? 8640000000000000).getTime();
    if (filters.sort === "seats") return Number(b.capacity_available ?? 0) - Number(a.capacity_available ?? 0);
    return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
  });
}
