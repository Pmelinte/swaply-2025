import type { SupabaseClient } from "@supabase/supabase-js";
import { isSwapStatus, type SwapStatus } from "./lifecycle";

export type SwapTransitionInput = {
  swapId: string;
  expectedStatus: SwapStatus;
  toStatus: SwapStatus;
  idempotencyKey?: string;
};

export type SwapTransitionPayload = {
  swap: Record<string, unknown>;
  replayed: boolean;
  idempotency_key: string;
};

export type SwapTransitionFailure = {
  code?: string;
  message: string;
  details?: string;
};

export type SwapTransitionResult =
  | { ok: true; data: SwapTransitionPayload }
  | { ok: false; error: SwapTransitionFailure };

export function buildSwapTransitionIdempotencyKey(
  input: Pick<SwapTransitionInput, "swapId" | "expectedStatus" | "toStatus">,
): string {
  return `swap:${input.swapId}:${input.expectedStatus}:${input.toStatus}`;
}

export function mapSwapTransitionErrorStatus(code?: string): number {
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

export async function transitionSwap(
  supabase: SupabaseClient,
  input: SwapTransitionInput,
): Promise<SwapTransitionResult> {
  const idempotencyKey =
    input.idempotencyKey?.trim() || buildSwapTransitionIdempotencyKey(input);

  const { data, error } = await supabase.rpc("transition_swap_v1", {
    p_swap_id: input.swapId,
    p_expected_status: input.expectedStatus,
    p_to_status: input.toStatus,
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

  const payload = data as Partial<SwapTransitionPayload> | null;
  if (
    !payload ||
    !payload.swap ||
    typeof payload.replayed !== "boolean" ||
    typeof payload.idempotency_key !== "string"
  ) {
    return {
      ok: false,
      error: { message: "Invalid transition response" },
    };
  }

  const status = payload.swap.status;
  if (!isSwapStatus(status)) {
    return {
      ok: false,
      error: { message: "Transition returned an unsupported status" },
    };
  }

  return {
    ok: true,
    data: payload as SwapTransitionPayload,
  };
}
