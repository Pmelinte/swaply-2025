import type { Category, CategoryTreeNode } from "@/types/category";

/**
 * Convertește lista plată de categorii într-un arbore ierarhic.
 *
 * Exemplu output:
 * [
 *   {
 *     id: "...",
 *     name: "Electronics",
 *     parentId: null,
 *     children: [
 *       { id: "...", name: "TV & Displays", parentId: "..." }
 *     ]
 *   }
 * ]
 */
export function buildCategoryTree(categories: Category[]): CategoryTreeNode[] {
  const map = new Map<string, CategoryTreeNode>();
  const roots: CategoryTreeNode[] = [];

  // initializează nodurile în map
  for (const cat of categories) {
    map.set(cat.id, {
      ...cat,
      children: [],
    });
  }

  // conectează nodurile cu părinții
  for (const node of map.values()) {
    if (node.parentId) {
      const parent = map.get(node.parentId);
      if (parent) {
        parent.children.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  // sortare opțională alfabetică
  sortTree(roots);

  return roots;
}

function sortTree(nodes: CategoryTreeNode[]) {
  nodes.sort((a, b) => a.name.localeCompare(b.name));
  for (const node of nodes) {
    if (node.children.length > 0) {
      sortTree(node.children);
    }
  }
}
