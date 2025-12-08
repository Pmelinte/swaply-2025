// src/lib/ai/item-classification.ts

// Motor AI pentru clasificarea obiectelor pe baza imaginii.
// Leagă Hugging Face (sau alt API de imagine) de taxonomia noastră din ITEM_CATEGORIES,
// și întoarce o sugestie unificată pentru Swaply (titlu, categorie, subcategorie, condiție).

import {
  ITEM_CATEGORIES,
  type ItemCondition,
} from "@/config/item-categories";

export interface RawAiLabel {
  label: string;
  score?: number;
}

export interface ItemAiSuggestion {
  title: string;
  description?: string;
  categoryId?: string;
  subcategoryId?: string;
  condition?: ItemCondition;
  rawCaption?: string;
  rawLabels?: RawAiLabel[];
}

// Modelul și cheia pentru Hugging Face se citesc din env.
// Poți ajusta ulterior sau schimba complet backend-ul,
// atât timp cât respecți contractul lui classifyItemFromImage().
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HF_MODEL_URL =
  process.env.HF_ITEM_CLASSIFICATION_MODEL_URL ??
  "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base";

if (!HF_API_KEY) {
  // Nu aruncăm eroare aici la import, ca să nu blocăm build-ul.
  // O verificăm la runtime în funcția classifyItemFromImage.
  console.warn(
    "[item-classification] HUGGINGFACE_API_KEY is not set. AI classification will fail until you configure it."
  );
}

/**
 * Funcție principală: pornește de la un imageUrl (ex: Cloudinary),
 * trimite imaginea la Hugging Face (captioning), apoi:
 * - generează titlu prietenos
 * - mapează la categorie / subcategorie folosind ITEM_CATEGORIES
 * - încearcă să deducă condiția (nou / folosit / pentru piese)
 */
export async function classifyItemFromImage(
  imageUrl: string
): Promise<ItemAiSuggestion | null> {
  if (!HF_API_KEY) {
    console.error(
      "[item-classification] Cannot classify image: missing HUGGINGFACE_API_KEY."
    );
    return null;
  }

  if (!imageUrl) {
    console.error("[item-classification] Cannot classify image: missing imageUrl.");
    return null;
  }

  try {
    // 1) Luăm imaginea brută (ex: de pe Cloudinary)
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.error(
        "[item-classification] Failed to fetch image for AI classification:",
        imageResponse.status,
        imageResponse.statusText
      );
      return null;
    }

    const imageArrayBuffer = await imageResponse.arrayBuffer();

    // 2) Trimitem la Hugging Face ca image-to-text (captioning)
    const hfResponse = await fetch(HF_MODEL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/octet-stream",
      },
      body: imageArrayBuffer,
    });

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text().catch(() => "");
      console.error(
        "[item-classification] Hugging Face error:",
        hfResponse.status,
        hfResponse.statusText,
        errorText
      );
      return null;
    }

    const hfJson = (await hfResponse.json()) as any;

    // Modelele tipică de image captioning (ex: BLIP) întorc ceva de genul:
    // [{ "generated_text": "a photo of a red bicycle in a park" }]
    const rawCaption = extractCaptionFromHfResponse(hfJson);
    const normalizedCaption = rawCaption ? normalizeWhitespace(rawCaption) : "";

    if (!normalizedCaption) {
      console.warn(
        "[item-classification] No caption generated from Hugging Face response."
      );
    }

    // 3) Deducem titlul
    const title = buildTitleFromCaption(normalizedCaption);

    // 4) Mapează descriere + categorie + subcategorie + condiție
    const description = buildDescriptionFromCaption(normalizedCaption);
    const { categoryId, subcategoryId } =
      mapCaptionToCategory(normalizedCaption);
    const condition = inferConditionFromCaption(normalizedCaption);

    const suggestion: ItemAiSuggestion = {
      title,
      description,
      categoryId,
      subcategoryId,
      condition,
      rawCaption: normalizedCaption,
      // rawLabels este pregătit pentru viitor (dacă folosim și image-classification, nu doar captioning)
      rawLabels: [],
    };

    return suggestion;
  } catch (error) {
    console.error("[item-classification] Unexpected error:", error);
    return null;
  }
}

/**
 * Extrage caption-ul din răspunsul Hugging Face.
 * Gestionăm câteva formate obișnuite:
 * - [{ generated_text: "..." }]
 * - { generated_text: "..." }
 * - fallback: string simplu
 */
function extractCaptionFromHfResponse(json: any): string | undefined {
  if (!json) return undefined;

  if (Array.isArray(json)) {
    const first = json[0];
    if (!first) return undefined;

    if (typeof first.generated_text === "string") {
      return first.generated_text;
    }

    if (typeof first.caption === "string") {
      return first.caption;
    }

    if (typeof first.label === "string") {
      return first.label;
    }
  } else if (typeof json === "object") {
    if (typeof json.generated_text === "string") {
      return json.generated_text;
    }
    if (typeof json.caption === "string") {
      return json.caption;
    }
    if (typeof json.label === "string") {
      return json.label;
    }
  } else if (typeof json === "string") {
    return json;
  }

  return undefined;
}

function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function capitalizeSentence(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function buildTitleFromCaption(caption?: string): string {
  if (!caption) {
    return "Obiect";
  }

  let candidate = caption;

  // Scoatem chestii gen "a photo of", "an image of"
  candidate = candidate.replace(/^a (photo|picture|image) of /i, "");
  candidate = candidate.replace(/^an (photo|picture|image) of /i, "");
  candidate = candidate.replace(/^the (photo|picture|image) of /i, "");

  // Limităm lungimea
  if (candidate.length > 80) {
    candidate = candidate.slice(0, 77) + "...";
  }

  return capitalizeSentence(candidate);
}

function buildDescriptionFromCaption(caption?: string): string | undefined {
  if (!caption) return undefined;

  let desc = caption.trim();
  desc = capitalizeSentence(desc);

  if (!desc.endsWith(".") && !desc.endsWith("!") && !desc.endsWith("?")) {
    desc = desc + ".";
  }

  return desc;
}

/**
 * Heuristici simple pentru a mapa caption-ul pe categorie / subcategorie.
 * Asta poate fi rafinat ulterior (sau mutat într-un model dedicat text → categorie).
 */
function mapCaptionToCategory(caption?: string): {
  categoryId?: string;
  subcategoryId?: string;
} {
  if (!caption) return {};

  const text = caption.toLowerCase();

  // Electronice / telefoane
  if (
    text.includes("phone") ||
    text.includes("iphone") ||
    text.includes("smartphone") ||
    text.includes("samsung galaxy")
  ) {
    return {
      categoryId: "electronics",
      subcategoryId: "smartphones",
    };
  }

  // Laptopuri
  if (
    text.includes("laptop") ||
    text.includes("notebook") ||
    text.includes("macbook")
  ) {
    return {
      categoryId: "computers",
      subcategoryId: "laptops",
    };
  }

  // Televizoare
  if (text.includes("tv") || text.includes("television")) {
    return {
      categoryId: "electronics",
      subcategoryId: "tvs",
    };
  }

  // Biciclete
  if (text.includes("bicycle") || text.includes("bike")) {
    return {
      categoryId: "sports",
      subcategoryId: "cycling",
    };
  }

  // Cărți
  if (text.includes("book") || text.includes("novel")) {
    return {
      categoryId: "books_media",
      subcategoryId: "books",
    };
  }

  // Haine
  if (
    text.includes("t-shirt") ||
    text.includes("shirt") ||
    text.includes("jacket") ||
    text.includes("coat") ||
    text.includes("clothes") ||
    text.includes("clothing")
  ) {
    return {
      categoryId: "fashion",
      subcategoryId: "mens_clothing", // fallback generic
    };
  }

  // Mobilier
  if (
    text.includes("sofa") ||
    text.includes("couch") ||
    text.includes("chair") ||
    text.includes("table") ||
    text.includes("desk")
  ) {
    return {
      categoryId: "furniture",
      subcategoryId: "living",
    };
  }

  // Dacă nu detectăm nimic, putem încerca un fallback mai inteligent
  // (de ex: mapare generală electronice vs haine vs mobilier), dar pentru început:
  return {
    categoryId: "other",
    subcategoryId: "misc",
  };
}

/**
 * Deducem condiția obiectului din caption.
 * Va fi rar perfect, dar poate ajuta: "new", "like new", "used", "old", "broken", etc.
 */
function inferConditionFromCaption(caption?: string): ItemCondition | undefined {
  if (!caption) return undefined;

  const text = caption.toLowerCase();

  if (text.includes("brand new") || text.includes("sealed") || text.includes("unopened")) {
    return "new";
  }

  if (text.includes("like new") || text.includes("almost new")) {
    return "like_new";
  }

  if (text.includes("used") || text.includes("second hand")) {
    return "used_good";
  }

  if (text.includes("old") || text.includes("worn")) {
    return "used_fair";
  }

  if (text.includes("broken") || text.includes("for parts") || text.includes("damaged")) {
    return "for_parts";
  }

  return undefined;
}

// Helper opțional: putem oferi și o funcție care verifică dacă o categorie
// propusă de AI există în taxonomia noastră (folositoare când vom avea
// modele text → categorie, nu doar caption).
export function isValidCategory(categoryId: string): boolean {
  return ITEM_CATEGORIES.some((c) => c.id === categoryId);
}

export function isValidSubcategory(
  categoryId: string,
  subcategoryId: string
): boolean {
  const category = ITEM_CATEGORIES.find((c) => c.id === categoryId);
  if (!category) return false;
  return category.subcategories.some((s) => s.id === subcategoryId);
}
