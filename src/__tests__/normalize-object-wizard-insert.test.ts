import { describe, expect, it } from "vitest";
import { normalizeObjectWizardItemInsert } from "@/lib/items/normalize-object-wizard-insert";

describe("normalizeObjectWizardItemInsert", () => {
  it("maps the legacy object wizard payload to the production items schema", () => {
    const result = normalizeObjectWizardItemInsert({
      owner_id: "user-a",
      title: "Batch 52 object",
      description: "Authenticated object creation",
      status: "active",
      category_l1: "Electronics",
      category_l2: "Computers",
      category_l3: "Vintage",
      condition: "Good",
      condition_details: "Minor cosmetic wear",
      perceived_value_tier: "Medium",
      age_years: "4",
      original_packaging: true,
      tags: ["batch-52"],
      photos: ["https://example.com/item.png"],
      swap_open_to: ["Objects only"],
      swap_wants_description: "A compact camera",
      swap_value_match: "Adjacent",
      swap_flexibility: "Moderate",
      swap_chain_allowed: true,
      swap_geo_preference: "Local",
      item_type: "object",
    }) as Record<string, unknown>;

    expect(result).toMatchObject({
      category: "Electronics",
      subcategory: "Computers",
      category_path: "Electronics > Computers > Vintage",
      condition: "good",
      condition_v2: "good",
      perceived_value_tier: "medium",
      images: ["https://example.com/item.png"],
      image_url: "https://example.com/item.png",
      swap_open_to: ["object"],
      chain_swap_allowed: true,
      swap_geo_preference: "local",
      status: "active",
      is_active: true,
    });

    expect(result).not.toHaveProperty("age_years");
    expect(result).not.toHaveProperty("condition_details");
    expect(result).not.toHaveProperty("original_packaging");
    expect(result).not.toHaveProperty("photos");
    expect(result).not.toHaveProperty("swap_chain_allowed");
    expect(result).not.toHaveProperty("swap_flexibility");
    expect(result).not.toHaveProperty("swap_value_match");

    expect(result.ai_metadata).toMatchObject({
      wishlist: "A compact camera",
      object_wizard: {
        schema_version: 1,
        requested_status: "active",
        condition_label: "Good",
        condition_details: "Minor cosmetic wear",
        age_years: 4,
        original_packaging: true,
        swap_value_match: "adjacent",
        swap_flexibility: "moderate",
      },
    });
  });

  it("stores a wizard draft as a private paused item and expands Anything", () => {
    const result = normalizeObjectWizardItemInsert({
      category_l1: "Media",
      title: "Draft item",
      status: "draft",
      condition: "Like New",
      perceived_value_tier: "Special",
      photos: [],
      swap_open_to: ["Anything"],
      swap_chain_allowed: false,
      swap_geo_preference: "International",
    }) as Record<string, unknown>;

    expect(result).toMatchObject({
      category: "Media",
      condition: "used_good",
      condition_v2: "like_new",
      perceived_value_tier: "special",
      swap_open_to: ["object", "property", "service", "event"],
      swap_geo_preference: "international",
      status: "paused",
      is_active: false,
    });
  });

  it("leaves canonical item writes untouched", () => {
    const canonical = {
      id: "item-1",
      owner_id: "user-a",
      category: "Electronics",
      condition: "good",
      images: ["https://example.com/item.png"],
      status: "active",
    };

    expect(normalizeObjectWizardItemInsert(canonical)).toBe(canonical);
  });
});
