import { describe, expect, it } from "vitest";
import { AIGateway } from "@/lib/ai/gateway";
import { proposeSemanticMatchExplanation } from "@/lib/ai/semantic-match";

function fallbackGateway() {
  return new AIGateway({ providers: [] });
}

const request = {
  offeredItem: {
    title: "Vintage lamp",
    category: "home_garden",
    condition: "good",
    description: "Working lamp with minor signs of use",
  },
  requestedItem: {
    title: "Desk chair",
    category: "home_garden",
    condition: "good",
    description: "Ergonomic chair",
  },
  baseScore: 74,
  algorithmicReasons: ["Compatible categories", "Similar perceived value"],
  distanceKm: 12,
  locale: "en",
};

describe("E2.3 semantic match explanation", () => {
  it("preserves the local score as the authority", async () => {
    const proposal = await proposeSemanticMatchExplanation(fallbackGateway(), request);

    expect(proposal.baseScore).toBe(74);
    expect(proposal.suggestedScore).toBe(74);
    expect(proposal.scoreAdjustment).toBe(0);
    expect(proposal.affectsRanking).toBe(false);
    expect(proposal.requiresHumanConfirmation).toBe(true);
    expect(proposal.source).toBe("fallback");
  });

  it("returns bounded semantic output with explicit risks", async () => {
    const proposal = await proposeSemanticMatchExplanation(fallbackGateway(), request);

    expect(proposal.semanticScore).toBeGreaterThanOrEqual(0);
    expect(proposal.semanticScore).toBeLessThanOrEqual(100);
    expect(proposal.confidence).toBe("low");
    expect(proposal.risks.length).toBeGreaterThan(0);
    expect(proposal.summary).toContain("Manual review");
  });

  it("does not mutate the request", async () => {
    const before = structuredClone(request);
    await proposeSemanticMatchExplanation(fallbackGateway(), request);
    expect(request).toEqual(before);
  });
});