import { AIGateway } from "./gateway";
import { createDeterministicFallbackProvider, createHuggingFaceProvider } from "./providers";

export function createServerAIGateway() {
  return new AIGateway({
    providers: [
      createHuggingFaceProvider(process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_TOKEN),
      createDeterministicFallbackProvider(),
    ],
    timeoutMs: 12_000,
    onLog: (event) => {
      console.info("[ai-gateway]", JSON.stringify({
        taskType: event.taskType,
        provider: event.provider,
        model: event.model,
        status: event.status,
        latencyMs: event.latencyMs,
        estimatedCost: event.estimatedCost,
        errorCode: event.errorCode,
      }));
    },
  });
}
