import type { SupabaseClient } from "@supabase/supabase-js";
import type { CancellableSwapStatus } from "./cancelPolicy";
import { isSwapStatus } from "./lifecycle";

export type CancelSwapInput = {
  swapId: string;
  expectedStatus: CancellableSwapStatus;
  reason: string;
  idempotencyKey?: string;
};

export type CancelSwapPayload = {
  swap: Record<string, unknown>;
  replayed: boolean;
  idempotency_key: string;
  reason: string;
  reactivated_item_count: number;
  cancellation_counted: boolean;
};

export type CancelSwapFailure = {
  code?: string;
  message: string;
  details?: string | null;
};

export type CancelSwapResult =
  | { ok: true; data: CancelSwapPayload }
  | { ok: false; error: CancelSwapFailure };

export function buildSwapCancelIdempotencyKey(
  input: Pick<CancelSwapInput, "swapId" | "expectedStatus">,
): string {
  return `cancel:${input.swapId}:${input.expectedStatus}`;
}

export function mapSwapCancelErrorStatus(code?: string): number {
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

export async function cancelSwap(
  supabase: SupabaseClient,
  input: CancelSwapInput,
): Promise<CancelSwapResult> {
  const idempotencyKey =
    input.idempotencyKey?.trim() || buildSwapCancelIdempotencyKey(input);

  const { data, error } = await supabase.rpc("cancel_swap_v1", {
    p_swap_id: input.swapId,
    p_expected_status: input.expectedStatus,
    p_reason: input.reason,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    return {
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    };
  }

  const payload = data as Partial<CancelSwapPayload> | null;
  if (
    !payload ||
    !payload.swap ||
    typeof payload.replayed !== "boolean" ||
    typeof payload.idempotency_key !== "string" ||
    typeof payload.reason !== "string" ||
    typeof payload.reactivated_item_count !== "number" ||
    typeof payload.cancellation_counted !== "boolean"
  ) {
    return {
      ok: false,
      error: { message: "Invalid cancellation response" },
    };
  }

  if (!isSwapStatus(payload.swap.status) || payload.swap.status !== "cancelled") {
    return {
      ok: false,
      error: { message: "Cancellation returned an unsupported status" },
    };
  }

  return {
    ok: true,
    data: payload as CancelSwapPayload,
  };
}
