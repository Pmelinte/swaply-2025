import { describe, expect, it } from "vitest";
import { AIGateway, type AIProvider } from "@/lib/ai/gateway";
import { AIObservabilityCollector, normalizeAIObservabilityEvent } from "@/lib/ai/observability";

describe("E1.3 AI observability", () => {
  it("records only metadata and never raw input or identifiers", async () => {
    const collector = new AIObservabilityCollector({ now: () => new Date("2026-07-26T12:00:00.000Z") });
    const provider: AIProvider = {
      id: "huggingface",
      model: "safe-model",
      external: true,
      supports: () => true,
      run: async () => ({ safe: true, flags: [] }),
    };
    const gateway = new AIGateway({
      providers: [provider],
      onLog: (event) => {
        collector.record(event);
      },
    });

    await gateway.run({
      taskType: "moderate_chat",
      input: { text: "secret test@example.com" },
      userId: "private-user",
      inputHash: "private-hash",
      locale: "ro",
    });

    const serialized = JSON.stringify(collector.list());
    expect(serialized).not.toContain("secret");
    expect(serialized).not.toContain("test@example.com");
    expect(serialized).not.toContain("private-user");
    expect(serialized).not.toContain("private-hash");
    expect(collector.list()[0]).toMatchObject({ taskType: "moderate_chat", provider: "huggingface", status: "ok", locale: "ro" });
  });

  it("sanitizes accidental PII in dimensions", () => {
    const event = normalizeAIObservabilityEvent({
      taskType: "classify_item",
      provider: "owner@example.com",
      model: "+40 712 345 678",
      status: "error",
      latencyMs: -1,
      estimatedCost: -2,
      attemptCount: 0,
      promptVersion: "v1",
    });
    expect(event.provider).toBe("[redacted]");
    expect(event.model).toBe("[redacted]");
    expect(event.latencyMs).toBe(0);
    expect(event.estimatedCost).toBe(0);
  });

  it("aggregates success, fallback, timeout, latency and cost", () => {
    const collector = new AIObservabilityCollector();
    collector.record({ taskType: "classify_item", provider: "hf", status: "ok", latencyMs: 100, estimatedCost: 0.01, cacheHit: true, attemptCount: 0, promptVersion: "v1" });
    collector.record({ taskType: "classify_item", provider: "non-ai", status: "non_ai_fallback", latencyMs: 300, estimatedCost: 0, cacheHit: false, attemptCount: 1, promptVersion: "v1" });
    collector.record({ taskType: "moderate_chat", provider: "none", status: "timeout", latencyMs: 500, estimatedCost: 0, cacheHit: false, attemptCount: 1, promptVersion: "v1" });

    expect(collector.summary()).toMatchObject({
      total: 3,
      successful: 2,
      failed: 1,
      fallbacks: 1,
      timeouts: 1,
      cacheHits: 1,
      totalEstimatedCost: 0.01,
      averageLatencyMs: 300,
    });
  });

  it("enforces bounded in-memory retention", () => {
    const collector = new AIObservabilityCollector({ maxEvents: 2 });
    for (let index = 0; index < 3; index += 1) {
      collector.record({ taskType: "classify_item", provider: `p${index}`, status: "ok", latencyMs: index, attemptCount: 0, promptVersion: "v1" });
    }
    expect(collector.list()).toHaveLength(2);
    expect(collector.list()[0]?.provider).toBe("p1");
  });
});
