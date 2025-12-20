"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CategoryTreeNode } from "@/types/category";
import { getCategoryTree } from "@/lib/categories/get-category-tree";

export default function CategoriesPage() {
  const [tree, setTree] = useState<CategoryTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getCategoryTree("object");
        setTree(data);
        setError(null);
      } catch (err) {
        console.error("[CATEGORIES_PAGE_LOAD_ERROR]", err);
        setError("Nu s-au putut încărca categoriile.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return <div className="p-6">Se încarcă categoriile…</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Categorii</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {tree.map((cat) => (
          <div key={cat.id} className="border rounded-lg p-4 space-y-3">
            <Link
              href={`/categories/${cat.slug}`}
              className="text-lg font-semibold hover:underline"
            >
              {cat.name}
            </Link>

            {cat.children.length > 0 && (
              <ul className="space-y-1 text-sm text-gray-700">
                {cat.children.map((sub) => (
                  <li key={sub.id}>
                    <Link
                      href={`/categories/${sub.slug}`}
                      className="hover:underline"
                    >
                      → {sub.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}