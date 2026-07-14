import type { SupabaseClient } from "@supabase/supabase-js";

export type SwapCompletionPayload = {
  swap: Record<string, unknown>;
  replayed: boolean;
  idempotency_key: string;
  both_confirmed: boolean;
  confirmed_by: string[];
  effects_applied: boolean;
};

export type SwapCompletionFailure = {
  code?: string;
  message: string;
  details?: string | null;
};

export type SwapCompletionResult =
  | { ok: true; data: SwapCompletionPayload }
  | { ok: false; error: SwapCompletionFailure };

export function buildSwapCompletionIdempotencyKey(
  swapId: string,
  actorId: string,
  nonce: string,
): string {
  return `completion:${swapId}:${actorId}:${nonce}`;
}

export function mapSwapCompletionErrorStatus(code?: string): number {
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

export async function confirmSwapCompletion(
  supabase: SupabaseClient,
  swapId: string,
  idempotencyKey: string,
): Promise<SwapCompletionResult> {
  const key = idempotencyKey.trim();
  if (!key) {
    return {
      ok: false,
      error: { code: "22023", message: "Idempotency key is required" },
    };
  }

  const { data, error } = await supabase.rpc("confirm_swap_completion_v1", {
    p_swap_id: swapId,
    p_idempotency_key: key,
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

  const payload = data as Partial<SwapCompletionPayload> | null;
  if (
    !payload ||
    !payload.swap ||
    typeof payload.replayed !== "boolean" ||
    typeof payload.idempotency_key !== "string" ||
    typeof payload.both_confirmed !== "boolean" ||
    !Array.isArray(payload.confirmed_by) ||
    typeof payload.effects_applied !== "boolean"
  ) {
    return {
      ok: false,
      error: { message: "Invalid completion response" },
    };
  }

  return {
    ok: true,
    data: payload as SwapCompletionPayload,
  };
}
