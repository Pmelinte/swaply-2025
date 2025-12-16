// src/components/CategorySelect.tsx
"use client";

import React, { useMemo } from "react";

export type CategoryNode = {
  id: string;
  name: string;
  children?: CategoryNode[];
};

// ✅ Props “noi” (recomandate)
type NewProps = {
  categories?: CategoryNode[]; // ✅ optional
  value?: { categoryId?: string; subcategoryId?: string };
  onChange: (next: { categoryId?: string; subcategoryId?: string }) => void;
  disabled?: boolean;
};

// ✅ Props “vechi” (compatibilitate)
type LegacyProps = {
  categories?: CategoryNode[]; // ✅ optional
  categoryId?: string;
  subcategoryId?: string;
  onCategoryChange?: React.Dispatch<React.SetStateAction<string>>;
  onSubcategoryChange?: React.Dispatch<React.SetStateAction<string>>;
  disabled?: boolean;
};

export type Props = NewProps | LegacyProps;

function sortTree(categories: CategoryNode[]): CategoryNode[] {
  const mapped: CategoryNode[] = categories.map((c) => ({
    ...c,
    children: c.children ? sortTree(c.children) : undefined,
  }));

  mapped.sort((a, b) => a.name.localeCompare(b.name));

  for (const c of mapped) {
    if (c.children) {
      c.children.sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  return mapped;
}

function isNewProps(p: Props): p is NewProps {
  return typeof (p as any).onChange === "function";
}

export default function CategorySelect(props: Props) {
  const categories = props.categories ?? []; // ✅ fallback
  const disabled = (props as any).disabled as boolean | undefined;

  const sorted = useMemo(() => sortTree(categories), [categories]);

  const selectedCategoryId = isNewProps(props)
    ? props.value?.categoryId ?? ""
    : props.categoryId ?? "";

  const selectedSubcategoryId = isNewProps(props)
    ? props.value?.subcategoryId ?? ""
    : props.subcategoryId ?? "";

  const selectedCategory = sorted.find((c) => c.id === selectedCategoryId);
  const subcategories = selectedCategory?.children ?? [];

  const setCategory = (nextCategoryId?: string) => {
    if (isNewProps(props)) {
      props.onChange({ categoryId: nextCategoryId, subcategoryId: undefined });
    } else {
      props.onCategoryChange?.(nextCategoryId ?? "");
      props.onSubcategoryChange?.("");
    }
  };

  const setSubcategory = (nextSubcategoryId?: string) => {
    if (isNewProps(props)) {
      props.onChange({
        categoryId: selectedCategoryId || undefined,
        subcategoryId: nextSubcategoryId,
      });
    } else {
      props.onSubcategoryChange?.(nextSubcategoryId ?? "");
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium">Category</label>
        <select
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          value={selectedCategoryId}
          disabled={disabled || sorted.length === 0}
          onChange={(e) => setCategory(e.target.value || undefined)}
        >
          <option value="">
            {sorted.length === 0 ? "No categories loaded" : "Select category…"}
          </option>
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
          disabled={disabled || !selectedCategoryId || subcategories.length === 0}
          onChange={(e) => setSubcategory(e.target.value || undefined)}
        >
          <option value="">
            {!selectedCategoryId
              ? "Select category first"
              : subcategories.length === 0
              ? "No subcategories"
              : "Select subcategory…"}
          </option>
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
