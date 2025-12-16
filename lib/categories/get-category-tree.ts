// lib/categories/get-category-tree.ts
import type { CategoryTreeNode } from "@/types/category";

/**
 * Client-safe helper.
 * Folosit din pagini "use client" (ex: categories/page.tsx) ca să ia arborele de categorii.
 *
 * Presupune că ai (sau vei avea) un endpoint care întoarce tree-ul:
 *   GET /api/categories/tree  -> CategoryTreeNode[]
 *
 * Dacă endpoint-ul nu există încă, aici vei vedea eroarea clară în runtime,
 * dar build-ul nu va mai pica pe "Cannot find module".
 */
export async function getCategoryTree(): Promise<CategoryTreeNode[]> {
  const res = await fetch("/api/categories/tree", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    // Nu aruncăm o eroare criptică
    const text = await res.text().catch(() => "");
    throw new Error(
      `getCategoryTree failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`
    );
  }

  const data = (await res.json()) as unknown;

  // Validare minimă, ca să evităm surprize în UI
  if (!Array.isArray(data)) return [];

  return data as CategoryTreeNode[];
}
