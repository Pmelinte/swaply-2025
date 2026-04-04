/**
 * Normalize database values to i18n-safe slugs.
 * Handles both legacy Romanian values and current English slugs.
 * Every DB value MUST map to a known i18n key — no raw values ever displayed.
 */

const CONDITION_MAP: Record<string, string> = {
  // English slugs (current)
  new: "new",
  like_new: "like_new",
  good: "good",
  fair: "fair",
  poor: "poor",
  used: "used",
  used_good: "used_good",
  // Romanian legacy values
  "Nou": "new",
  "Ca nou": "like_new",
  "Bun": "good",
  "Bună": "good",
  "Foarte bună": "good",
  "Acceptabil": "fair",
  "Uzat": "poor",
  "Folosit": "used",
};

const CATEGORY_MAP: Record<string, string> = {
  // English slugs (current — after migration)
  electronics: "electronics",
  sports_outdoor: "sports_outdoor",
  hobby_games: "hobby_games",
  books_media: "books_media",
  home_garden: "home_garden",
  fashion_accessories: "fashion_accessories",
  auto_moto: "auto_moto",
  music_audio: "music_audio",
  gardening_outdoor: "gardening_outdoor",
  toys_kids: "toys_kids",
  tools_diy: "tools_diy",
  vehicles: "vehicles",
  experiences: "experiences",
  medical: "medical",
  other: "other",
  // Romanian legacy values (pre-migration fallback)
  "Electronică": "electronics",
  "Electronice": "electronics",
  "Sport & Outdoor": "sports_outdoor",
  "Hobby & Jocuri": "hobby_games",
  "Cărți & Media": "books_media",
  "Casă & Grădină": "home_garden",
  "Modă & Accesorii": "fashion_accessories",
  "Auto & Moto": "auto_moto",
  "Muzică & Audio": "music_audio",
  "Grădinărit & Exterior": "gardening_outdoor",
  "Jucării & Copii": "toys_kids",
  "Unelte & Bricolaj": "tools_diy",
  "Vehicule": "vehicles",
  "Experiențe": "experiences",
  "Altele": "other",
  "Medical": "medical",
};

const STATUS_MAP: Record<string, string> = {
  active: "active",
  reserved: "reserved",
  traded: "traded",
  paused: "paused",
  archived: "archived",
};

/**
 * Normalize a condition value from DB to an i18n slug.
 * Usage: tObj("condition_" + normalizeCondition(item.condition))
 */
export function normalizeCondition(value: string): string {
  return CONDITION_MAP[value] ?? "good";
}

/**
 * Normalize a category value from DB to an i18n slug.
 * Usage: tCat(normalizeCategory(item.category))
 */
export function normalizeCategory(value: string): string {
  return CATEGORY_MAP[value] ?? "other";
}

/**
 * Normalize a status value from DB to an i18n slug.
 * Usage: t("status_" + normalizeStatus(item.status))
 */
export function normalizeStatus(value: string): string {
  return STATUS_MAP[value] ?? "active";
}
