/**
 * Structured logging utility.
 * Uses Pino-compatible JSON format for production observability.
 * Falls back to console in development for readability.
 */

type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

interface LogEntry {
  level: LogLevel;
  msg: string;
  timestamp: string;
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

const MIN_LEVEL = (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === "production" ? "info" : "debug");

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL];
}

function formatEntry(level: LogLevel, msg: string, data?: Record<string, unknown>): LogEntry {
  return {
    level,
    msg,
    timestamp: new Date().toISOString(),
    pid: typeof process !== "undefined" ? process.pid : 0,
    ...data,
  };
}

function emit(entry: LogEntry): void {
  const json = JSON.stringify(entry);

  if (process.env.NODE_ENV === "production") {
    // Structured JSON to stdout/stderr for log aggregation
    if (LOG_LEVELS[entry.level] >= LOG_LEVELS.error) {
      process.stderr?.write?.(json + "\n");
    } else {
      process.stdout?.write?.(json + "\n");
    }
    return;
  }

  // Development: human-readable console output
  const prefix = `[${entry.level.toUpperCase()}]`;
  const { level: _l, msg, timestamp: _t, pid: _p, ...rest } = entry;
  const extra = Object.keys(rest).length > 0 ? rest : "";

  switch (entry.level) {
    case "error":
    case "fatal":
      console.error(prefix, msg, extra);
      break;
    case "warn":
      console.warn(prefix, msg, extra);
      break;
    case "debug":
    case "trace":
      console.debug(prefix, msg, extra);
      break;
    default:
      console.log(prefix, msg, extra);
  }
}

function createLogFn(level: LogLevel) {
  return (msg: string, data?: Record<string, unknown>) => {
    if (!shouldLog(level)) return;
    emit(formatEntry(level, msg, data));
  };
}

export const logger = {
  trace: createLogFn("trace"),
  debug: createLogFn("debug"),
  info: createLogFn("info"),
  warn: createLogFn("warn"),
  error: createLogFn("error"),
  fatal: createLogFn("fatal"),

  /** Create a child logger with persistent context fields */
  child(context: Record<string, unknown>) {
    const childLog = (level: LogLevel) => (msg: string, data?: Record<string, unknown>) => {
      if (!shouldLog(level)) return;
      emit(formatEntry(level, msg, { ...context, ...data }));
    };
    return {
      trace: childLog("trace"),
      debug: childLog("debug"),
      info: childLog("info"),
      warn: childLog("warn"),
      error: childLog("error"),
      fatal: childLog("fatal"),
    };
  },
};

/**
 * Request-scoped logger factory for API routes.
 * Automatically includes request ID, method, path, IP.
 */
export function requestLogger(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const url = new URL(request.url);
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

  return logger.child({
    requestId,
    method: request.method,
    path: url.pathname,
    ip,
  });
}

/**
 * Error tracking utility.
 * In production, sends errors to an external service (Sentry-like).
 * In development, logs to console with full stack trace.
 */
export function captureError(error: unknown, context?: Record<string, unknown>): void {
  const err = error instanceof Error ? error : new Error(String(error));

  logger.error(err.message, {
    stack: err.stack,
    name: err.name,
    ...context,
  });

  // In production, this would send to Sentry/Datadog/etc.
  // if (process.env.SENTRY_DSN) {
  //   Sentry.captureException(err, { extra: context });
  // }
}
