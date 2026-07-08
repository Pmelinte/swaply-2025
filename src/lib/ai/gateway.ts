import type { AITaskType } from "./taskTypes";

export type AIRequestStatus = "ok" | "fallback" | "error" | "timeout";

export interface AIGatewayInput<TInput = unknown> {
  taskType: AITaskType;
  input: TInput;
  locale?: string | null;
  sourceLocale?: string | null;
  targetLocale?: string | null;
  userId?: string | null;
  inputHash?: string | null;
  promptVersion?: string | null;
}

export interface AIGatewayResult<TOutput = unknown> {
  status: AIRequestStatus;
  taskType: AITaskType;
  provider: string;
  model?: string | null;
  output?: TOutput;
  errorCode?: string | null;
  latencyMs: number;
  estimatedCost?: number | null;
  cacheHit?: boolean;
}

export interface AIProviderRunContext {
  signal: AbortSignal;
}

export interface AIProvider<TInput = unknown, TOutput = unknown> {
  id: string;
  model?: string | null;
  supports: (taskType: AITaskType) => boolean;
  run: (request: AIGatewayInput<TInput>, context: AIProviderRunContext) => Promise<TOutput>;
  estimateCost?: (request: AIGatewayInput<TInput>) => number | null;
}

export interface AIGatewayLogEvent {
  taskType: AITaskType;
  provider: string;
  model?: string | null;
  status: AIRequestStatus;
  latencyMs: number;
  estimatedCost?: number | null;
  locale?: string | null;
  sourceLocale?: string | null;
  targetLocale?: string | null;
  userId?: string | null;
  errorCode?: string | null;
}

export interface AIGatewayOptions {
  providers: AIProvider[];
  timeoutMs?: number;
  onLog?: (event: AIGatewayLogEvent) => void | Promise<void>;
}

export class AIGateway {
  private readonly providers: AIProvider[];
  private readonly timeoutMs: number;
  private readonly onLog?: (event: AIGatewayLogEvent) => void | Promise<void>;

  constructor(options: AIGatewayOptions) {
    this.providers = options.providers;
    this.timeoutMs = options.timeoutMs ?? 12_000;
    this.onLog = options.onLog;
  }

  async run<TInput = unknown, TOutput = unknown>(
    request: AIGatewayInput<TInput>,
  ): Promise<AIGatewayResult<TOutput>> {
    if (typeof window !== "undefined") {
      throw new Error("AIGateway must run server-side only. Do not call AI providers from client components.");
    }

    const candidates = this.providers.filter((provider) => provider.supports(request.taskType));
    if (candidates.length === 0) {
      return this.buildErrorResult<TOutput>(request, "none", "no_provider", 0);
    }

    let lastErrorCode: string | null = null;

    for (const [index, provider] of candidates.entries()) {
      const started = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const output = await provider.run(request, { signal: controller.signal });
        const latencyMs = Date.now() - started;
        const result: AIGatewayResult<TOutput> = {
          status: index === 0 ? "ok" : "fallback",
          taskType: request.taskType,
          provider: provider.id,
          model: provider.model,
          output: output as TOutput,
          latencyMs,
          estimatedCost: provider.estimateCost?.(request) ?? null,
          cacheHit: false,
        };
        await this.log(request, result);
        return result;
      } catch (error) {
        const latencyMs = Date.now() - started;
        lastErrorCode = controller.signal.aborted ? "timeout" : errorToCode(error);
        await this.log(request, {
          status: controller.signal.aborted ? "timeout" : "error",
          taskType: request.taskType,
          provider: provider.id,
          model: provider.model,
          latencyMs,
          errorCode: lastErrorCode,
          estimatedCost: provider.estimateCost?.(request) ?? null,
          cacheHit: false,
        });
      } finally {
        clearTimeout(timeout);
      }
    }

    return this.buildErrorResult<TOutput>(
      request,
      candidates.at(-1)?.id ?? "none",
      lastErrorCode ?? "provider_failed",
      0,
    );
  }

  private async log<TOutput>(request: AIGatewayInput, result: AIGatewayResult<TOutput>) {
    if (!this.onLog) return;
    await this.onLog({
      taskType: request.taskType,
      provider: result.provider,
      model: result.model,
      status: result.status,
      latencyMs: result.latencyMs,
      estimatedCost: result.estimatedCost,
      locale: request.locale,
      sourceLocale: request.sourceLocale,
      targetLocale: request.targetLocale,
      userId: request.userId,
      errorCode: result.errorCode,
    });
  }

  private async buildErrorResult<TOutput = unknown>(
    request: AIGatewayInput,
    provider: string,
    errorCode: string,
    latencyMs: number,
  ): Promise<AIGatewayResult<TOutput>> {
    const result: AIGatewayResult<TOutput> = {
      status: "error",
      taskType: request.taskType,
      provider,
      errorCode,
      latencyMs,
      cacheHit: false,
    };
    await this.log(request, result);
    return result;
  }
}

function errorToCode(error: unknown): string {
  if (error instanceof Error) {
    return error.name || "provider_error";
  }
  return "provider_error";
}
