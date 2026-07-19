import { describe, expect, it, vi } from "vitest";
import { AIGateway, type AIProvider } from "@/lib/ai/gateway";
import { createFallbackOnlySwaplyAIFacade, SwaplyAIFacade } from "@/lib/ai/swaplyAIFacade";

async function runAsServerSide<T>(callback: () => Promise<T>) {
  const originalWindow = globalThis.window;
  vi.stubGlobal("window", undefined);

  try {
    return await callback();
  } finally {
    vi.stubGlobal("window", originalWindow);
  }
}

describe("Swaply AI facade", () => {
  it("returns safe fallbacks when no providers are configured", async () => {
    const metadataEvents: unknown[] = [];
    const facade = createFallbackOnlySwaplyAIFacade({
      onSafeMetadata: (metadata) => {
        metadataEvents.push(metadata);
      },
    });

    const result = await runAsServerSide(() =>
      facade.classifyItem({
        titleHint: "Vintage lamp",
        images: [{ url: "https://example.com/private-lamp.jpg" }],
        locale: "en",
      }),
    );

    expect(result.source).toBe("fallback");
    expect(result.category).toBe("objects");
    expect(metadataEvents).toHaveLength(1);
    expect(JSON.stringify(metadataEvents[0])).not.toContain("private-lamp.jpg");
  });

  it("returns provider output when a provider supports the task", async () => {
    const provider: AIProvider = {
      id: "test-provider",
      model: "test-model",
      supports: (taskType) => taskType === "translate",
      run: async () => ({ text: "salut", source: "ai" as const }),
    };

    const facade = new SwaplyAIFacade({
      gateway: new AIGateway({ providers: [provider] }),
    });

    const result = await runAsServerSide(() =>
      facade.translateText({
        text: "hello",
        sourceLocale: "en",
        targetLocale: "ro",
      }),
    );

    expect(result).toEqual({ text: "salut", source: "ai" });
  });

  it("falls back when the provider fails", async () => {
    const provider: AIProvider = {
      id: "failing-provider",
      supports: (taskType) => taskType === "estimate_value",
      run: async () => {
        throw new Error("provider unavailable");
      },
    };

    const facade = new SwaplyAIFacade({
      gateway: new AIGateway({ providers: [provider] }),
    });

    const result = await runAsServerSide(() =>
      facade.estimateValue({ title: "Old phone", currency: "EUR" }),
    );

    expect(result.source).toBe("fallback");
    expect(result.amount).toBeNull();
    expect(result.currency).toBe("EUR");
  });
});
