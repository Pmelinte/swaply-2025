import { afterEach, describe, expect, it, vi } from "vitest";
import { createServerAIGateway } from "@/lib/ai/server";

describe("server AI provider activation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("uses the non-AI fallback in production when paid AI is not authorised", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("HUGGINGFACE_API_KEY", "configured-test-key");
    vi.stubEnv("SWAPLY_ENABLE_PAID_AI_PRODUCTION", "");
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const result = await createServerAIGateway().run({
      taskType: "translate",
      input: { text: "hello" },
      sourceLocale: "en",
      targetLocale: "ro",
    });

    expect(result.status).toBe("non_ai_fallback");
    expect(result.provider).toBe("non-ai");
    expect(result.estimatedCost).toBe(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
