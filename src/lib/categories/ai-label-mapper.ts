// src/lib/categories/ai-label-mapper.ts

/**
 * Tip generic compatibil cu NormalizedClassificationResult
 * din endpoint-ul /api/ai/items/classify.
 *
 * Nu importăm direct tipul din API pentru a nu crea dependințe circulare.
 */
export type AiNormalizedLabel = {
  label: string;
  confidence?: number | null;
};

export type AiNormalizedResult = {
  mainLabel: string | null;
  labels: AiNormalizedLabel[];
  locale: string;
  raw: unknown;
};

export type AiCategoryMappingResult = {
  /** Slug de categorie (nivel 1) – ex: "electronics", "sports-outdoor" */
  categorySlug: string | "";
  /** Slug de subcategorie (nivel 2) – ex: "smartphones", "bicycles" */
  subcategorySlug: string | "";
};

/**
 * Regula de mapping:
 * - keywords: expresii/termene care dacă apar în label → mapăm aici
 * - categorySlug: slug-ul categoriei din DB
 * - subcategorySlug: slug-ul subcategoriei din DB (opțional)
 */
type AiCategoryRule = {
  keywords: string[];
  categorySlug: string;
  subcategorySlug?: string;
};

/**
 * Dicționar de mapping AI label -> categorie Swaply.
 *
 * IMPORTANT:
 * - Slug-urile trebuie să corespundă cu cele reale din tabela public.categories.
 * - Lista poate fi extinsă oricând, fără să rupem API-ul.
 */
const AI_CATEGORY_RULES: AiCategoryRule[] = [
  // -------------------------
  // Electronics / Phones
  // -------------------------
  {
    keywords: ["phone", "smartphone", "iphone", "android", "mobile"],
    categorySlug: "electronics",
    subcategorySlug: "smartphones",
  },
  {
    keywords: ["tablet", "ipad", "galaxy tab"],
    categorySlug: "electronics",
    subcategorySlug: "tablets",
  },
  {
    keywords: ["laptop", "notebook", "macbook", "ultrabook"],
    categorySlug: "electronics",
    subcategorySlug: "laptops",
  },
  {
    keywords: ["tv", "television", "monitor", "display", "screen"],
    categorySlug: "electronics",
    subcategorySlug: "tv-displays",
  },
  {
    keywords: ["camera", "dslr", "mirrorless", "photo"],
    categorySlug: "electronics",
    subcategorySlug: "cameras",
  },
  {
    keywords: ["headphones", "earbuds", "earphones", "headset"],
    categorySlug: "electronics",
    subcategorySlug: "audio",
  },
  {
    keywords: ["console", "playstation", "xbox", "nintendo", "switch"],
    categorySlug: "electronics",
    subcategorySlug: "gaming-consoles",
  },

  // -------------------------
  // Home / Furniture
  // -------------------------
  {
    keywords: ["sofa", "couch", "canapea"],
    categorySlug: "home-furniture",
    subcategorySlug: "sofas-couches",
  },
  {
    keywords: ["chair", "scaun", "armchair"],
    categorySlug: "home-furniture",
    subcategorySlug: "chairs",
  },
  {
    keywords: ["table", "masa", "desk", "birou"],
    categorySlug: "home-furniture",
    subcategorySlug: "tables-desks",
  },
  {
    keywords: ["bed", "pat", "mattress"],
    categorySlug: "home-furniture",
    subcategorySlug: "beds",
  },

  // -------------------------
  // Sports & Outdoor
  // -------------------------
  {
    keywords: ["bicycle", "bike", "mtb", "road bike"],
    categorySlug: "sports-outdoor",
    subcategorySlug: "bicycles",
  },
  {
    keywords: ["football", "soccer ball", "ball", "minge"],
    categorySlug: "sports-outdoor",
    subcategorySlug: "balls",
  },
  {
    keywords: ["tent", "camping", "sleeping bag"],
    categorySlug: "sports-outdoor",
    subcategorySlug: "camping",
  },

  // -------------------------
  // Clothing
  // -------------------------
  {
    keywords: ["t-shirt", "shirt", "tricou"],
    categorySlug: "clothing",
    subcategorySlug: "tops",
  },
  {
    keywords: ["hoodie", "sweatshirt"],
    categorySlug: "clothing",
    subcategorySlug: "hoodies",
  },
  {
    keywords: ["jeans", "pants", "trousers"],
    categorySlug: "clothing",
    subcategorySlug: "pants",
  },
  {
    keywords: ["jacket", "coat"],
    categorySlug: "clothing",
    subcategorySlug: "jackets",
  },

  // -------------------------
  // Books & Media
  // -------------------------
  {
    keywords: ["book", "novel", "comic", "manga"],
    categorySlug: "books-media",
    subcategorySlug: "books",
  },
  {
    keywords: ["board game", "game", "puzzle"],
    categorySlug: "toys-games",
    subcategorySlug: "board-games",
  },

  // -------------------------
  // Pets
  // -------------------------
  {
    keywords: ["dog", "cat", "pet toy"],
    categorySlug: "pets",
    subcategorySlug: "pet-toys",
  },
];

/**
 * Funcție principală: primește rezultatul AI normalizat
 * și întoarce best guess pentru categorySlug + subcategorySlug.
 *
 * Dacă nu găsește nimic potrivit, întoarce stringuri goale ("").
 */
export function mapAiLabelsToCategory(
  result: AiNormalizedResult,
): AiCategoryMappingResult {
  const labels = collectLabels(result);

  for (const label of labels) {
    const normalized = label.toLowerCase();

    for (const rule of AI_CATEGORY_RULES) {
      for (const kw of rule.keywords) {
        const keyword = kw.toLowerCase();

        // match simplu: exact, conține sau începe cu
        if (
          normalized === keyword ||
          normalized.includes(keyword) ||
          keyword.includes(normalized)
        ) {
          return {
            categorySlug: rule.categorySlug,
            subcategorySlug: rule.subcategorySlug ?? "",
          };
        }
      }
    }
  }

  // Fallback: nimic potrivit
  return {
    categorySlug: "",
    subcategorySlug: "",
  };
}

/**
 * Colectează toate etichetele relevante, în ordinea de prioritate:
 * - mainLabel (dacă există)
 * - etichetele individuale din `labels[]`
 */
function collectLabels(result: AiNormalizedResult): string[] {
  const list: string[] = [];

  if (result.mainLabel) {
    list.push(result.mainLabel);
  }

  for (const entry of result.labels ?? []) {
    if (entry.label) {
      list.push(entry.label);
    }
  }

  return list;
}
