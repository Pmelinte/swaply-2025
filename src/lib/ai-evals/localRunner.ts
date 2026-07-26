import { AIGateway } from "@/lib/ai/gateway";

export interface AIEvalCase {
  name: string;
  taskType: "classify_item" | "moderate_chat";
  input: unknown;
  locale: string;
}

export interface AIEvalResult {
  name: string;
  schemaCorrect: boolean;
  fallbackCorrect: boolean;
  localeCovered: boolean;
  latencyMs: number;
  estimatedCost: number;
}

export async function runLocalAIEvals(cases: AIEvalCase[]): Promise<AIEvalResult[]> {
  const gateway = new AIGateway({ providers: [] });
  return Promise.all(cases.map(async (testCase) => {
    const result = await gateway.run({ taskType: testCase.taskType, input: testCase.input, locale: testCase.locale });
    return {
      name: testCase.name,
      schemaCorrect: result.output !== undefined,
      fallbackCorrect: result.status === "non_ai_fallback",
      localeCovered: Boolean(testCase.locale),
      latencyMs: result.latencyMs,
      estimatedCost: result.estimatedCost ?? 0,
    };
  }));
}
