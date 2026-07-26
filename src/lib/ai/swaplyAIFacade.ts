import { AIGateway, type AIGatewayResult } from "./gateway";
import type {
  ClassifyItemRequest,
  ClassifyItemResult,
  EstimateValueRequest,
  EstimateValueResult,
  GenerateItemDescriptionRequest,
  GenerateItemDescriptionResult,
  MatchExplanationRequest,
  MatchExplanationResult,
  TranslateTextRequest,
  TranslateTextResult,
} from "./contracts";
import {
  fallbackClassifyItem,
  fallbackEstimateValue,
  fallbackGenerateItemDescription,
  fallbackMatchExplanation,
  fallbackTranslateText,
} from "./fallbacks";
import { buildSafeAITaskMetadata, type SafeAITaskMetadata } from "./safeTaskMetadata";

export interface SwaplyAIFacadeOptions {
  gateway: AIGateway;
  onSafeMetadata?: (metadata: SafeAITaskMetadata) => void | Promise<void>;
}

export class SwaplyAIFacade {
  private readonly gateway: AIGateway;
  private readonly onSafeMetadata?: (metadata: SafeAITaskMetadata) => void | Promise<void>;

  constructor(options: SwaplyAIFacadeOptions) {
    this.gateway = options.gateway;
    this.onSafeMetadata = options.onSafeMetadata;
  }

  async classifyItem(request: ClassifyItemRequest): Promise<ClassifyItemResult> {
    await this.logSafeMetadata("classify_item", request, request.locale);
    const result = await this.gateway.run<ClassifyItemRequest, ClassifyItemResult>({
      taskType: "classify_item",
      input: request,
      locale: request.locale,
    });

    return result.output && isProviderSuccess(result) ? result.output : fallbackClassifyItem(request);
  }

  async generateItemDescription(
    request: GenerateItemDescriptionRequest,
  ): Promise<GenerateItemDescriptionResult> {
    await this.logSafeMetadata("generate_item_description", request, request.locale);
    const result = await this.gateway.run<GenerateItemDescriptionRequest, GenerateItemDescriptionResult>({
      taskType: "generate_item_description",
      input: request,
      locale: request.locale,
    });

    return result.output && isProviderSuccess(result) ? result.output : fallbackGenerateItemDescription(request);
  }

  async estimateValue(request: EstimateValueRequest): Promise<EstimateValueResult> {
    await this.logSafeMetadata("estimate_value", request, null);
    const result = await this.gateway.run<EstimateValueRequest, EstimateValueResult>({
      taskType: "estimate_value",
      input: request,
    });

    return result.output && isProviderSuccess(result) ? result.output : fallbackEstimateValue(request);
  }

  async translateText(request: TranslateTextRequest): Promise<TranslateTextResult> {
    await this.logSafeMetadata("translate", request, null, request.sourceLocale, request.targetLocale);
    const result = await this.gateway.run<TranslateTextRequest, TranslateTextResult>({
      taskType: "translate",
      input: request,
      sourceLocale: request.sourceLocale,
      targetLocale: request.targetLocale,
    });

    return result.output && isProviderSuccess(result) ? result.output : fallbackTranslateText(request);
  }

  async explainMatch(request: MatchExplanationRequest): Promise<MatchExplanationResult> {
    await this.logSafeMetadata("match", request, request.locale);
    const result = await this.gateway.run<MatchExplanationRequest, MatchExplanationResult>({
      taskType: "match",
      input: request,
      locale: request.locale,
    });

    return result.output && isProviderSuccess(result) ? result.output : fallbackMatchExplanation(request);
  }

  private async logSafeMetadata(
    taskType: SafeAITaskMetadata["taskType"],
    input: unknown,
    locale?: string | null,
    sourceLocale?: string | null,
    targetLocale?: string | null,
  ) {
    if (!this.onSafeMetadata) return;

    await this.onSafeMetadata(
      buildSafeAITaskMetadata({
        taskType,
        input,
        locale,
        sourceLocale,
        targetLocale,
      }),
    );
  }
}

export function createFallbackOnlySwaplyAIFacade(options?: {
  onSafeMetadata?: (metadata: SafeAITaskMetadata) => void | Promise<void>;
}) {
  return new SwaplyAIFacade({
    gateway: new AIGateway({ providers: [] }),
    onSafeMetadata: options?.onSafeMetadata,
  });
}

function isProviderSuccess(result: AIGatewayResult) {
  return result.status === "ok" || result.status === "provider_fallback";
}
