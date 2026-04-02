import { describe, it, expect } from "vitest";
import { itemFormSchema } from "@/lib/schemas/item.schema";

describe("itemFormSchema", () => {
  const validItem = {
    title: "Laptop Dell",
    category: "electronics",
    condition: "good" as const,
  };

  it("accepts valid minimal item", () => {
    const result = itemFormSchema.safeParse(validItem);
    expect(result.success).toBe(true);
  });

  it("accepts valid full item", () => {
    const result = itemFormSchema.safeParse({
      ...validItem,
      description: "A great laptop in good condition",
      location: "Bucharest",
      wishlist: "Looking for a tablet",
      status: "active",
      intent: "open",
      flexibility: "moderate",
      perceivedValue: "medium",
      clarity: "have_idea",
      context: "permanent",
      acceptsBundle: true,
      recipientMatters: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects title shorter than 3 characters", () => {
    const result = itemFormSchema.safeParse({ ...validItem, title: "ab" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("title");
    }
  });

  it("rejects title longer than 100 characters", () => {
    const result = itemFormSchema.safeParse({
      ...validItem,
      title: "A".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty category", () => {
    const result = itemFormSchema.safeParse({ ...validItem, category: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing category", () => {
    const { category, ...noCategory } = validItem;
    const result = itemFormSchema.safeParse(noCategory);
    expect(result.success).toBe(false);
  });

  it("accepts all valid condition values", () => {
    for (const condition of ["new", "like_new", "good", "fair", "poor"]) {
      const result = itemFormSchema.safeParse({ ...validItem, condition });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid condition", () => {
    const result = itemFormSchema.safeParse({
      ...validItem,
      condition: "broken",
    });
    expect(result.success).toBe(false);
  });

  it("accepts description up to 2000 chars", () => {
    const result = itemFormSchema.safeParse({
      ...validItem,
      description: "A".repeat(2000),
    });
    expect(result.success).toBe(true);
  });

  it("rejects description over 2000 chars", () => {
    const result = itemFormSchema.safeParse({
      ...validItem,
      description: "A".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields as undefined", () => {
    const result = itemFormSchema.safeParse({
      title: "Test item here",
      category: "electronics",
      condition: "new",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all intent values", () => {
    for (const intent of ["explore", "open", "committed", "high_commitment"]) {
      const result = itemFormSchema.safeParse({ ...validItem, intent });
      expect(result.success).toBe(true);
    }
  });

  it("accepts all flexibility values", () => {
    for (const flexibility of ["strict", "moderate", "broad"]) {
      const result = itemFormSchema.safeParse({ ...validItem, flexibility });
      expect(result.success).toBe(true);
    }
  });

  it("rejects wishlist over 500 chars", () => {
    const result = itemFormSchema.safeParse({
      ...validItem,
      wishlist: "A".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});
