import { describe, it, expect } from "vitest";
import {
  aiClassifySchema,
  aiImageSchema,
  aiMatchSchema,
  moderateSchema,
  translateSchema,
  itemSchema,
  profileUpdateSchema,
  swapProposalSchema,
  reportSchema,
  validateBody,
} from "@/lib/validation";

describe("aiClassifySchema", () => {
  it("accepts valid input with title", () => {
    const result = aiClassifySchema.safeParse({ title: "Laptop Dell" });
    expect(result.success).toBe(true);
  });

  it("accepts valid input with description", () => {
    const result = aiClassifySchema.safeParse({ description: "Un laptop vechi dar funcțional" });
    expect(result.success).toBe(true);
  });

  it("accepts valid input with prompt", () => {
    const result = aiClassifySchema.safeParse({ prompt: "classify this" });
    expect(result.success).toBe(true);
  });

  it("rejects empty object (no title, description, or prompt)", () => {
    const result = aiClassifySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects title exceeding 200 chars", () => {
    const result = aiClassifySchema.safeParse({ title: "x".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("accepts valid action enum values", () => {
    for (const action of ["classify", "tags", "both"]) {
      const result = aiClassifySchema.safeParse({ title: "Test", action });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid action value", () => {
    const result = aiClassifySchema.safeParse({ title: "Test", action: "invalid" });
    expect(result.success).toBe(false);
  });
});

describe("aiImageSchema", () => {
  it("accepts imageUrl", () => {
    const result = aiImageSchema.safeParse({ imageUrl: "https://example.com/img.jpg" });
    expect(result.success).toBe(true);
  });

  it("accepts imageBase64", () => {
    const result = aiImageSchema.safeParse({ imageBase64: "data:image/png;base64,abc123" });
    expect(result.success).toBe(true);
  });

  it("rejects empty object", () => {
    const result = aiImageSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects invalid URL", () => {
    const result = aiImageSchema.safeParse({ imageUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });
});

describe("aiMatchSchema", () => {
  const validItem = {
    title: "Laptop",
    category: "Electronică",
    condition: "good",
  };

  it("accepts valid match input", () => {
    const result = aiMatchSchema.safeParse({
      offeredItem: validItem,
      requestedItem: validItem,
      baseScore: 75,
      reasons: ["Categorii compatibile"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects baseScore out of range", () => {
    const result = aiMatchSchema.safeParse({
      offeredItem: validItem,
      requestedItem: validItem,
      baseScore: 150,
      reasons: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative baseScore", () => {
    const result = aiMatchSchema.safeParse({
      offeredItem: validItem,
      requestedItem: validItem,
      baseScore: -1,
      reasons: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects item without title", () => {
    const result = aiMatchSchema.safeParse({
      offeredItem: { category: "Electronică", condition: "good" },
      requestedItem: validItem,
      baseScore: 50,
      reasons: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("moderateSchema", () => {
  it("accepts valid text", () => {
    const result = moderateSchema.safeParse({ text: "Salut!" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object (text is optional)", () => {
    const result = moderateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects text exceeding 5000 chars", () => {
    const result = moderateSchema.safeParse({ text: "x".repeat(5001) });
    expect(result.success).toBe(false);
  });
});

describe("translateSchema", () => {
  it("accepts valid translation input", () => {
    const result = translateSchema.safeParse({ text: "Hello", from: "en", to: "ro" });
    expect(result.success).toBe(true);
  });

  it("rejects empty text", () => {
    const result = translateSchema.safeParse({ text: "", from: "en", to: "ro" });
    expect(result.success).toBe(false);
  });

  it("rejects language code too short", () => {
    const result = translateSchema.safeParse({ text: "Hello", from: "e", to: "ro" });
    expect(result.success).toBe(false);
  });
});

describe("itemSchema", () => {
  it("accepts valid item", () => {
    const result = itemSchema.safeParse({
      title: "Chitară Yamaha",
      category: "Hobby & Jocuri",
      condition: "good",
    });
    expect(result.success).toBe(true);
  });

  it("applies defaults for optional fields", () => {
    const result = itemSchema.safeParse({
      title: "Test",
      category: "General",
      condition: "new",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("active");
      expect(result.data.description).toBe("");
      expect(result.data.photos).toEqual([]);
    }
  });

  it("accepts all valid condition values", () => {
    for (const condition of ["new", "good", "used", "used_good"]) {
      const result = itemSchema.safeParse({ title: "Test", category: "Gen", condition });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid condition", () => {
    const result = itemSchema.safeParse({
      title: "Test",
      category: "Gen",
      condition: "broken",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = itemSchema.safeParse({
      title: "",
      category: "Gen",
      condition: "new",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid status values", () => {
    for (const status of ["active", "reserved", "traded", "paused", "archived"]) {
      const result = itemSchema.safeParse({
        title: "Test",
        category: "Gen",
        condition: "new",
        status,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects photos with invalid URLs", () => {
    const result = itemSchema.safeParse({
      title: "Test",
      category: "Gen",
      condition: "new",
      photos: ["not-a-url"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 10 photos", () => {
    const result = itemSchema.safeParse({
      title: "Test",
      category: "Gen",
      condition: "new",
      photos: Array.from({ length: 11 }, (_, i) => `https://example.com/${i}.jpg`),
    });
    expect(result.success).toBe(false);
  });
});

describe("profileUpdateSchema", () => {
  it("accepts valid profile update", () => {
    const result = profileUpdateSchema.safeParse({
      displayName: "Ion",
      bio: "Îmi plac schimburile!",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty object (all fields optional)", () => {
    const result = profileUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts nested location", () => {
    const result = profileUpdateSchema.safeParse({
      location: { country: "Romania", city: "București", travelRadiusKm: 100 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects travelRadiusKm above 5000", () => {
    const result = profileUpdateSchema.safeParse({
      location: { travelRadiusKm: 6000 },
    });
    expect(result.success).toBe(false);
  });

  it("accepts nested visibility", () => {
    const result = profileUpdateSchema.safeParse({
      visibility: { publicProfile: true, itemsVisibility: "public" },
    });
    expect(result.success).toBe(true);
  });
});

describe("swapProposalSchema", () => {
  it("accepts valid swap proposal", () => {
    const result = swapProposalSchema.safeParse({
      requesterItemId: "item-1",
      responderItemId: "item-2",
      responderId: "user-2",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing responderId", () => {
    const result = swapProposalSchema.safeParse({
      requesterItemId: "item-1",
      responderItemId: "item-2",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional bundle IDs", () => {
    const result = swapProposalSchema.safeParse({
      requesterItemId: "item-1",
      responderItemId: "item-2",
      responderId: "user-2",
      requesterBundleIds: ["item-3", "item-4"],
      responderBundleIds: ["item-5"],
    });
    expect(result.success).toBe(true);
  });
});

describe("reportSchema", () => {
  it("accepts valid report", () => {
    const result = reportSchema.safeParse({
      reportedUserId: "user-bad",
      reason: "spam",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all valid reasons", () => {
    for (const reason of ["spam", "harassment", "inappropriate", "scam", "prohibited_item", "other"]) {
      const result = reportSchema.safeParse({ reportedUserId: "u1", reason });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid reason", () => {
    const result = reportSchema.safeParse({
      reportedUserId: "u1",
      reason: "bad_vibes",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing reportedUserId", () => {
    const result = reportSchema.safeParse({ reason: "spam" });
    expect(result.success).toBe(false);
  });
});

describe("validateBody", () => {
  it("returns data on valid input", () => {
    const result = validateBody({ text: "Hello", from: "en", to: "ro" }, translateSchema);
    expect(result.error).toBeNull();
    expect(result.data).toEqual({ text: "Hello", from: "en", to: "ro" });
  });

  it("returns error string on invalid input", () => {
    const result = validateBody({ text: "", from: "en", to: "ro" }, translateSchema);
    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
    expect(typeof result.error).toBe("string");
  });

  it("formats multiple errors with semicolons", () => {
    const result = validateBody({}, translateSchema);
    expect(result.error).toContain(";");
  });
});
