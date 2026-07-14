import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { SwapStatus } from "./lifecycle";

export type SwapTransitionOutcome =
  | "applied"
  | "replayed"
  | "invalid_request"
  | "idempotency_conflict"
  | "not_found"
  | "not_participant"
  | "stale_state"
  | "invalid_transition";

export type AuthoritativeSwapTransition = {
  outcome: SwapTransitionOutcome;
  replayed: boolean;
  actorRole?: "requester" | "responder";
  fromStatus?: SwapStatus;
  toStatus?: SwapStatus;
  expectedStatus?: SwapStatus;
  currentStatus?: SwapStatus;
  swap?: Record<string, unknown>;
};

export type AuthoritativeSwapTransitionInput = {
  swapId: string;
  actorId: string;
  expectedStatus: SwapStatus;
  toStatus: SwapStatus;
  idempotencyKey: string;
};

function getServiceClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Swap transition authority is not configured");
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function transitionSwapStatusAuthoritatively(
  input: AuthoritativeSwapTransitionInput,
): Promise<AuthoritativeSwapTransition> {
  const db = getServiceClient();
  const { data, error } = await db.rpc(
    "transition_swap_status_authoritative",
    {
      p_swap_id: input.swapId,
      p_actor_id: input.actorId,
      p_expected_status: input.expectedStatus,
      p_to_status: input.toStatus,
      p_idempotency_key: input.idempotencyKey,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Invalid response from swap transition authority");
  }

  return data as AuthoritativeSwapTransition;
}
