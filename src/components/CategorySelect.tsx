"use client";

import { useState, useEffect } from "react";
import {
  ITEM_CATEGORIES,
  type ItemCategory,
  type ItemSubcategory,
} from "@/config/item-categories";

interface Props {
  categoryId: string;
  subcategoryId: string;
  onCategoryChange: (v: string) => void;
  onSubcategoryChange: (v: string) => void;
}

export default function CategorySelect({
  categoryId,
  subcategoryId,
  onCategoryChange,
  onSubcategoryChange,
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | null>(
    null
  );
  const [selectedSubcategory, setSelectedSubcategory] =
    useState<ItemSubcategory | null>(null);

  // când primim valori din AI → actualizăm intern selecțiile
  useEffect(() => {
    const cat = ITEM_CATEGORIES.find((c) => c.id === categoryId) || null;
    setSelectedCategory(cat);

    if (cat) {
      const sub =
        cat.subcategories.find((s) => s.id === subcategoryId) || null;
      setSelectedSubcategory(sub);
    } else {
      setSelectedSubcategory(null);
    }
  }, [categoryId, subcategoryId]);

  function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    onCategoryChange(id);

    const cat = ITEM_CATEGORIES.find((c) => c.id === id) || null;
    setSelectedCategory(cat);

    // reset subcategorie dacă schimbăm categoria
    if (cat) {
      const first = cat.subcategories[0] || null;
      setSelectedSubcategory(first);
      onSubcategoryChange(first?.id ?? "");
    } else {
      setSelectedSubcategory(null);
      onSubcategoryChange("");
    }
  }

  function handleSubcategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    onSubcategoryChange(id);

    if (selectedCategory) {
      const sub =
        selectedCategory.subcategories.find((s) => s.id === id) || null;
      setSelectedSubcategory(sub);
    }
  }

  return (
    <div className="space-y-3">
      {/* Categoria */}
      <div>
        <label className="block mb-1 font-medium">Categorie</label>
        <select
          className="border rounded px-3 py-2 w-full"
          value={categoryId}
          onChange={handleCategoryChange}
        >
          <option value="">Alege categoria</option>
          {ITEM_CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.label.ro}
            </option>
          ))}
        </select>
      </div>

      {/* Subcategoria */}
      {selectedCategory && (
        <div>
          <label className="block mb-1 font-medium">Subcategorie</label>
          <select
            className="border rounded px-3 py-2 w-full"
            value={subcategoryId}
            onChange={handleSubcategoryChange}
          >
            <option value="">Alege subcategoria</option>
            {selectedCategory.subcategories.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.label.ro}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
