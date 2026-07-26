import { describe, expect, it } from "vitest";
import { AIGateway } from "@/lib/ai/gateway";
import { proposeItemEnrichment } from "@/lib/ai/item-enrichment";

function fallbackGateway() {
  return new AIGateway({ providers: [] });
}

describe("E2.1 item enrichment", () => {
  it("returns a complete proposal without mutating user data", async () => {
    const input = {
      title: "Wireless gaming laptop",
      description: "Used carefully and ready to swap",
      condition: "good",
      locale: "en",
    };

    const proposal = await proposeItemEnrichment(fallbackGateway(), input);

    expect(input).toEqual({
      title: "Wireless gaming laptop",
      description: "Used carefully and ready to swap",
      condition: "good",
      locale: "en",
    });
    expect(proposal.requiresHumanConfirmation).toBe(true);
    expect(proposal.suggestedTitle).toBe("Wireless gaming laptop");
    expect(proposal.suggestedDescription).toContain("Wireless gaming laptop");
    expect(proposal.suggestedTags).toContain("wireless");
    expect(proposal.classificationSource).toBe("fallback");
    expect(proposal.descriptionSource).toBe("fallback");
  });

  it("accepts image-only input but reports that vision is inactive", async () => {
    const proposal = await proposeItemEnrichment(fallbackGateway(), {
      images: [{ cloudinaryPublicId: "swaply/items/example" }],
      locale: "ro",
    });

    expect(proposal.requiresHumanConfirmation).toBe(true);
    expect(proposal.confidence).toBe(0);
    expect(proposal.warnings).toContain("Images were not analysed by an active vision provider.");
  });

  it("rejects an empty enrichment request", async () => {
    await expect(proposeItemEnrichment(fallbackGateway(), {})).rejects.toThrow("invalid_input");
  });

  it("keeps generated description output inside the concrete contract", async () => {
    const gateway = fallbackGateway();
    const result = await gateway.run({
      taskType: "generate_item_description",
      input: { title: "Vintage lamp", category: "home", condition: "good" },
    });

    expect(result.status).toBe("non_ai_fallback");
    expect(result.output).toMatchObject({
      title: "Vintage lamp",
      source: "fallback",
    });
    expect(result.output).not.toHaveProperty("available");
  });
});