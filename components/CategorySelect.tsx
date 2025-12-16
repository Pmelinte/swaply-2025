"use client";

import { useEffect, useMemo } from "react";

// ✅ import RELATIV (fișierul real e în src/config)
import { ITEM_CATEGORIES } from "../src/config/item-categories";

// ✅ import RELATIV (tipurile sunt în src/types)
import type { CategoryTreeNode } from "../src/types/category";

export type CategorySelectProps = {
  categoryId: string;
  subcategoryId: string;
  onCategoryChange: (nextCategoryId: string) => void;
  onSubcategoryChange: (nextSubcategoryId: string) => void;

  // opțional: dacă vrei să pasezi tree din DB (ex: getCategoryTree)
  categories?: CategoryTreeNode[];

  disabled?: boolean;
  className?: string;
};

type UiCategory = {
  id: string;
  name: string;
  children: { id: string; name: string }[];
};

function toUiTreeFromStaticConfig(): UiCategory[] {
  // ITEM_CATEGORIES este ARRAY (nu object map)
  const list: UiCategory[] = (ITEM_CATEGORIES ?? []).map((cat) => ({
    id: cat.id,
    name: cat.label?.ro ?? cat.label?.en ?? cat.id,
    children: (cat.subcategories ?? []).map((sub) => ({
      id: sub.id,
      name: sub.label?.ro ?? sub.label?.en ?? sub.id,
    })),
  }));

  list.sort((a, b) => a.name.localeCompare(b.name));
  for (const c of list) c.children.sort((a, b) => a.name.localeCompare(b.name));

  return list;
}

function toUiTreeFromDbTree(tree: CategoryTreeNode[]): UiCategory[] {
  const mapped: UiCategory[] = (tree ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    children: (c.children ?? []).map((s: any) => ({
      id: s.id,
      name: s.name,
    })),
  }));

  mapped.sort((a, b) => a.name.localeCompare(b.name));
  for (const c of mapped) c.children.sort((a, b) => a.name.localeCompare(b.name));

  return mapped;
}

export default function CategorySelect({
  categoryId,
  subcategoryId,
  onCategoryChange,
  onSubcategoryChange,
  categories,
  disabled,
  className,
}: CategorySelectProps) {
  const tree: UiCategory[] = useMemo(() => {
    if (categories && categories.length > 0) return toUiTreeFromDbTree(categories);
    return toUiTreeFromStaticConfig();
  }, [categories]);

  const selectedCategory = useMemo(() => {
    return tree.find((c) => c.id === categoryId) ?? null;
  }, [tree, categoryId]);

  // dacă subcategoria nu mai există după schimbarea categoriei -> reset
  useEffect(() => {
    if (!selectedCategory) {
      if (subcategoryId) onSubcategoryChange("");
      return;
    }

    const ok =
      !subcategoryId ||
      selectedCategory.children.some((s) => s.id === subcategoryId);

    if (!ok) onSubcategoryChange("");
  }, [selectedCategory, subcategoryId, onSubcategoryChange]);

  const subcategories = selectedCategory?.children ?? [];

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Categorie</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            disabled={disabled}
          >
            <option value="">Alege categoria…</option>
            {tree.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Subcategorie</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={subcategoryId}
            onChange={(e) => onSubcategoryChange(e.target.value)}
            disabled={disabled || !categoryId}
          >
            <option value="">
              {categoryId ? "Alege subcategoria…" : "Alege mai întâi categoria…"}
            </option>
            {subcategories.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
