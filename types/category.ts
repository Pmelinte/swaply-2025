// types/category.ts
// Shared category typing for Swaply (used by UI + lib + API tree building)

export type CategoryType = "object" | "service" | "home";

export type Category = {
  id: string;
  name: string;
  slug: string;
  type: CategoryType;
  parentId: string | null;
};

export type CategoryTreeNode = Category & {
  children: CategoryTreeNode[];
};
