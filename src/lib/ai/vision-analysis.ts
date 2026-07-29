const LOCALE_PATTERN = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;

export const DEFAULT_GROQ_VISION_MODEL = "qwen/qwen3.6-27b";
export const DEFAULT_GEMINI_VISION_MODEL = "gemini-3.6-flash";
export const DEFAULT_HUGGINGFACE_VISION_MODEL =
  "Qwen/Qwen2.5-VL-3B-Instruct:fastest";

export const VISION_CATEGORY_TREE = [
  {
    name: "Animals & Pet Supplies",
    subcategories: ["Pet Supplies", "Small Animals", "Aquatic", "Reptiles"],
  },
  {
    name: "Apparel & Accessories",
    subcategories: ["Clothing", "Footwear", "Bags", "Jewelry", "Watches"],
  },
  {
    name: "Arts & Entertainment",
    subcategories: ["Collectibles", "Art Supplies", "Musical Instruments", "Games"],
  },
  {
    name: "Baby & Toddler",
    subcategories: ["Clothing", "Furniture", "Toys", "Gear"],
  },
  {
    name: "Business & Industrial",
    subcategories: ["Equipment", "Supplies", "Tools", "Office"],
  },
  {
    name: "Cameras & Optics",
    subcategories: ["Digital Cameras", "Film Cameras", "Lenses", "Accessories"],
  },
  {
    name: "Electronics",
    subcategories: ["Computers", "Phones", "Audio", "Accessories"],
  },
  {
    name: "Furniture",
    subcategories: ["Home Furniture", "Office Furniture", "Outdoor", "Storage"],
  },
  {
    name: "Hardware",
    subcategories: ["Tools", "Safety Equipment", "Building Materials", "Fixtures"],
  },
  {
    name: "Health & Beauty",
    subcategories: ["Skincare", "Fragrance", "Hair Care", "Wellness"],
  },
  {
    name: "Home & Garden",
    subcategories: ["Kitchen", "Decor", "Bedding", "Garden Tools"],
  },
  {
    name: "Luggage & Bags",
    subcategories: ["Travel Bags", "Backpacks", "Handbags", "Briefcases"],
  },
  {
    name: "Mature",
    subcategories: ["Adult Items", "Books", "Games"],
  },
  {
    name: "Media",
    subcategories: ["Books", "Movies", "Music", "Comics"],
  },
  {
    name: "Office Supplies",
    subcategories: ["Writing", "Paper", "Organization", "Tech"],
  },
  {
    name: "Software",
    subcategories: ["Applications", "Operating Systems", "Licenses", "Plugins"],
  },
  {
    name: "Sporting Goods",
    subcategories: ["Equipment", "Apparel", "Footwear", "Accessories"],
  },
  {
    name: "Toys & Games",
    subcategories: ["Board Games", "Action Figures", "Puzzles", "LEGO"],
  },
  {
    name: "Vehicles & Parts",
    subcategories: ["Cars", "Motorcycles", "Parts", "Accessories"],
  },
] as const;

export type VisionCategoryL1 = (typeof VISION_CATEGORY_TREE)[number]["name"];

export interface VisionAnalysisData {
  title: string;
  caption: string;
  category: string;
  categoryL1: string;
  categoryL2: string;
  confidence: number | null;
  locale: string;
  manualCompletionRequired: boolean;
}

type CategoryResolution = {
  categoryL1: string;
  categoryL2: string;
};

type CategoryRule = CategoryResolution & {
  keywords: string[];
};

const LEGACY_CATEGORY_ALIASES: Record<string, CategoryResolution> = {
  electronics: { categoryL1: "Electronics", categoryL2: "Accessories" },
  "telefoane & tablete": { categoryL1: "Electronics", categoryL2: "Phones" },
  "laptopuri & pc": { categoryL1: "Electronics", categoryL2: "Computers" },
  "monitoare & tv": { categoryL1: "Electronics", categoryL2: "Accessories" },
  "audio & casti": { categoryL1: "Electronics", categoryL2: "Audio" },
  "console & gaming": { categoryL1: "Electronics", categoryL2: "Accessories" },
  "foto & video": { categoryL1: "Cameras & Optics", categoryL2: "Digital Cameras" },
  "componente & periferice": { categoryL1: "Electronics", categoryL2: "Accessories" },
  "wearables & smart": { categoryL1: "Electronics", categoryL2: "Accessories" },
  sports_outdoor: { categoryL1: "Sporting Goods", categoryL2: "Equipment" },
  hobby_games: { categoryL1: "Toys & Games", categoryL2: "Board Games" },
  books_media: { categoryL1: "Media", categoryL2: "Books" },
  home_garden: { categoryL1: "Home & Garden", categoryL2: "Decor" },
  fashion_accessories: { categoryL1: "Apparel & Accessories", categoryL2: "Clothing" },
  vehicles: { categoryL1: "Vehicles & Parts", categoryL2: "Cars" },
  mobilier: { categoryL1: "Furniture", categoryL2: "Home Furniture" },
  bucatarie: { categoryL1: "Home & Garden", categoryL2: "Kitchen" },
  "unelte & bricolaj": { categoryL1: "Hardware", categoryL2: "Tools" },
  "decor & iluminat": { categoryL1: "Home & Garden", categoryL2: "Decor" },
  electrocasnice: { categoryL1: "Home & Garden", categoryL2: "Kitchen" },
  "gradina & exterior": { categoryL1: "Home & Garden", categoryL2: "Garden Tools" },
  "genti & rucsacuri": { categoryL1: "Luggage & Bags", categoryL2: "Backpacks" },
  "ceasuri & bijuterii": { categoryL1: "Apparel & Accessories", categoryL2: "Watches" },
  "incaltaminte": { categoryL1: "Apparel & Accessories", categoryL2: "Footwear" },
  autoturisme: { categoryL1: "Vehicles & Parts", categoryL2: "Cars" },
  "motociclete & scutere": { categoryL1: "Vehicles & Parts", categoryL2: "Motorcycles" },
  "jocuri de societate": { categoryL1: "Toys & Games", categoryL2: "Board Games" },
  "instrumente muzicale": { categoryL1: "Arts & Entertainment", categoryL2: "Musical Instruments" },
  "arta & pictura": { categoryL1: "Arts & Entertainment", categoryL2: "Art Supplies" },
  "colectii & raritati": { categoryL1: "Arts & Entertainment", categoryL2: "Collectibles" },
  "fictiune & romane": { categoryL1: "Media", categoryL2: "Books" },
  "non-fictiune & stiinta": { categoryL1: "Media", categoryL2: "Books" },
  "benzi desenate & manga": { categoryL1: "Media", categoryL2: "Comics" },
  "vinyl & muzica fizica": { categoryL1: "Media", categoryL2: "Music" },
  "dvd & blu-ray": { categoryL1: "Media", categoryL2: "Movies" },
};

const CATEGORY_RULES: CategoryRule[] = [
  { categoryL1: "Cameras & Optics", categoryL2: "Lenses", keywords: ["camera lens", "lens", "obiectiv", "telephoto", "wide angle"] },
  { categoryL1: "Cameras & Optics", categoryL2: "Film Cameras", keywords: ["film camera", "analog camera", "35mm camera", "aparat analog"] },
  { categoryL1: "Cameras & Optics", categoryL2: "Digital Cameras", keywords: ["camera", "dslr", "mirrorless", "gopro", "aparat foto", "camcorder"] },
  { categoryL1: "Electronics", categoryL2: "Phones", keywords: ["smartphone", "mobile phone", "iphone", "telefon", "tablet", "ipad"] },
  { categoryL1: "Electronics", categoryL2: "Computers", keywords: ["laptop", "notebook computer", "desktop computer", "macbook", "chromebook", "computer", "calculator"] },
  { categoryL1: "Electronics", categoryL2: "Audio", keywords: ["headphones", "earbuds", "speaker", "amplifier", "microphone", "casti", "boxa", "audio"] },
  { categoryL1: "Toys & Games", categoryL2: "LEGO", keywords: ["lego", "building blocks"] },
  { categoryL1: "Toys & Games", categoryL2: "Board Games", keywords: ["board game", "chess", "cards game", "joc de societate", "sah"] },
  { categoryL1: "Toys & Games", categoryL2: "Puzzles", keywords: ["jigsaw", "puzzle"] },
  { categoryL1: "Arts & Entertainment", categoryL2: "Musical Instruments", keywords: ["guitar", "piano", "violin", "drums", "chitara", "pian", "vioara"] },
  { categoryL1: "Arts & Entertainment", categoryL2: "Collectibles", keywords: ["collectible", "coin collection", "stamp collection", "colectie", "monede", "timbre"] },
  { categoryL1: "Arts & Entertainment", categoryL2: "Art Supplies", keywords: ["paintbrush", "easel", "canvas", "art supplies", "pictura", "sevalet"] },
  { categoryL1: "Media", categoryL2: "Comics", keywords: ["comic", "manga", "graphic novel", "benzi desenate"] },
  { categoryL1: "Media", categoryL2: "Music", keywords: ["vinyl", "record album", "audio cd", "cassette", "caseta"] },
  { categoryL1: "Media", categoryL2: "Movies", keywords: ["dvd", "blu-ray", "bluray", "movie disc"] },
  { categoryL1: "Media", categoryL2: "Books", keywords: ["book", "novel", "textbook", "carte", "roman", "manual"] },
  { categoryL1: "Furniture", categoryL2: "Office Furniture", keywords: ["office chair", "office desk", "filing cabinet", "scaun birou", "birou"] },
  { categoryL1: "Furniture", categoryL2: "Outdoor", keywords: ["patio furniture", "garden chair", "outdoor table", "mobilier gradina"] },
  { categoryL1: "Furniture", categoryL2: "Storage", keywords: ["wardrobe", "bookshelf", "cabinet", "shelving", "dulap", "raft"] },
  { categoryL1: "Furniture", categoryL2: "Home Furniture", keywords: ["sofa", "chair", "table", "bed frame", "canapea", "scaun", "masa", "pat"] },
  { categoryL1: "Hardware", categoryL2: "Tools", keywords: ["drill", "hammer", "screwdriver", "power tool", "bormasina", "ciocan", "surubelnita"] },
  { categoryL1: "Home & Garden", categoryL2: "Kitchen", keywords: ["cookware", "blender", "coffee maker", "kettle", "bucatarie", "oala", "tigaie", "cafetiera"] },
  { categoryL1: "Home & Garden", categoryL2: "Garden Tools", keywords: ["lawn mower", "garden tool", "hose", "plant pot", "gradina", "gazon", "furtun", "ghiveci"] },
  { categoryL1: "Home & Garden", categoryL2: "Bedding", keywords: ["duvet", "blanket", "pillow", "bed linen", "pilota", "patura", "perna"] },
  { categoryL1: "Home & Garden", categoryL2: "Decor", keywords: ["lamp", "vase", "curtain", "mirror", "decor", "lampa", "vaza", "oglinda"] },
  { categoryL1: "Luggage & Bags", categoryL2: "Backpacks", keywords: ["backpack", "rucksack", "rucsac"] },
  { categoryL1: "Luggage & Bags", categoryL2: "Travel Bags", keywords: ["suitcase", "luggage", "travel bag", "troler", "valiza"] },
  { categoryL1: "Luggage & Bags", categoryL2: "Handbags", keywords: ["handbag", "purse", "poseta", "geanta de mana"] },
  { categoryL1: "Apparel & Accessories", categoryL2: "Footwear", keywords: ["shoes", "sneakers", "boots", "sandals", "pantofi", "adidasi", "ghete"] },
  { categoryL1: "Apparel & Accessories", categoryL2: "Watches", keywords: ["wristwatch", "smartwatch", "watch", "ceas"] },
  { categoryL1: "Apparel & Accessories", categoryL2: "Jewelry", keywords: ["jewelry", "ring", "bracelet", "necklace", "bijuterie", "inel", "bratara"] },
  { categoryL1: "Apparel & Accessories", categoryL2: "Clothing", keywords: ["shirt", "jacket", "dress", "trousers", "clothing", "camasa", "geaca", "rochie", "pantaloni"] },
  { categoryL1: "Sporting Goods", categoryL2: "Footwear", keywords: ["running shoes", "football boots", "ski boots", "pantofi alergare"] },
  { categoryL1: "Sporting Goods", categoryL2: "Equipment", keywords: ["bicycle", "bike", "dumbbell", "tennis racket", "skis", "snowboard", "bicicleta", "gantera", "racheta"] },
  { categoryL1: "Vehicles & Parts", categoryL2: "Motorcycles", keywords: ["motorcycle", "motorbike", "moped", "motocicleta", "scuter"] },
  { categoryL1: "Vehicles & Parts", categoryL2: "Parts", keywords: ["car part", "engine part", "wheel rim", "auto part", "piesa auto", "motor"] },
  { categoryL1: "Vehicles & Parts", categoryL2: "Cars", keywords: ["car", "automobile", "suv", "sedan", "masina", "autoturism"] },
  { categoryL1: "Baby & Toddler", categoryL2: "Gear", keywords: ["stroller", "baby carrier", "car seat", "carucior", "scaun auto copil"] },
  { categoryL1: "Baby & Toddler", categoryL2: "Toys", keywords: ["baby toy", "toddler toy", "jucarie bebelus"] },
  { categoryL1: "Animals & Pet Supplies", categoryL2: "Pet Supplies", keywords: ["pet bed", "pet carrier", "dog leash", "cat toy", "acvariu", "lesa", "cusca"] },
  { categoryL1: "Office Supplies", categoryL2: "Writing", keywords: ["pen set", "pencil", "marker", "stilou", "pix", "creion"] },
  { categoryL1: "Office Supplies", categoryL2: "Paper", keywords: ["notebook", "printer paper", "envelope", "caiet", "hartie"] },
  { categoryL1: "Health & Beauty", categoryL2: "Fragrance", keywords: ["perfume", "fragrance", "parfum"] },
  { categoryL1: "Health & Beauty", categoryL2: "Skincare", keywords: ["skincare", "face cream", "serum", "cosmetic", "crema", "cosmetice"] },
];

export function normalizeVisionLocale(locale: unknown): string {
  if (typeof locale !== "string") return "en";
  const normalized = locale.trim().replace(/_/g, "-");
  return LOCALE_PATTERN.test(normalized) ? normalized : "en";
}

export function resolveVisionLocale(input: {
  explicitLocale?: unknown;
  referer?: string | null;
  acceptLanguage?: string | null;
}): string {
  if (typeof input.explicitLocale === "string" && input.explicitLocale.trim()) {
    return normalizeVisionLocale(input.explicitLocale);
  }

  if (input.referer) {
    try {
      const firstSegment = new URL(input.referer).pathname.split("/").filter(Boolean)[0];
      if (firstSegment) return normalizeVisionLocale(firstSegment);
    } catch {
      // Ignore malformed or relative referrers and continue to Accept-Language.
    }
  }

  const preferredLanguage = input.acceptLanguage?.split(",")[0]?.split(";")[0]?.trim();
  return normalizeVisionLocale(preferredLanguage);
}

export function buildVisionPrompt(localeInput: unknown): string {
  const locale = normalizeVisionLocale(localeInput);
  const taxonomy = VISION_CATEGORY_TREE.map(
    (category) => `${category.name}: ${category.subcategories.join(", ")}`,
  ).join("\n");

  return `You analyse listing photos for Swaply, a global swap and barter platform.

Return exactly one JSON object with this schema:
{
  "title": "a concise factual listing title written in BCP-47 locale ${locale}",
  "description": "one or two factual sentences written in BCP-47 locale ${locale}",
  "category_l1": "exactly one level-1 value from the taxonomy below",
  "category_l2": "exactly one level-2 value belonging to category_l1, or an empty string when uncertain",
  "confidence": 0.0
}

Taxonomy:
${taxonomy}

Rules:
- Describe only what is visible in the image.
- Do not invent brand, model, age, condition, authenticity, value, ownership, or working status.
- Use OCR only when the text is clearly legible.
- Keep the title under 80 characters and the description under 500 characters.
- The title and description must use locale ${locale}; taxonomy values must remain exactly as written above.
- Confidence is a number from 0 to 1 for the object/category identification.
- Return JSON only, without Markdown or commentary.`;
}

export function parseVisionResponse(
  text: string,
  localeInput: unknown,
): VisionAnalysisData | null {
  const locale = normalizeVisionLocale(localeInput);
  const cleaned = text.replace(/```json?\s*/gi, "").replace(/```/g, "").trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

  let parsed: Record<string, unknown> | null = null;
  if (jsonMatch) {
    try {
      const value = JSON.parse(jsonMatch[0]);
      if (value && typeof value === "object" && !Array.isArray(value)) {
        parsed = value as Record<string, unknown>;
      }
    } catch {
      parsed = null;
    }
  }

  const description = firstString(
    parsed?.description,
    parsed?.caption,
    parsed?.desc,
    parsed ? undefined : cleaned,
  );
  const rawTitle = firstString(parsed?.title);
  const title = formatVisionTitle(rawTitle || description);

  if (!title && !description) return null;

  const rawCategoryL1 = firstString(
    parsed?.category_l1,
    parsed?.categoryL1,
    parsed?.category,
  );
  const rawCategoryL2 = firstString(parsed?.category_l2, parsed?.categoryL2);
  const category = resolveVisionCategory(
    rawCategoryL1,
    rawCategoryL2,
    `${title} ${description}`,
  );
  const confidence = normalizeConfidence(parsed?.confidence);

  return {
    title: title.slice(0, 80),
    caption: description.slice(0, 500),
    category: category.categoryL1,
    categoryL1: category.categoryL1,
    categoryL2: category.categoryL2,
    confidence,
    locale,
    manualCompletionRequired: !category.categoryL1 || confidence === null || confidence < 0.55,
  };
}

export function fallbackVisionFromUrl(
  imageUrl: string | undefined,
  localeInput: unknown,
): VisionAnalysisData {
  const locale = normalizeVisionLocale(localeInput);
  const title = extractFilenameTitle(imageUrl);
  const category = resolveVisionCategory("", "", title);

  return {
    title: title.slice(0, 80),
    caption: title.slice(0, 500),
    category: category.categoryL1,
    categoryL1: category.categoryL1,
    categoryL2: category.categoryL2,
    confidence: null,
    locale,
    manualCompletionRequired: true,
  };
}

export function resolveVisionCategory(
  rawCategoryL1: string,
  rawCategoryL2: string,
  contextText: string,
): CategoryResolution {
  const canonicalL1 = findCanonicalCategoryL1(rawCategoryL1);
  if (canonicalL1) {
    const canonicalL2 = findCanonicalCategoryL2(canonicalL1, rawCategoryL2);
    if (canonicalL2) return { categoryL1: canonicalL1, categoryL2: canonicalL2 };

    const inferredWithinParent = inferCategoryFromText(contextText, canonicalL1);
    return {
      categoryL1: canonicalL1,
      categoryL2: inferredWithinParent.categoryL2,
    };
  }

  const alias = LEGACY_CATEGORY_ALIASES[normalizeText(rawCategoryL1)];
  if (alias) {
    const canonicalL2 = findCanonicalCategoryL2(alias.categoryL1, rawCategoryL2);
    return {
      categoryL1: alias.categoryL1,
      categoryL2: canonicalL2 || alias.categoryL2,
    };
  }

  const l2OnlyMatch = findCategoryBySubcategory(rawCategoryL2 || rawCategoryL1);
  if (l2OnlyMatch) return l2OnlyMatch;

  return inferCategoryFromText(`${rawCategoryL1} ${rawCategoryL2} ${contextText}`);
}

function inferCategoryFromText(
  text: string,
  restrictToL1?: string,
): CategoryResolution {
  const normalized = normalizeText(text);
  if (!normalized) return { categoryL1: restrictToL1 || "", categoryL2: "" };

  for (const rule of CATEGORY_RULES) {
    if (restrictToL1 && rule.categoryL1 !== restrictToL1) continue;
    if (rule.keywords.some((keyword) => normalized.includes(normalizeText(keyword)))) {
      return { categoryL1: rule.categoryL1, categoryL2: rule.categoryL2 };
    }
  }

  return { categoryL1: restrictToL1 || "", categoryL2: "" };
}

function findCanonicalCategoryL1(value: string): string {
  const normalized = normalizeText(value);
  return (
    VISION_CATEGORY_TREE.find((category) => normalizeText(category.name) === normalized)
      ?.name || ""
  );
}

function findCanonicalCategoryL2(parentName: string, value: string): string {
  const normalized = normalizeText(value);
  if (!normalized) return "";
  const parent = VISION_CATEGORY_TREE.find((category) => category.name === parentName);
  return parent?.subcategories.find((subcategory) => normalizeText(subcategory) === normalized) || "";
}

function findCategoryBySubcategory(value: string): CategoryResolution | null {
  const normalized = normalizeText(value);
  if (!normalized) return null;

  for (const category of VISION_CATEGORY_TREE) {
    const subcategory = category.subcategories.find(
      (candidate) => normalizeText(candidate) === normalized,
    );
    if (subcategory) {
      return { categoryL1: category.name, categoryL2: subcategory };
    }
  }

  return null;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z0-9&+\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function normalizeConfidence(value: unknown): number | null {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.min(1, Math.max(0, number));
}

function formatVisionTitle(value: string): string {
  const title = value
    .trim()
    .replace(
      /^(there is |there are |a photo of |an image of |a picture of |this is |the image shows |an? )/i,
      "",
    )
    .replace(/\s+/g, " ");
  if (!title) return "";
  return title.charAt(0).toUpperCase() + title.slice(1);
}

function extractFilenameTitle(imageUrl?: string): string {
  if (!imageUrl) return "";

  let filename = "";
  try {
    const url = new URL(imageUrl);
    filename = decodeURIComponent(url.pathname.split("/").pop() || "");
  } catch {
    if (imageUrl.startsWith("data:")) return "";
    filename = imageUrl.split("/").pop() || "";
  }

  const cleaned = filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\d{3,}\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const useful =
    cleaned.length >= 3 &&
    /[a-zA-Z]{3,}/.test(cleaned) &&
    !/^[a-z0-9]{15,}$/i.test(cleaned);

  return useful ? formatVisionTitle(cleaned) : "";
}
