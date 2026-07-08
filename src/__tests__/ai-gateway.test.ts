import { describe, expect, it, vi } from "vitest";
import { AIGateway, type AIProvider } from "@/lib/ai/gateway";
import { AI_TASK_TYPES } from "@/lib/ai/taskTypes";
import { selectModelsForTask } from "@/lib/ai/model-registry";

async function runAsServerSide<T>(callback: () => Promise<T>) {
  const originalWindow = globalThis.window;
  vi.stubGlobal("window", undefined);

  try {
    return await callback();
  } finally {
    vi.stubGlobal("window", originalWindow);
  }
}

describe("AI gateway foundation", () => {
  it("defines the Swaply task types from the product memory", () => {
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

  it("falls back to the next provider when the primary provider fails", async () => {
    const primary: AIProvider = {
      id: "primary",
      supports: (taskType) => taskType === "translate",
      run: async () => {
        throw new Error("primary failed");
      },
    };

    const fallback: AIProvider = {
      id: "fallback",
      model: "fallback-model",
      supports: (taskType) => taskType === "translate",
      run: async () => ({ text: "bonjour" }),
    };

    const events: string[] = [];
    const gateway = new AIGateway({
      providers: [primary, fallback],
      onLog: (event) => {
        events.push(`${event.provider}:${event.status}`);
      },
    });

    const result = await runAsServerSide(() =>
      gateway.run({
        taskType: "translate",
        input: { text: "hello" },
        sourceLocale: "en",
        targetLocale: "fr",
      }),
    );

    expect(result.status).toBe("fallback");
    expect(result.provider).toBe("fallback");
    expect(result.output).toEqual({ text: "bonjour" });
    expect(events).toEqual(["primary:error", "fallback:fallback"]);
  });

  it("returns an error when no provider supports the task", async () => {
    const provider: AIProvider = {
      id: "unsupported",
      supports: () => false,
      run: async () => ({ ok: true }),
    };

    const gateway = new AIGateway({ providers: [provider] });
    const result = await runAsServerSide(() => gateway.run({ taskType: "match", input: {} }));

    expect(result.status).toBe("error");
    expect(result.errorCode).toBe("no_provider");
  });

  it("selects enabled model registry entries by priority", () => {
    const models = selectModelsForTask(
      [
        { provider: "b", model: "slow", taskTypes: ["translate"], priority: 20, enabled: true },
        { provider: "a", model: "fast", taskTypes: ["translate"], priority: 10, enabled: true },
        { provider: "c", model: "disabled", taskTypes: ["translate"], priority: 1, enabled: false },
      ],
      "translate",
    );

    expect(models.map((entry) => entry.model)).toEqual(["fast", "slow"]);
  });
});
