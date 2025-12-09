export type CategoryType = "object" | "service" | "home";

export interface Category {
  id: string;
  name: string;
  slug: string;
  type: CategoryType;
  parentId: string | null;
}

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
}
