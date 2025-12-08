// src/features/items/ai/client.ts

// Tipuri pentru request / response la serviciul de clasificare a imaginilor de item.

export type ItemClassificationRequest = {
  imageUrl: string;
  locale?: string; // ex: "ro", "en", "fr"
};

export type ItemClassificationResult = {
  // Titlu sugerat pentru obiect (ce vrem să completăm automat în formular)
  title: string;

  // Categorie / subcategorie sugerate (pot fi folosite mai târziu)
  category?: string;
  subcategory?: string;

  // Starea obiectului, dacă o returnează modelul
  condition?: "new" | "used" | "unknown";

  // Încredere globală a modelului, 0–1
  confidence?: number;

  // Orice date brute de la API-ul AI (pentru debug)
  raw?: unknown;
};

type ClassifyOptions = {
  locale?: string;
  signal?: AbortSignal;
};

/**
 * Apelează endpoint-ul intern /api/ai/items/classify
 * cu URL-ul imaginii și întoarce un rezultat tipizat.
 *
 * Acest helper este gândit să fie folosit în componente client (ex: pagina /add).
 */
export async function classifyItemImage(
  imageUrl: string,
  options: ClassifyOptions = {},
): Promise<ItemClassificationResult> {
  const { locale, signal } = options;

  const response = await fetch("/api/ai/items/classify", {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      imageUrl,
      locale,
    } satisfies ItemClassificationRequest),
  });

  if (!response.ok) {
    // Pentru moment aruncăm o eroare simplă.
    // Mai târziu putem face un sistem de error-reporting mai detaliat.
    const text = await response.text().catch(() => "");
    throw new Error(
      `Failed to classify item image: ${response.status} ${response.statusText} ${text}`,
    );
  }

  const data = (await response.json()) as ItemClassificationResult;

  // Asigurăm niște fallback-uri rezonabile.
  return {
    title: data.title ?? "Item",
    category: data.category,
    subcategory: data.subcategory,
    condition: data.condition ?? "unknown",
    confidence: data.confidence,
    raw: data.raw ?? data,
  };
}
