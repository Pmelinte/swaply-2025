import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildSwapTransitionIdempotencyKey,
  type SwapStatus,
} from "./lifecycle";

export type SwapTransitionResponse = {
  swap: Record<string, unknown>;
  transition: {
    outcome: "applied" | "replayed";
    replayed: boolean;
    actorRole?: "requester" | "responder";
    fromStatus?: SwapStatus;
    toStatus?: SwapStatus;
  };
};

export class SwapTransitionClientError extends Error {
  readonly status: number;
  readonly payload: Record<string, unknown>;

  constructor(
    message: string,
    status: number,
    payload: Record<string, unknown>,
  ) {
    super(message);
    this.name = "SwapTransitionClientError";
    this.status = status;
    this.payload = payload;
  }
}

export async function transitionSwapFromClient(
  supabase: SupabaseClient,
  input: {
    swapId: string;
    expectedStatus: SwapStatus;
    toStatus: SwapStatus;
    idempotencyKey?: string;
  },
): Promise<SwapTransitionResponse> {
  const session = await supabase.auth.getSession();
  const accessToken = session.data.session?.access_token;
  if (!accessToken) {
    throw new SwapTransitionClientError("Authentication required", 401, {});
  }

  const idempotencyKey =
    input.idempotencyKey ??
    buildSwapTransitionIdempotencyKey(
      input.swapId,
      input.expectedStatus,
      input.toStatus,
    );

  const response = await fetch("/api/swaps/transition", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      swapId: input.swapId,
      expectedStatus: input.expectedStatus,
      toStatus: input.toStatus,
      idempotencyKey,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    throw new SwapTransitionClientError(
      typeof payload.error === "string"
        ? payload.error
        : "Swap transition failed",
      response.status,
      payload,
    );
  }

  return payload as SwapTransitionResponse;
}
