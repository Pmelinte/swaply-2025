import { describe, expect, it, vi } from "vitest";
import { AIGateway, type AIProvider } from "@/lib/ai/gateway";
import { redactAIInput } from "@/lib/ai/task-router";
import { defaultAIModelRegistry } from "@/lib/ai/model-registry";

async function runServer<T>(callback: () => Promise<T>) {
  const originalWindow = globalThis.window;
  vi.stubGlobal("window", undefined);
  try {
    return await callback();
  } finally {
    vi.stubGlobal("window", originalWindow);
  }
}

describe("E1.2 AI task router", () => {
  it("rejects invalid task input", async () => {
    const gateway = new AIGateway({ providers: [] });
    const result = await runServer(() => gateway.run({ taskType: "moderate_chat", input: {} }));
    expect(result.status).toBe("error");
    expect(result.errorCode).toBe("invalid_input");
  });

  it("rejects invalid provider output and uses non-AI fallback", async () => {
    const provider: AIProvider = {
      id: "huggingface",
      external: true,
      supports: () => true,
      run: async () => ({ invalid: true }),
    };
    const gateway = new AIGateway({ providers: [provider], registry: defaultAIModelRegistry });
    const result = await runServer(() =>
      gateway.run({ taskType: "classify_item", input: { titleHint: "phone" } }),
    );
    expect(result.status).toBe("non_ai_fallback");
    expect(result.attempts[0]?.status).toBe("invalid_output");
  });

  it("records timeout and falls back without cost", async () => {
    const provider: AIProvider = {
      id: "huggingface",
      external: true,
      supports: () => true,
      run: async (_request, context) =>
        new Promise((_, reject) =>
          context.signal.addEventListener("abort", () => reject(new Error("aborted"))),
        ),
    };
    const gateway = new AIGateway({ providers: [provider], timeoutMs: 5 });
    const result = await runServer(() =>
      gateway.run({ taskType: "moderate_chat", input: { text: "hello" } }),
    );
    expect(result.status).toBe("non_ai_fallback");
    expect(result.attempts[0]?.status).toBe("timeout");
    expect(result.estimatedCost).toBe(0);
  });

  it("removes direct identifiers and redacts PII before external provider execution", async () => {
    let received: unknown;
    const provider: AIProvider = {
      id: "huggingface",
      external: true,
      supports: (task) => task === "moderate_chat",
      run: async (request) => {
        received = request;
        return { safe: true, flags: [] };
      },
    };
    const gateway = new AIGateway({ providers: [provider] });
    await runServer(() =>
      gateway.run({
        taskType: "moderate_chat",
        input: { text: "mail me at test@example.com or +40 712 345 678" },
        userId: "private-user",
        inputHash: "private-hash",
      }),
    );
    expect(JSON.stringify(received)).not.toContain("private-user");
    expect(JSON.stringify(received)).not.toContain("private-hash");
    expect(JSON.stringify(received)).toContain("[email]");
    expect(JSON.stringify(received)).toContain("[phone]");
  });

  it("redacts nested values deterministically", () => {
    expect(redactAIInput({ profile: { email: "a@b.com" } })).toEqual({
      profile: { email: "[email]" },
    });
  });
});
