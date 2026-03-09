/**
 * Packaging supplies affiliate integration for Swaply.
 * Helps users find packaging materials for shipping swap items.
 *
 * Features:
 *   - Packaging size recommendations based on item dimensions
 *   - Affiliate links to packaging suppliers
 *   - Eco-friendly packaging options (aligned with Swaply's sustainability mission)
 *   - Partner pickup points for pre-packaged shipping
 *
 * Revenue model:
 *   - Packaging supplier affiliate: 5-8% commission
 *   - Branded Swaply packaging: direct sales margin 40-60%
 *
 * Env vars:
 *   EMAG_AFFILIATE_ID
 *   PACKAGING_PARTNER_API_KEY
 */

// ── Types ──

export type PackagingSize = "envelope" | "small" | "medium" | "large" | "custom";
export type PackagingMaterial = "cardboard" | "bubble_wrap" | "foam" | "paper" | "eco_wrap" | "reusable";

export interface PackagingRecommendation {
  size: PackagingSize;
  label: string;
  dimensions: { lengthCm: number; widthCm: number; heightCm: number };
  suitableFor: string[];
  estimatedWeight: number;  // grams (packaging only)
  ecoFriendly: boolean;
  tips: string[];
}

export interface PackagingSupplierLink {
  name: string;
  url: string;
  priceRange: string;
  ecoFriendly: boolean;
  icon: string;
}

export interface PackagingKit {
  id: string;
  name: string;
  description: string;
  contents: string[];
  price: number;          // EUR
  ecoFriendly: boolean;
  suitableFor: PackagingSize[];
}

// ── Packaging Recommendations ──

const PACKAGING_SPECS: Record<PackagingSize, PackagingRecommendation> = {
  envelope: {
    size: "envelope",
    label: "Plic / Plicumflat",
    dimensions: { lengthCm: 35, widthCm: 25, heightCm: 3 },
    suitableFor: ["documente", "cărți", "haine subțiri", "bijuterii", "accesorii mici"],
    estimatedWeight: 50,
    ecoFriendly: true,
    tips: [
      "Folosește un plic cu bule pentru protecție suplimentară",
      "Obiectele fragile necesită ambalaj suplimentar",
    ],
  },
  small: {
    size: "small",
    label: "Cutie mică",
    dimensions: { lengthCm: 25, widthCm: 20, heightCm: 15 },
    suitableFor: ["electronice mici", "jucării", "cărți", "cosmetice", "accesorii"],
    estimatedWeight: 150,
    ecoFriendly: true,
    tips: [
      "Umple golurile cu hârtie reciclată",
      "Înfășoară obiectele fragile individual",
    ],
  },
  medium: {
    size: "medium",
    label: "Cutie medie",
    dimensions: { lengthCm: 40, widthCm: 30, heightCm: 25 },
    suitableFor: ["haine", "încălțăminte", "electronice medii", "cărți multiple", "vase"],
    estimatedWeight: 300,
    ecoFriendly: true,
    tips: [
      "Stratifică obiectele grele la bază",
      "Folosește folie cu bule pentru electronice",
      "Eticheteaza FRAGIL daca este cazul",
    ],
  },
  large: {
    size: "large",
    label: "Cutie mare",
    dimensions: { lengthCm: 60, widthCm: 40, heightCm: 40 },
    suitableFor: ["mobilier mic", "echipament sportiv", "aparate electrocasnice", "colecții"],
    estimatedWeight: 500,
    ecoFriendly: false,
    tips: [
      "Întărește colțurile și fundul cutiei cu bandă adezivă",
      "Folosește material de umplutură abundent",
      "Consideră asigurarea coletului pentru obiecte valoroase",
    ],
  },
  custom: {
    size: "custom",
    label: "Ambalaj personalizat",
    dimensions: { lengthCm: 0, widthCm: 0, heightCm: 0 },
    suitableFor: ["obiecte neregulate", "obiecte foarte mari", "obiecte foarte fragile"],
    estimatedWeight: 0,
    ecoFriendly: false,
    tips: [
      "Contactează un serviciu de ambalare profesional",
      "Folosește spumă expandabilă pentru forme neregulate",
    ],
  },
};

// ── Public API ──

/**
 * Recommend packaging based on item dimensions and weight.
 */
export function recommendPackaging(
  itemLengthCm: number,
  itemWidthCm: number,
  itemHeightCm: number,
  itemWeightKg: number,
  isFragile?: boolean,
): PackagingRecommendation {
  // Add padding for protection
  const padding = isFragile ? 5 : 2; // cm on each side
  const neededL = itemLengthCm + padding * 2;
  const neededW = itemWidthCm + padding * 2;
  const neededH = itemHeightCm + padding * 2;

  if (neededH <= 3 && neededL <= 35 && neededW <= 25 && itemWeightKg <= 0.5) {
    return PACKAGING_SPECS.envelope;
  }
  if (neededL <= 25 && neededW <= 20 && neededH <= 15 && itemWeightKg <= 2) {
    return PACKAGING_SPECS.small;
  }
  if (neededL <= 40 && neededW <= 30 && neededH <= 25 && itemWeightKg <= 10) {
    return PACKAGING_SPECS.medium;
  }
  if (neededL <= 60 && neededW <= 40 && neededH <= 40 && itemWeightKg <= 30) {
    return PACKAGING_SPECS.large;
  }

  return {
    ...PACKAGING_SPECS.custom,
    dimensions: { lengthCm: neededL, widthCm: neededW, heightCm: neededH },
  };
}

/**
 * Get packaging supplier affiliate links.
 */
export function getPackagingSupplierLinks(): PackagingSupplierLink[] {
  const emagAffId = process.env.EMAG_AFFILIATE_ID ?? "";
  const emagRef = emagAffId ? `?ref=${emagAffId}` : "";

  return [
    {
      name: "eMAG - Ambalaje",
      url: `https://www.emag.ro/search/ambalaje-cutii-carton${emagRef}`,
      priceRange: "5-30 RON",
      ecoFriendly: false,
      icon: "📦",
    },
    {
      name: "Ambal122 (specialist)",
      url: "https://www.ambalaje-online.ro/",
      priceRange: "3-25 RON",
      ecoFriendly: false,
      icon: "🏭",
    },
    {
      name: "EcoAmbalaje",
      url: "https://www.ecoambalaje.ro/",
      priceRange: "5-35 RON",
      ecoFriendly: true,
      icon: "♻️",
    },
    {
      name: "Dedeman - Ambalare",
      url: "https://www.dedeman.ro/ambalare",
      priceRange: "8-40 RON",
      ecoFriendly: false,
      icon: "🔧",
    },
  ];
}

/**
 * Swaply branded packaging kits (direct sales).
 */
export function getSwapKits(): PackagingKit[] {
  return [
    {
      id: "kit_basic",
      name: "Kit Swaply Basic",
      description: "Kit standard de ambalare pentru un schimb",
      contents: ["1x cutie medie (40x30x25cm)", "Folie cu bule 1m", "Bandă adezivă", "Etichetă Swaply"],
      price: 4.99,
      ecoFriendly: false,
      suitableFor: ["small", "medium"],
    },
    {
      id: "kit_eco",
      name: "Kit Swaply Eco",
      description: "Kit de ambalare ecologic, 100% reciclabil",
      contents: ["1x cutie din carton reciclat", "Hârtie de ambalare kraft", "Bandă de hârtie", "Etichetă Swaply biodegradabilă"],
      price: 5.99,
      ecoFriendly: true,
      suitableFor: ["small", "medium"],
    },
    {
      id: "kit_fragile",
      name: "Kit Swaply Fragil",
      description: "Protecție maximă pentru obiecte delicate",
      contents: ["1x cutie dublu strat", "Folie cu bule 2m", "Colțare din spumă", "Etichetă FRAGIL", "Bandă adezivă premium"],
      price: 7.99,
      ecoFriendly: false,
      suitableFor: ["small", "medium", "large"],
    },
    {
      id: "kit_reusable",
      name: "Kit Swaply Reutilizabil",
      description: "Geantă reutilizabilă Swaply - folosește-o din nou și din nou",
      contents: ["1x geantă Swaply reutilizabilă (impermeabilă)", "1x pungă cu fermoar pentru protecție", "Etichetă reutilizabilă"],
      price: 9.99,
      ecoFriendly: true,
      suitableFor: ["envelope", "small", "medium"],
    },
  ];
}

/**
 * Get comprehensive packaging guidance for a swap item.
 */
export function getPackagingGuidance(
  itemCategory: string,
  itemCondition: "new" | "good" | "used",
): { materials: PackagingMaterial[]; tips: string[]; ecoOption: string } {
  const fragileCategories = new Set(["electronics", "ceramics", "glass", "antiques", "instruments", "art"]);
  const isFragile = fragileCategories.has(itemCategory);

  const materials: PackagingMaterial[] = ["cardboard"];
  if (isFragile) materials.push("bubble_wrap", "foam");
  if (itemCondition === "new") materials.push("paper");
  materials.push("eco_wrap");

  const tips: string[] = [
    "Fotografiază obiectul înainte de ambalare ca dovadă a stării",
    "Include adresa de retur pe colet",
  ];

  if (isFragile) {
    tips.push("Înfășoară individual fiecare parte fragilă");
    tips.push("Marcheaza coletul cu FRAGIL pe toate fetele");
    tips.push("Folosește minim 5cm material de protecție pe fiecare parte");
  }

  if (itemCondition === "new") {
    tips.push("Păstrează ambalajul original dacă este disponibil");
  }

  return {
    materials,
    tips,
    ecoOption: "Folosește hârtie reciclată și bandă de hârtie în loc de plastic — bun pentru planetă! 🌍",
  };
}
