// src/components/CategorySelect.tsx
"use client";

import React, { useMemo } from "react";

export type CategoryNode = {
  id: string;
  name: string;
  children?: CategoryNode[];
};

type Props = {
  categories: CategoryNode[];
  value?: { categoryId?: string; subcategoryId?: string };
  onChange: (next: { categoryId?: string; subcategoryId?: string }) => void;
  disabled?: boolean;
};

function sortTree(categories: CategoryNode[]): CategoryNode[] {
  const mapped = categories.map((c) => ({
    ...c,
    children: c.children ? sortTree(c.children) : undefined,
  }));

  mapped.sort((a: CategoryNode, b: CategoryNode) => a.name.localeCompare(b.name));

  for (const c of mapped) {
    if (c.children) {
      c.children.sort((a: CategoryNode, b: CategoryNode) =>
        a.name.localeCompare(b.name),
      );
    }
  }

  return mapped;
}

export default function CategorySelect({
  categories,
  value,
  onChange,
  disabled,
}: Props) {
  const sorted = useMemo(() => sortTree(categories), [categories]);

  const selectedCategoryId = value?.categoryId ?? "";
  const selectedSubcategoryId = value?.subcategoryId ?? "";

  const selectedCategory = sorted.find((c) => c.id === selectedCategoryId);
  const subcategories = selectedCategory?.children ?? [];

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium">Category</label>
        <select
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          value={selectedCategoryId}
          disabled={disabled}
          onChange={(e) => {
            const nextCategoryId = e.target.value || undefined;
            // când schimbi categoria, resetăm subcategoria
            onChange({ categoryId: nextCategoryId, subcategoryId: undefined });
          }}
        >
          <option value="">Select category…</option>
          {sorted.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Subcategory</label>
        <select
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          value={selectedSubcategoryId}
          disabled={disabled || !selectedCategoryId}
          onChange={(e) => {
            const nextSubId = e.target.value || undefined;
            onChange({ categoryId: selectedCategoryId || undefined, subcategoryId: nextSubId });
          }}
        >
          <option value="">Select subcategory…</option>
          {subcategories.map((sc) => (
            <option key={sc.id} value={sc.id}>
              {sc.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
