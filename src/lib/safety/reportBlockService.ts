import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  SafetyEvidenceInput,
  SafetyReportAction,
  SafetyReportReason,
  SafetyReportStatus,
  SafetyReportTargetType,
} from "./reportBlockPolicy";
import { isSafetyReportStatus } from "./reportBlockPolicy";

export type SafetyFailure = {
  code?: string;
  message: string;
  details?: string | null;
};

type CommandResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: SafetyFailure };

export type SubmitSafetyReportInput = {
  targetType: SafetyReportTargetType;
  targetId: string;
  reason: SafetyReportReason;
  description: string;
  evidence?: SafetyEvidenceInput[];
  idempotencyKey: string;
};

export type SafetyReportPayload = {
  report: Record<string, unknown>;
  replayed: boolean;
  idempotency_key: string;
};

export type SetUserBlockInput = {
  targetUserId: string;
  blocked: boolean;
  idempotencyKey: string;
};

export type UserBlockPayload = {
  target_user_id: string;
  blocked: boolean;
  block: Record<string, unknown> | null;
  refused_interest_count: number;
  replayed: boolean;
  idempotency_key: string;
};

export type ResolveSafetyReportInput = {
  reportId: string;
  expectedStatus: Extract<SafetyReportStatus, "open" | "investigating">;
  action: SafetyReportAction;
  notes: string;
  idempotencyKey: string;
};

export type ResolveSafetyReportPayload = {
  report: Record<string, unknown>;
  replayed: boolean;
  idempotency_key: string;
  effect_applied: boolean;
  report_counted: boolean;
  affected_user_id: string | null;
  affected_item_id: string | null;
};

function failure(error: {
  code?: string;
  message: string;
  details?: string | null;
}): { ok: false; error: SafetyFailure } {
  return {
    ok: false,
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function submitSafetyReport(
  supabase: SupabaseClient,
  input: SubmitSafetyReportInput,
): Promise<CommandResult<SafetyReportPayload>> {
  const { data, error } = await supabase.rpc("submit_safety_report_v1", {
    p_target_type: input.targetType,
    p_target_id: input.targetId,
    p_reason: input.reason,
    p_description: input.description.trim(),
    p_evidence: (input.evidence ?? []).map((entry) => ({
      evidence_type: entry.evidenceType,
      content: entry.content.trim(),
    })),
    p_idempotency_key: input.idempotencyKey.trim(),
  });

  if (error) return failure(error);

  const payload = data as Partial<SafetyReportPayload> | null;
  if (
    !payload ||
    !isRecord(payload.report) ||
    typeof payload.replayed !== "boolean" ||
    typeof payload.idempotency_key !== "string" ||
    !isSafetyReportStatus(payload.report.status)
  ) {
    return failure({ message: "Invalid safety report response" });
  }

  return { ok: true, data: payload as SafetyReportPayload };
}

export async function setUserBlock(
  supabase: SupabaseClient,
  input: SetUserBlockInput,
): Promise<CommandResult<UserBlockPayload>> {
  const { data, error } = await supabase.rpc("set_user_block_v1", {
    p_target_user_id: input.targetUserId,
    p_blocked: input.blocked,
    p_idempotency_key: input.idempotencyKey.trim(),
  });

  if (error) return failure(error);

  const payload = data as Partial<UserBlockPayload> | null;
  if (
    !payload ||
    typeof payload.target_user_id !== "string" ||
    payload.target_user_id !== input.targetUserId ||
    typeof payload.blocked !== "boolean" ||
    typeof payload.refused_interest_count !== "number" ||
    typeof payload.replayed !== "boolean" ||
    typeof payload.idempotency_key !== "string" ||
    !(payload.block === null || isRecord(payload.block))
  ) {
    return failure({ message: "Invalid block response" });
  }

  return { ok: true, data: payload as UserBlockPayload };
}

export async function resolveSafetyReport(
  supabase: SupabaseClient,
  input: ResolveSafetyReportInput,
): Promise<CommandResult<ResolveSafetyReportPayload>> {
  const { data, error } = await supabase.rpc("resolve_safety_report_v1", {
    p_report_id: input.reportId,
    p_expected_status: input.expectedStatus,
    p_action: input.action,
    p_notes: input.notes.trim(),
    p_idempotency_key: input.idempotencyKey.trim(),
  });

  if (error) return failure(error);

  const payload = data as Partial<ResolveSafetyReportPayload> | null;
  if (
    !payload ||
    !isRecord(payload.report) ||
    typeof payload.replayed !== "boolean" ||
    typeof payload.idempotency_key !== "string" ||
    typeof payload.effect_applied !== "boolean" ||
    typeof payload.report_counted !== "boolean" ||
    !(payload.affected_user_id === null || typeof payload.affected_user_id === "string") ||
    !(payload.affected_item_id === null || typeof payload.affected_item_id === "string") ||
    !isSafetyReportStatus(payload.report.status)
  ) {
    return failure({ message: "Invalid report resolution response" });
  }

  return { ok: true, data: payload as ResolveSafetyReportPayload };
}
