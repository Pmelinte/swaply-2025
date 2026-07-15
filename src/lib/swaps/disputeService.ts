import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CanonicalDisputeEvidenceInput,
  CanonicalDisputeResolution,
  DisputableSwapStatus,
} from "./disputePolicy";
import { isSwapStatus } from "./lifecycle";

export type DisputeFailure = {
  code?: string;
  message: string;
  details?: string | null;
};

type CommandResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: DisputeFailure };

export type OpenSwapDisputeInput = {
  swapId: string;
  expectedStatus: DisputableSwapStatus;
  reason: string;
  description: string;
  evidence: CanonicalDisputeEvidenceInput[];
  idempotencyKey: string;
};

export type OpenSwapDisputePayload = {
  dispute: Record<string, unknown>;
  swap: Record<string, unknown>;
  replayed: boolean;
  idempotency_key: string;
  evidence_count: number;
};

export type AddDisputeEvidenceInput = {
  disputeId: string;
  evidenceType: string;
  content: string;
  idempotencyKey: string;
};

export type AddDisputeEvidencePayload = {
  dispute: Record<string, unknown>;
  evidence: Record<string, unknown>;
  replayed: boolean;
  idempotency_key: string;
};

export type ResolveSwapDisputeInput = {
  disputeId: string;
  resolution: CanonicalDisputeResolution;
  notes: string;
  idempotencyKey: string;
};

export type ResolveSwapDisputePayload = {
  dispute: Record<string, unknown>;
  swap: Record<string, unknown>;
  replayed: boolean;
  idempotency_key: string;
  penalized_user_id: string | null;
  penalty_counted: boolean;
  reactivated_item_count: number;
};

export function buildOpenDisputeIdempotencyKey(input: {
  swapId: string;
  actorId: string;
}): string {
  return `dispute:${input.swapId}:${input.actorId}`;
}

export function mapDisputeErrorStatus(code?: string): number {
  switch (code) {
    case "42501":
      return 403;
    case "P0002":
      return 404;
    case "40001":
    case "23505":
      return 409;
    case "22023":
    case "23514":
      return 422;
    default:
      return 500;
  }
}

function failure(error: {
  code?: string;
  message: string;
  details?: string | null;
}): { ok: false; error: DisputeFailure } {
  return {
    ok: false,
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
    },
  };
}

export async function openSwapDispute(
  supabase: SupabaseClient,
  input: OpenSwapDisputeInput,
): Promise<CommandResult<OpenSwapDisputePayload>> {
  const { data, error } = await supabase.rpc("open_swap_dispute_v1", {
    p_swap_id: input.swapId,
    p_expected_status: input.expectedStatus,
    p_reason: input.reason,
    p_description: input.description,
    p_evidence: input.evidence.map((entry) => ({
      evidence_type: entry.evidenceType,
      content: entry.content,
    })),
    p_idempotency_key: input.idempotencyKey.trim(),
  });

  if (error) return failure(error);

  const payload = data as Partial<OpenSwapDisputePayload> | null;
  if (
    !payload ||
    !payload.dispute ||
    !payload.swap ||
    typeof payload.replayed !== "boolean" ||
    typeof payload.idempotency_key !== "string" ||
    typeof payload.evidence_count !== "number"
  ) {
    return failure({ message: "Invalid dispute response" });
  }

  if (!isSwapStatus(payload.swap.status) || payload.swap.status !== "disputed") {
    return failure({ message: "Dispute returned an unsupported Swap status" });
  }

  return { ok: true, data: payload as OpenSwapDisputePayload };
}

export async function addSwapDisputeEvidence(
  supabase: SupabaseClient,
  input: AddDisputeEvidenceInput,
): Promise<CommandResult<AddDisputeEvidencePayload>> {
  const { data, error } = await supabase.rpc("add_swap_dispute_evidence_v1", {
    p_dispute_id: input.disputeId,
    p_evidence_type: input.evidenceType,
    p_content: input.content,
    p_idempotency_key: input.idempotencyKey.trim(),
  });

  if (error) return failure(error);

  const payload = data as Partial<AddDisputeEvidencePayload> | null;
  if (
    !payload ||
    !payload.dispute ||
    !payload.evidence ||
    typeof payload.replayed !== "boolean" ||
    typeof payload.idempotency_key !== "string"
  ) {
    return failure({ message: "Invalid dispute evidence response" });
  }

  return { ok: true, data: payload as AddDisputeEvidencePayload };
}

export async function resolveSwapDispute(
  supabase: SupabaseClient,
  input: ResolveSwapDisputeInput,
): Promise<CommandResult<ResolveSwapDisputePayload>> {
  const { data, error } = await supabase.rpc("resolve_swap_dispute_v1", {
    p_dispute_id: input.disputeId,
    p_resolution: input.resolution,
    p_notes: input.notes,
    p_idempotency_key: input.idempotencyKey.trim(),
  });

  if (error) return failure(error);

  const payload = data as Partial<ResolveSwapDisputePayload> | null;
  if (
    !payload ||
    !payload.dispute ||
    !payload.swap ||
    typeof payload.replayed !== "boolean" ||
    typeof payload.idempotency_key !== "string" ||
    typeof payload.penalty_counted !== "boolean" ||
    typeof payload.reactivated_item_count !== "number" ||
    !(
      payload.penalized_user_id === null ||
      typeof payload.penalized_user_id === "string"
    )
  ) {
    return failure({ message: "Invalid dispute resolution response" });
  }

  if (!isSwapStatus(payload.swap.status) || payload.swap.status !== "disputed") {
    return failure({ message: "Resolution returned an unsupported Swap status" });
  }

  return { ok: true, data: payload as ResolveSwapDisputePayload };
}
