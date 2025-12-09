import { getCategories } from "@/lib/api/get-categories";
import { buildCategoryTree } from "@/lib/categories/build-tree";
import type { CategoryType, CategoryTreeNode } from "@/types/category";

/**
 * Fetch + build tree într-o singură funcție.
 * Exemplu:
 *   const tree = await getCategoryTree("object");
 */
export async function getCategoryTree(
  type?: CategoryType,
): Promise<CategoryTreeNode[]> {
  try {
    const flat = await getCategories(type);
    const tree = buildCategoryTree(flat);
    return tree;
  } catch (error) {
    console.error("[GET_CATEGORY_TREE_ERROR]", error);
    return [];
  }
}
