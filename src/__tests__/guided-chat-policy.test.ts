import { describe, expect, it } from "vitest";
import {
  buildAgreementSummaryDraft,
  canShareExactLocation,
  canUseFreeTextInGuidedChat,
  containsExactLocation,
  getNextGuidedChatStage,
  getPoliteDeclineTemplatesForStage,
  isGuidedChatOptional,
  isGuidedChatStage,
  redactExactLocationUntilAgreement,
  shouldPreserveOriginalMessage,
} from "@/lib/guided-chat/guidedChatPolicy";
import { GUIDED_CHAT_MESSAGE_EXAMPLES } from "@/lib/guided-chat/guidedChatSeeds";
import { GUIDED_CHAT_STAGES } from "@/lib/guided-chat/guidedChatTypes";

describe("guided chat policy", () => {
  it("keeps guided chat optional and free text available", () => {
    expect(isGuidedChatOptional()).toBe(true);

    for (const stage of GUIDED_CHAT_STAGES) {
      expect(canUseFreeTextInGuidedChat(stage)).toBe(true);
    }
  });

  it("validates guided chat stages and order", () => {
    expect(isGuidedChatStage("interest")).toBe(true);
    expect(isGuidedChatStage("unknown")).toBe(false);
    expect(getNextGuidedChatStage("interest")).toBe("why_i_want_it");
    expect(getNextGuidedChatStage("story_prompt")).toBeNull();
  });

  it("preserves original message when translation is available", () => {
    expect(shouldPreserveOriginalMessage(GUIDED_CHAT_MESSAGE_EXAMPLES[0])).toBe(true);
  });

  it("detects exact location and hides it until mutual agreement", () => {
    const unsafeMessage = GUIDED_CHAT_MESSAGE_EXAMPLES[2];

    expect(containsExactLocation(unsafeMessage.originalText)).toBe(true);
    expect(canShareExactLocation(unsafeMessage)).toBe(false);
    expect(redactExactLocationUntilAgreement(unsafeMessage)).toContain("location hidden");
  });

  it("allows exact location after mutual agreement", () => {
    const agreedMessage = {
      ...GUIDED_CHAT_MESSAGE_EXAMPLES[2],
      locationSharingState: "mutually_agreed" as const,
    };

    expect(canShareExactLocation(agreedMessage)).toBe(true);
    expect(redactExactLocationUntilAgreement(agreedMessage)).toContain("22 Baker Street");
  });

  it("provides polite decline templates", () => {
    const templates = getPoliteDeclineTemplatesForStage("logistics_clarification");

    expect(templates.length).toBeGreaterThan(0);
    expect(templates.some((template) => template.text.includes("courier"))).toBe(true);
  });

  it("builds agreement summaries that require human confirmation", () => {
    const summary = buildAgreementSummaryDraft({
      conversationId: "conversation-one",
      sourceMessageIds: ["m1", "m2"],
      summary: "Both people agree on condition and now need to confirm delivery.",
      unresolvedQuestions: [],
    });

    expect(summary.readyForExchange).toBe(true);
    expect(summary.requiresHumanConfirmation).toBe(true);
  });
});
