import type { AIGatewayLogEvent, AIRequestStatus } from "./gateway";
import type { AITaskType } from "./taskTypes";

export interface AIObservabilityEvent {
  taskType: AITaskType;
  provider: string;
  model: string | null;
  status: AIRequestStatus;
  latencyMs: number;
  estimatedCost: number;
  locale: string | null;
  sourceLocale: string | null;
  targetLocale: string | null;
  errorCode: string | null;
  promptVersion: string;
  fallback: boolean;
  cacheHit: boolean;
  recordedAt: string;
}

export interface AIObservabilitySummary {
  total: number;
  successful: number;
  failed: number;
  fallbacks: number;
  timeouts: number;
  cacheHits: number;
  totalEstimatedCost: number;
  averageLatencyMs: number;
  byTask: Partial<Record<AITaskType, number>>;
  byProvider: Record<string, number>;
  byStatus: Partial<Record<AIRequestStatus, number>>;
}

export interface AIObservabilityCollectorOptions {
  now?: () => Date;
  maxEvents?: number;
}

export class AIObservabilityCollector {
  private readonly now: () => Date;
  private readonly maxEvents: number;
  private readonly events: AIObservabilityEvent[] = [];

  constructor(options: AIObservabilityCollectorOptions = {}) {
    this.now = options.now ?? (() => new Date());
    this.maxEvents = Math.max(1, options.maxEvents ?? 1_000);
  }

  record(event: AIGatewayLogEvent): AIObservabilityEvent {
    const normalized = normalizeAIObservabilityEvent(event, this.now());
    this.events.push(normalized);
    if (this.events.length > this.maxEvents) {
      this.events.splice(0, this.events.length - this.maxEvents);
    }
    return normalized;
  }

  list(): readonly AIObservabilityEvent[] {
    return this.events.map((event) => ({ ...event }));
  }

  clear(): void {
    this.events.length = 0;
  }

  summary(): AIObservabilitySummary {
    return summarizeAIObservability(this.events);
  }
}

export function normalizeAIObservabilityEvent(
  event: AIGatewayLogEvent,
  recordedAt = new Date(),
): AIObservabilityEvent {
  return {
    taskType: event.taskType,
    provider: sanitizeDimension(event.provider, "unknown"),
    model: sanitizeNullableDimension(event.model),
    status: event.status,
    latencyMs: normalizeNonNegative(event.latencyMs),
    estimatedCost: normalizeNonNegative(event.estimatedCost ?? 0),
    locale: sanitizeNullableDimension(event.locale),
    sourceLocale: sanitizeNullableDimension(event.sourceLocale),
    targetLocale: sanitizeNullableDimension(event.targetLocale),
    errorCode: sanitizeNullableDimension(event.errorCode),
    promptVersion: sanitizeDimension(event.promptVersion, "unknown"),
    fallback: event.status === "provider_fallback" || event.status === "non_ai_fallback",
    cacheHit: event.cacheHit === true,
    recordedAt: recordedAt.toISOString(),
  };
}

export function summarizeAIObservability(
  events: readonly AIObservabilityEvent[],
): AIObservabilitySummary {
  const summary: AIObservabilitySummary = {
    total: events.length,
    successful: 0,
    failed: 0,
    fallbacks: 0,
    timeouts: 0,
    cacheHits: 0,
    totalEstimatedCost: 0,
    averageLatencyMs: 0,
    byTask: {},
    byProvider: {},
    byStatus: {},
  };

  let totalLatency = 0;
  for (const event of events) {
    if (event.status === "ok" || event.status === "provider_fallback" || event.status === "non_ai_fallback") {
      summary.successful += 1;
    } else {
      summary.failed += 1;
    }
    if (event.fallback) summary.fallbacks += 1;
    if (event.status === "timeout") summary.timeouts += 1;
    if (event.cacheHit) summary.cacheHits += 1;

    summary.totalEstimatedCost += event.estimatedCost;
    totalLatency += event.latencyMs;
    summary.byTask[event.taskType] = (summary.byTask[event.taskType] ?? 0) + 1;
    summary.byProvider[event.provider] = (summary.byProvider[event.provider] ?? 0) + 1;
    summary.byStatus[event.status] = (summary.byStatus[event.status] ?? 0) + 1;
  }

  summary.totalEstimatedCost = round(summary.totalEstimatedCost, 8);
  summary.averageLatencyMs = events.length ? round(totalLatency / events.length, 2) : 0;
  return summary;
}

function normalizeNonNegative(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function sanitizeNullableDimension(value: string | null | undefined): string | null {
  if (value == null) return null;
  const sanitized = sanitizeDimension(value, "");
  return sanitized || null;
}

function sanitizeDimension(value: string, fallback: string): string {
  const trimmed = value.trim().slice(0, 120);
  if (!trimmed) return fallback;
  return trimmed
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "[redacted]")
    .replace(/\+?\d[\d\s().-]{8,}\d/g, "[redacted]");
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
