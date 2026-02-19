import { describe, it, expect } from "vitest";
import {
  CATEGORIES_TAXONOMY,
  TOP_CATEGORIES,
  CATEGORY_NAMES,
  getSubcategories,
  findCategoryByName,
  getParentName,
  areSiblingCategories,
  getAllKeywords,
} from "@/lib/categories";

describe("CATEGORIES_TAXONOMY", () => {
  it("has correct total node count", () => {
    expect(CATEGORIES_TAXONOMY.length).toBeGreaterThanOrEqual(49);
  });

  it("has 6+ top-level categories", () => {
    const topLevel = CATEGORIES_TAXONOMY.filter((c) => c.level === 0);
    expect(topLevel.length).toBeGreaterThanOrEqual(6);
  });

  it("all nodes have required fields", () => {
    for (const node of CATEGORIES_TAXONOMY) {
      expect(node.id).toBeTruthy();
      expect(node.name).toBeTruthy();
      expect(node.level).toBeGreaterThanOrEqual(0);
      expect(node.keywords.length).toBeGreaterThan(0);
      expect(node.sortOrder).toBeGreaterThan(0);
    }
  });

  it("all subcategories have valid parentId", () => {
    const ids = new Set(CATEGORIES_TAXONOMY.map((c) => c.id));
    for (const node of CATEGORIES_TAXONOMY) {
      if (node.parentId) {
        expect(ids.has(node.parentId)).toBe(true);
      }
    }
  });

  it("top-level categories have null parentId", () => {
    for (const node of TOP_CATEGORIES) {
      expect(node.parentId).toBeNull();
      expect(node.level).toBe(0);
    }
  });

  it("subcategories have level 1", () => {
    const subs = CATEGORIES_TAXONOMY.filter((c) => c.parentId !== null);
    for (const sub of subs) {
      expect(sub.level).toBe(1);
    }
  });

  it("ids are unique", () => {
    const ids = CATEGORIES_TAXONOMY.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("TOP_CATEGORIES", () => {
  it("returns only level 0 categories", () => {
    expect(TOP_CATEGORIES.every((c) => c.level === 0)).toBe(true);
  });
});

describe("CATEGORY_NAMES", () => {
  it("has 6+ top-level names", () => {
    expect(CATEGORY_NAMES.length).toBeGreaterThanOrEqual(6);
  });

  it("includes known categories", () => {
    expect(CATEGORY_NAMES).toContain("Electronică");
    expect(CATEGORY_NAMES).toContain("Sport & Outdoor");
    expect(CATEGORY_NAMES).toContain("Casă & Grădină");
    expect(CATEGORY_NAMES).toContain("Modă & Accesorii");
  });
});

describe("getSubcategories", () => {
  it("returns correct subcategories for Electronică", () => {
    const subs = getSubcategories("cat-electronica");
    expect(subs.length).toBe(8);
    expect(subs[0].name).toBe("Telefoane & Tablete");
  });

  it("returns empty array for invalid parent", () => {
    expect(getSubcategories("invalid-id")).toEqual([]);
  });

  it("returns sorted by sortOrder", () => {
    const subs = getSubcategories("cat-electronica");
    for (let i = 1; i < subs.length; i++) {
      expect(subs[i].sortOrder).toBeGreaterThanOrEqual(subs[i - 1].sortOrder);
    }
  });

  it("returns subcategories for all top-level categories", () => {
    for (const cat of TOP_CATEGORIES) {
      const subs = getSubcategories(cat.id);
      expect(subs.length).toBeGreaterThan(0);
    }
  });
});

describe("findCategoryByName", () => {
  it("finds exact name match", () => {
    const result = findCategoryByName("Electronică");
    expect(result).toBeDefined();
    expect(result!.id).toBe("cat-electronica");
  });

  it("is case-insensitive", () => {
    const result = findCategoryByName("electronică");
    expect(result).toBeDefined();
    expect(result!.id).toBe("cat-electronica");
  });

  it("is accent-tolerant", () => {
    const result = findCategoryByName("Electronica");
    expect(result).toBeDefined();
    expect(result!.id).toBe("cat-electronica");
  });

  it("finds subcategories", () => {
    const result = findCategoryByName("Telefoane & Tablete");
    expect(result).toBeDefined();
    expect(result!.parentId).toBe("cat-electronica");
  });

  it("returns undefined for non-existent category", () => {
    expect(findCategoryByName("NonExistent")).toBeUndefined();
  });
});

describe("getParentName", () => {
  it("returns parent name for subcategory", () => {
    expect(getParentName("Telefoane & Tablete")).toBe("Electronică");
  });

  it("returns null for top-level category", () => {
    expect(getParentName("Electronică")).toBeNull();
  });

  it("returns null for non-existent category", () => {
    expect(getParentName("NonExistent")).toBeNull();
  });
});

describe("areSiblingCategories", () => {
  it("returns true for siblings (same parent)", () => {
    expect(areSiblingCategories("Telefoane & Tablete", "Laptopuri & PC")).toBe(true);
  });

  it("returns true for parent-child relationship", () => {
    expect(areSiblingCategories("Electronică", "Telefoane & Tablete")).toBe(true);
  });

  it("returns false for different parent categories", () => {
    expect(areSiblingCategories("Telefoane & Tablete", "Biciclete & Trotinete")).toBe(false);
  });

  it("returns false for non-existent categories", () => {
    expect(areSiblingCategories("Foo", "Bar")).toBe(false);
  });
});

describe("getAllKeywords", () => {
  it("returns keywords for top-level category", () => {
    const kws = getAllKeywords("Electronică");
    expect(kws).toContain("electronic");
    expect(kws).toContain("tech");
  });

  it("returns combined keywords for subcategory (own + parent)", () => {
    const kws = getAllKeywords("Telefoane & Tablete");
    expect(kws).toContain("telefon");
    expect(kws).toContain("phone");
    // Should also include parent keywords
    expect(kws).toContain("electronic");
  });

  it("returns empty array for non-existent category", () => {
    expect(getAllKeywords("NonExistent")).toEqual([]);
  });
});
