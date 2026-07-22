import { afterEach, describe, expect, it, vi } from "vitest";
import { AIGateway } from "@/lib/ai/gateway";
import { createDeterministicFallbackProvider } from "@/lib/ai/providers";
import { AI_TASK_TYPES } from "@/lib/ai/taskTypes";

describe("Product memory Prompt 15 AI gateway providers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });
  it("defines the full required task taxonomy", () => {
    expect(AI_TASK_TYPES).toEqual([
      "classify_item",
      "search_by_photo",
      "generate_item_description",
      "estimate_value",
      "translate",
      "match",
      "moderate_chat",
      "summarize_chat",
      "story_assist",
      "blog_assist",
      "global_first_audit",
    ]);
  });

  it("routes classification through a provider with schema-validated fallback output", async () => {
    vi.stubGlobal("window", undefined);
    const gateway = new AIGateway({ providers: [createDeterministicFallbackProvider()] });

    const result = await gateway.run({
      taskType: "classify_item",
      input: { titleHint: "Vintage laptop bag", descriptionHint: "portable leather accessories" },
    });

    expect(result.status).toBe("ok");
    expect(result.provider).toBe("deterministic-fallback");
    expect(result.output).toMatchObject({ source: "fallback" });
    expect((result.output as { tags: string[] }).tags).toContain("laptop");
  });

  it("routes moderation through a provider without exposing client-side keys", async () => {
    vi.stubGlobal("window", undefined);
    const gateway = new AIGateway({ providers: [createDeterministicFallbackProvider()] });

    const result = await gateway.run({ taskType: "moderate_chat", input: { text: "email me at x@example.com" } });

    expect(result.status).toBe("ok");
    expect(result.output).toEqual({
      safe: false,
      flags: ["date_personale"],
      message: "Mesaj blocat: date_personale",
    });
  });
});
