// lib/categories/get-category-tree.ts
import type { CategoryTreeNode, CategoryType } from "@/types/category";

/**
 * Client-safe helper.
 * Folosit din pagini "use client" (ex: categories/page.tsx) ca să ia arborele de categorii.
 *
 * Așteaptă endpoint:
 *   GET /api/categories/tree?type=object|service|home  -> CategoryTreeNode[]
 *
 * Dacă endpoint-ul nu există încă, build-ul trece, iar eroarea devine una clară la runtime.
 */
export async function getCategoryTree(type?: CategoryType): Promise<CategoryTreeNode[]> {
  const url =
    type ? `/api/categories/tree?type=${encodeURIComponent(type)}` : "/api/categories/tree";

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `getCategoryTree failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`
    );
  }

  const data = (await res.json()) as unknown;

  if (!Array.isArray(data)) return [];
  return data as CategoryTreeNode[];
}
