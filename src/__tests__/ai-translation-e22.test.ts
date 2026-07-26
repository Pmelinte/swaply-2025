import { describe, expect, it } from "vitest";
import { AIGateway } from "@/lib/ai/gateway";
import { proposeTranslation } from "@/lib/ai/translation";

function fallbackGateway() {
  return new AIGateway({ providers: [] });
}

describe("E2.2 AI translation", () => {
  it("preserves the original text when no provider is active", async () => {
    const input = {
      text: "Schimb bicicleta pentru un laptop.",
      sourceLocale: "ro",
      targetLocale: "en",
      preserveTone: true,
    };

    const proposal = await proposeTranslation(fallbackGateway(), input);

    expect(input.text).toBe("Schimb bicicleta pentru un laptop.");
    expect(proposal.originalText).toBe(input.text);
    expect(proposal.translatedText).toBe(input.text);
    expect(proposal.source).toBe("fallback");
    expect(proposal.status).toBe("fallback");
    expect(proposal.requiresHumanConfirmation).toBe(true);
    expect(proposal.warning).toContain("Original text was preserved");
  });

  it("short-circuits same-language requests without changing text", async () => {
    const proposal = await proposeTranslation(fallbackGateway(), {
      text: "Original message",
      sourceLocale: "en",
      targetLocale: "en",
    });

    expect(proposal.status).toBe("same_language");
    expect(proposal.originalText).toBe("Original message");
    expect(proposal.translatedText).toBe("Original message");
  });

  it("rejects empty translation input", async () => {
    await expect(proposeTranslation(fallbackGateway(), {
      text: "   ",
      sourceLocale: "ro",
      targetLocale: "en",
    })).rejects.toThrow("translation_text_required");
  });

  it("keeps gateway translation fallback inside the concrete contract", async () => {
    const result = await fallbackGateway().run({
      taskType: "translate",
      input: {
        text: "Salut",
        sourceLocale: "ro",
        targetLocale: "en",
      },
    });

    expect(result.status).toBe("non_ai_fallback");
    expect(result.output).toMatchObject({
      originalText: "Salut",
      translatedText: "Salut",
      source: "fallback",
    });
    expect(result.output).not.toHaveProperty("available");
  });
});
