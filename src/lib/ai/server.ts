import { AIGateway, type AIProvider } from "./gateway";
import { defaultAIModelRegistry } from "./model-registry";
import { createHuggingFaceProvider } from "./providers";

export function createServerAIGateway() {
  const paidAiAuthorised =
    process.env.SWAPLY_ENABLE_PAID_AI_PRODUCTION === "true";
  const huggingFaceKey =
    process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_TOKEN;

  const providers: AIProvider[] = [];
  if (paidAiAuthorised && huggingFaceKey) {
    providers.push(createHuggingFaceProvider(huggingFaceKey));
  }

  return new AIGateway({
    providers,
    registry: defaultAIModelRegistry,
    onLog: (event) => {
      console.info(
        "[ai-gateway]",
        JSON.stringify({
          taskType: event.taskType,
          provider: event.provider,
          model: event.model,
          status: event.status,
          latencyMs: event.latencyMs,
          estimatedCost: event.estimatedCost,
          errorCode: event.errorCode,
          promptVersion: event.promptVersion,
        }),
      );
    },
  });
}
