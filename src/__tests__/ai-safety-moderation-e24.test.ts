import { describe, expect, it, vi } from "vitest";
import { AIGateway, type AIProvider } from "@/lib/ai/gateway";
import { proposeMessageModeration } from "@/lib/ai/safety-moderation";

async function runAsServerSide<T>(callback: () => Promise<T>) {
  const originalWindow = globalThis.window;
  vi.stubGlobal("window", undefined);
  try {
    return await callback();
  } finally {
    vi.stubGlobal("window", originalWindow);
  }
}

describe("E2.4 AI safety moderation", () => {
  it("allows empty content without provider calls", async () => {
    const run = vi.fn(async () => ({ safe: true, flags: [] }));
    const gateway = new AIGateway({ providers: [{ id: "test", supports: () => true, run }] });

    const result = await runAsServerSide(() => proposeMessageModeration(gateway, "   "));

    expect(result.recommendedAction).toBe("allow");
    expect(result.automaticEnforcement).toBe(false);
    expect(run).not.toHaveBeenCalled();
  });

  it("keeps high-risk deterministic findings server-side", async () => {
    const run = vi.fn(async () => ({ safe: true, flags: [] }));
    const gateway = new AIGateway({ providers: [{ id: "external", external: true, supports: () => true, run }] });

    const result = await runAsServerSide(() => proposeMessageModeration(
      gateway,
      "Send money by Western Union or crypto gift card outside Swaply",
    ));

    expect(result.recommendedAction).toBe("block");
    expect(result.requiresHumanReview).toBe(true);
    expect(result.source).toBe("deterministic");
    expect(result.automaticEnforcement).toBe(false);
    expect(run).not.toHaveBeenCalled();
  });

  it("merges provider flags without automatic enforcement", async () => {
    const provider: AIProvider = {
      id: "test-provider",
      supports: (taskType) => taskType === "moderate_chat",
      run: async () => ({ safe: false, flags: ["contextual_risk"], message: "Review context" }),
    };
    const gateway = new AIGateway({ providers: [provider] });

    const result = await runAsServerSide(() => proposeMessageModeration(gateway, "Please review this proposal"));

    expect(result.flags).toContain("contextual_risk");
    expect(result.recommendedAction).toBe("manual_review");
    expect(result.source).toBe("ai_assisted");
    expect(result.requiresHumanReview).toBe(true);
    expect(result.automaticEnforcement).toBe(false);
  });
});
