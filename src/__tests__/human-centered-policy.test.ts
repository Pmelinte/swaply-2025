import { describe, expect, it } from "vitest";
import {
  buildMeaningMatchExplanation,
  containsSensitiveHumanContext,
  getHumanContextPrivacyWarnings,
  isHumanContextOptional,
  sanitizeHumanContextText,
} from "@/lib/human-centered/humanCenteredPolicy";
import { HUMAN_CENTERED_ITEM_CONTEXT_EXAMPLES, RECIPIENT_INTEREST_EXAMPLES } from "@/lib/human-centered/humanCenteredSeeds";
import { SENTIMENTAL_VALUE_LEVELS, SWAP_INTENTIONS, RECIPIENT_USE_INTENTS } from "@/lib/human-centered/humanCenteredTypes";

describe("human-centered swapping policy", () => {
  it("keeps sentimental context optional", () => {
    expect(isHumanContextOptional({})).toBe(true);
    expect(isHumanContextOptional({ objectStory: "This object matters to me." })).toBe(false);
  });

  it("defines neutral intent enums without forcing personal disclosure", () => {
    expect(SENTIMENTAL_VALUE_LEVELS).toContain("none");
    expect(SWAP_INTENTIONS).toContain("meaningful_swap");
    expect(SWAP_INTENTIONS).toContain("second_life");
    expect(RECIPIENT_USE_INTENTS).toContain("no_preference");
  });

  it("detects and redacts sensitive text", () => {
    expect(containsSensitiveHumanContext("Call +40 722 111 222 after the swap")).toBe(true);
    expect(containsSensitiveHumanContext("Meet at 22 Baker Street")).toBe(true);
    expect(containsSensitiveHumanContext("I want it for a repair project")).toBe(false);
    expect(sanitizeHumanContextText("Email person@example.com")).toContain("[redacted]");
  });

  it("warns about public story consent and sensitive fields", () => {
    const warnings = getHumanContextPrivacyWarnings({
      objectStory: "Meet at 22 Baker Street",
      storyVisibility: "public_story_after_consent",
    });

    expect(warnings.length).toBeGreaterThanOrEqual(2);
    expect(warnings.join(" ")).toContain("consent");
  });

  it("builds advisory meaning match explanations that require human decision", () => {
    const explanation = buildMeaningMatchExplanation({
      itemContext: HUMAN_CENTERED_ITEM_CONTEXT_EXAMPLES[0],
      interestContext: RECIPIENT_INTEREST_EXAMPLES[0],
      signals: {
        economicFit: 62,
        logisticsFit: 85,
        categoryFit: 70,
        intentionFit: 90,
        sentimentalFit: 94,
        languageFit: 80,
        trustFit: 75,
        riskScore: 10,
      },
    });

    expect(explanation.advisoryOnly).toBe(true);
    expect(explanation.humanDecisionRequired).toBe(true);
    expect(explanation.score).toBeGreaterThan(70);
    expect(explanation.reasons.join(" ")).toContain("second-life");
    expect(explanation.privacyNotes.join(" ")).toContain("exact address");
  });
});
