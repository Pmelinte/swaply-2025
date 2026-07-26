import type { AITaskType } from "./taskTypes";
import type { AIModelRegistryEntry } from "./model-registry";
import { getAITaskDefinition, redactAIInput } from "./task-router";

export type AIRequestStatus = "ok" | "provider_fallback" | "non_ai_fallback" | "error" | "timeout";

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

export interface AIProviderAttempt {
  provider: string;
  status: "error" | "timeout" | "invalid_output";
  latencyMs: number;
  errorCode: string;
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
  attempts: AIProviderAttempt[];
  promptVersion: string;
}

export interface AIProviderRunContext { signal: AbortSignal; }

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
  errorCode?: string | null;
  promptVersion: string;
}

export interface AIGatewayOptions {
  providers: AIProvider[];
  registry?: AIModelRegistryEntry[];
  timeoutMs?: number;
  onLog?: (event: AIGatewayLogEvent) => void | Promise<void>;
}

export class AIGateway {
  private readonly providers: AIProvider[];
  private readonly registry?: AIModelRegistryEntry[];
  private readonly timeoutMs?: number;
  private readonly onLog?: (event: AIGatewayLogEvent) => void | Promise<void>;

  constructor(options: AIGatewayOptions) {
    this.providers = options.providers;
    this.registry = options.registry;
    this.timeoutMs = options.timeoutMs;
    this.onLog = options.onLog;
  }

  async run<TInput = unknown, TOutput = unknown>(request: AIGatewayInput<TInput>): Promise<AIGatewayResult<TOutput>> {
    if (typeof window !== "undefined" && process.env.NODE_ENV !== "test") {
      throw new Error("AIGateway must run server-side only. Do not call AI providers from client components.");
    }

    const totalStarted = Date.now();
    const task = getAITaskDefinition(request.taskType);
    const promptVersion = request.promptVersion ?? task.promptVersion;
    const parsedInput = task.inputSchema.safeParse(request.input);
    if (!parsedInput.success) {
      return this.finish(request, { status: "error", provider: "none", errorCode: "invalid_input", latencyMs: Date.now() - totalStarted, attempts: [], promptVersion });
    }

    if (!task.enabled) {
      return this.nonAIFallback<TOutput>(request, task.fallback(parsedInput.data), "task_disabled", totalStarted, promptVersion, []);
    }

    const safeRequest: AIGatewayInput = {
      taskType: request.taskType,
      input: task.privacyPolicy === "redact_pii" ? redactAIInput(parsedInput.data) : parsedInput.data,
      locale: request.locale,
      sourceLocale: request.sourceLocale,
      targetLocale: request.targetLocale,
      promptVersion,
    };

    const candidates = this.orderedProviders(request.taskType, task.providerPolicy);
    const attempts: AIProviderAttempt[] = [];
    const timeoutMs = this.timeoutMs ?? task.timeoutMs;

    for (const [index, provider] of candidates.entries()) {
      const started = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const rawOutput = await provider.run(safeRequest, { signal: controller.signal });
        const parsedOutput = task.outputSchema.safeParse(rawOutput);
        if (!parsedOutput.success) {
          attempts.push({ provider: provider.id, status: "invalid_output", latencyMs: Date.now() - started, errorCode: "invalid_output" });
          continue;
        }
        return this.finish(request, {
          status: index === 0 ? "ok" : "provider_fallback",
          provider: provider.id,
          model: provider.model,
          output: parsedOutput.data as TOutput,
          latencyMs: Date.now() - totalStarted,
          estimatedCost: provider.estimateCost?.(safeRequest) ?? null,
          cacheHit: false,
          attempts,
          promptVersion,
        });
      } catch (error) {
        const timedOut = controller.signal.aborted;
        attempts.push({ provider: provider.id, status: timedOut ? "timeout" : "error", latencyMs: Date.now() - started, errorCode: timedOut ? "timeout" : errorToCode(error) });
      } finally {
        clearTimeout(timeout);
      }
    }

    return this.nonAIFallback<TOutput>(request, task.fallback(parsedInput.data), candidates.length ? "providers_failed" : "no_provider", totalStarted, promptVersion, attempts);
  }

  private orderedProviders(taskType: AITaskType, policy: string[]): AIProvider[] {
    const supported = this.providers.filter((provider) => provider.supports(taskType));
    const registryOrder = (this.registry ?? [])
      .filter((entry) => entry.enabled && entry.taskTypes.includes(taskType))
      .sort((a, b) => a.priority - b.priority)
      .map((entry) => entry.provider);
    const order = registryOrder.length ? registryOrder : policy;
    if (!order.length) return supported;
    return supported.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }

  private nonAIFallback<TOutput>(request: AIGatewayInput, output: unknown, errorCode: string, totalStarted: number, promptVersion: string, attempts: AIProviderAttempt[]) {
    const task = getAITaskDefinition(request.taskType);
    const parsed = task.outputSchema.safeParse(output);
    return this.finish<TOutput>(request, {
      status: "non_ai_fallback",
      provider: "non-ai",
      output: (parsed.success ? parsed.data : output) as TOutput,
      errorCode,
      latencyMs: Date.now() - totalStarted,
      estimatedCost: 0,
      cacheHit: false,
      attempts,
      promptVersion,
    });
  }

  private async finish<TOutput>(request: AIGatewayInput, result: Omit<AIGatewayResult<TOutput>, "taskType">): Promise<AIGatewayResult<TOutput>> {
    const complete = { ...result, taskType: request.taskType };
    if (this.onLog) {
      await this.onLog({ taskType: request.taskType, provider: complete.provider, model: complete.model, status: complete.status, latencyMs: complete.latencyMs, estimatedCost: complete.estimatedCost, locale: request.locale, sourceLocale: request.sourceLocale, targetLocale: request.targetLocale, errorCode: complete.errorCode, promptVersion: complete.promptVersion });
    }
    return complete;
  }
}

function errorToCode(error: unknown): string {
  return error instanceof Error ? error.name || "provider_error" : "provider_error";
}
