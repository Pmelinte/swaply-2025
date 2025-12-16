"use client";

import { useEffect, useMemo } from "react";

// Dacă ai taxonomie statică (MVP)
import { ITEM_CATEGORIES } from "@/config/item-categories";

// Dacă ai taxonomie din DB (tree). Dacă nu există încă, nu e problemă:
// tipul e import type-only și nu afectează runtime.
import type { CategoryTreeNode } from "@/types/category";

export type CategorySelectProps = {
  /**
   * Variante suportate:
   * 1) Controlled (cum îl folosești în add/page.tsx):
   *    - categoryId, subcategoryId + onCategoryChange/onSubcategoryChange
   *
   * 2) Din DB:
   *    - categories (tree) + aceleași callbacks
   */
  categoryId: string;
  subcategoryId: string;
  onCategoryChange: (nextCategoryId: string) => void;
  onSubcategoryChange: (nextSubcategoryId: string) => void;

  /**
   * Opțional: dacă ai încărcat din DB un tree (ex: getCategoryTree),
   * îl poți pasa aici și componenta îl folosește în loc de ITEM_CATEGORIES.
   */
  categories?: CategoryTreeNode[];

  /**
   * Opțional: UX
   */
  disabled?: boolean;
  className?: string;
};

type UiCategory = {
  id: string;
  name: string;
  children?: UiCategory[];
};

function toUiTreeFromStaticConfig(): UiCategory[] {
  // ITEM_CATEGORIES e un object map; îl transformăm în listă
  // Ca să nu depindem de shape exact 100%, mergem defensiv.
  const cats = Object.entries(ITEM_CATEGORIES ?? {}).map(([id, value]: any) => {
    const label =
      typeof value?.label === "string"
        ? value.label
        : value?.label?.ro ?? value?.label?.en ?? id;

    const subsObj = value?.subcategories ?? {};
    const children = Object.entries(subsObj).map(([sid, svalue]: any) => {
      const slabel =
        typeof svalue === "string"
          ? svalue
          : svalue?.label?.ro ?? svalue?.label?.en ?? sid;

      return { id: sid, name: slabel };
    });

    return { id, name: label, children };
  });

  // sort alfabetic
  cats.sort((a, b) => a.name.localeCompare(b.name));
  for (const c of cats) {
    c.children?.sort((a, b) => a.name.localeCompare(b.name));
  }

  return cats;
}

function toUiTreeFromDbTree(tree: CategoryTreeNode[]): UiCategory[] {
  // CategoryTreeNode: { id, name, children[] }
  const mapped = (tree ?? []).map((c) => ({
    id: (c as any).id,
    name: (c as any).name,
    children: ((c as any).children ?? []).map((s: any) => ({
      id: s.id,
      name: s.name,
    })),
  }));

  mapped.sort((a, b) => a.name.localeCompare(b.name));
  for (const c of mapped) {
    c.children?.sort((a, b) => a.name.localeCompare(b.name));
  }

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

  // Dacă user schimbă categoria, dar subcategoria curentă nu mai există,
  // o resetăm elegant.
  useEffect(() => {
    if (!selectedCategory) {
      if (subcategoryId) onSubcategoryChange("");
      return;
    }
    const ok =
      !subcategoryId ||
      (selectedCategory.children ?? []).some((s) => s.id === subcategoryId);

    if (!ok) onSubcategoryChange("");
  }, [selectedCategory, subcategoryId, onSubcategoryChange]);

  const subcategories = selectedCategory?.children ?? [];

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CATEGORY */}
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

        {/* SUBCATEGORY */}
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
