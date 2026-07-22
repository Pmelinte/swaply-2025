export interface PropertyRow {
  id: string;
  title?: string;
  status?: string;
  created_at?: string;
  owner_id?: string;
  city?: string;
  country?: string;
  region?: string;
  location?: string;
  description?: string;
  images?: (string | { url?: string; order?: number })[] | null;
  image_url?: string | null;
  photos?: string[] | null;
  property_data?: Record<string, unknown> | null;
  items?: {
    title?: string;
    image_url?: string | null;
    images?: (string | { url?: string; order?: number })[] | null;
    description?: string;
  } | null;
  [key: string]: unknown;
}
const num = (v: unknown) =>
  typeof v === "number" ? v : typeof v === "string" && v ? Number(v) : null;
export function propertyValue(row: PropertyRow, key: string): unknown {
  return row[key] ?? row.property_data?.[key];
}
export function getPropertyPhotos(row: PropertyRow): string[] {
  const imgs = row.photos ?? row.images ?? row.items?.images ?? [];
  const urls = imgs
    .map((p) => (typeof p === "string" ? p : p?.url))
    .filter((u): u is string => !!u);
  return urls.length
    ? urls
    : row.image_url
      ? [row.image_url]
      : row.items?.image_url
        ? [row.items.image_url]
        : [];
}
export function getPropertyLocation(row: PropertyRow): string {
  const city = String(propertyValue(row, "city") ?? "");
  const country = String(propertyValue(row, "country") ?? "");
  return city && country
    ? `${city}, ${country}`
    : city || country || row.location || "";
}
export function getPropertyTitle(row: PropertyRow): string {
  return (
    row.title ||
    row.items?.title ||
    [
      String(propertyValue(row, "property_type") ?? "Property"),
      getPropertyLocation(row),
    ]
      .filter(Boolean)
      .join(" in ")
  );
}
export function getPropertyNumber(
  row: PropertyRow,
  key: string,
): number | null {
  return num(propertyValue(row, key));
}
export function getPropertyString(row: PropertyRow, key: string): string {
  const v = propertyValue(row, key);
  return typeof v === "string" ? v : "";
}
export function getPropertyArray(row: PropertyRow, key: string): string[] {
  const v = propertyValue(row, key);
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string")
    : [];
}
export function getApproximateMapLabel(row: PropertyRow): string {
  const city = String(propertyValue(row, "city") ?? "");
  const region = String(propertyValue(row, "region") ?? "");
  const country = String(propertyValue(row, "country") ?? "");
  return (
    [city, region, country].filter(Boolean).join(" · ") || "Approximate area"
  );
}
export function propertyMatchesFilters(
  row: PropertyRow,
  f: {
    q?: string;
    location?: string;
    guests?: number;
    start?: string;
    end?: string;
    amenities?: string[];
  },
) {
  const hay = [
    getPropertyTitle(row),
    getPropertyLocation(row),
    row.description,
    row.items?.description,
    getPropertyString(row, "desired_exchange_description"),
  ]
    .join(" ")
    .toLowerCase();
  if (f.q && !hay.includes(f.q.toLowerCase())) return false;
  if (
    f.location &&
    !getPropertyLocation(row).toLowerCase().includes(f.location.toLowerCase())
  )
    return false;
  if (
    f.guests &&
    (getPropertyNumber(row, "number_of_guests_allowed") ??
      getPropertyNumber(row, "guests_limit") ??
      0) < f.guests
  )
    return false;
  if (
    f.start &&
    getPropertyString(row, "available_end_date") &&
    getPropertyString(row, "available_end_date") < f.start
  )
    return false;
  if (
    f.end &&
    getPropertyString(row, "available_start_date") &&
    getPropertyString(row, "available_start_date") > f.end
  )
    return false;
  for (const a of f.amenities ?? [])
    if (propertyValue(row, a) !== true) return false;
  return true;
}
