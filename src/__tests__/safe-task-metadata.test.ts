import { describe, expect, it } from "vitest";
import { buildSafeAITaskMetadata } from "@/lib/ai/safeTaskMetadata";

describe("safe AI task metadata", () => {
  it("counts fields without copying raw prompt text", () => {
    const metadata = buildSafeAITaskMetadata({
      taskType: "generate_item_description",
      locale: "en",
      input: {
        title: "Private expensive camera serial ABC-123",
        userNotes: "Meet me at my exact address",
        currency: "EUR",
      },
    });

    expect(metadata.taskType).toBe("generate_item_description");
    expect(metadata.locale).toBe("en");
    expect(metadata.fieldCount).toBe(3);
    expect(metadata.textFieldCount).toBe(3);
    expect(metadata.hasCurrencyHint).toBe(true);
    expect(JSON.stringify(metadata)).not.toContain("ABC-123");
    expect(JSON.stringify(metadata)).not.toContain("exact address");
  });

  it("counts image references without storing image URLs", () => {
    const metadata = buildSafeAITaskMetadata({
      taskType: "classify_item",
      input: {
        images: [
          { url: "https://example.com/private-1.jpg" },
          { cloudinaryPublicId: "private-id" },
        ],
      },
    });

    expect(metadata.imageCount).toBe(2);
    expect(JSON.stringify(metadata)).not.toContain("private-1.jpg");
    expect(JSON.stringify(metadata)).not.toContain("private-id");
  });

  it("tracks locale pair for translation", () => {
    const metadata = buildSafeAITaskMetadata({
      taskType: "translate",
      input: { text: "bonjour" },
      sourceLocale: "fr",
      targetLocale: "ro",
    });

    expect(metadata.sourceLocale).toBe("fr");
    expect(metadata.targetLocale).toBe("ro");
  });
});
