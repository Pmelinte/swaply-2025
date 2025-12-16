// src/types/category.ts

export type CategoryType = "object" | "service" | "home";

/**
 * Un rând “flat” (așa cum vine din DB / API /api/categories)
 */
export type Category = {
  id: string;
  name: string;
  slug: string;
  type: CategoryType;
  parentId: string | null;
};

/**
 * Nod în arbore (așa cum vine din /api/categories/tree sau buildCategoryTree)
 */
export type CategoryTreeNode = Category & {
  children: CategoryTreeNode[];
};
