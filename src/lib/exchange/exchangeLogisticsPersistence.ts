import type { SupabaseClient } from "@supabase/supabase-js";
import {
  appendExchangeEvent,
  createInitialExchangeState,
  type ExchangeLogisticsState,
  type ExchangeMethod,
  type ExchangeStatus,
} from "@/lib/exchange/exchangeLogistics";

type SwapLogisticsRow = {
  id: string;
  requester_id: string;
  responder_id: string;
  swap_metadata: Record<string, unknown> | null;
};

function getLogistics(metadata: Record<string, unknown> | null): ExchangeLogisticsState | null {
  const value = metadata?.exchange_logistics;
  if (!value || typeof value !== "object") return null;
  return value as ExchangeLogisticsState;
}

export async function getExchangeLogistics(
  supabase: SupabaseClient,
  swapId: string,
): Promise<ExchangeLogisticsState | null> {
  const { data, error } = await supabase
    .from("swaps")
    .select("id, swap_metadata")
    .eq("id", swapId)
    .maybeSingle();

  if (error || !data) {
    console.error("getExchangeLogistics failed", error);
    return null;
  }

  return getLogistics((data as { swap_metadata: Record<string, unknown> | null }).swap_metadata);
}

export async function setExchangeMethod(
  supabase: SupabaseClient,
  input: {
    swapId: string;
    actorId: string;
    method: ExchangeMethod;
  },
): Promise<ExchangeLogisticsState | null> {
  const { data, error } = await supabase
    .from("swaps")
    .select("id, requester_id, responder_id, swap_metadata")
    .eq("id", input.swapId)
    .maybeSingle();

  if (error || !data) {
    console.error("setExchangeMethod lookup failed", error);
    return null;
  }

  const row = data as SwapLogisticsRow;
  if (input.actorId !== row.requester_id && input.actorId !== row.responder_id) return null;

  const existing = getLogistics(row.swap_metadata);
  const next = existing
    ? appendExchangeEvent(
        { ...existing, method: input.method },
        {
          type: "planning",
          title: "Exchange method selected",
          description: input.method,
          actor_id: input.actorId,
        },
      )
    : createInitialExchangeState(input.swapId, input.method);

  const nextMetadata = {
    ...(row.swap_metadata ?? {}),
    exchange_logistics: next,
  };

  const { error: updateError } = await supabase
    .from("swaps")
    .update({ swap_metadata: nextMetadata, updated_at: new Date().toISOString() })
    .eq("id", input.swapId);

  if (updateError) {
    console.error("setExchangeMethod update failed", updateError);
    return null;
  }

  return next;
}

export async function updateExchangeStatus(
  supabase: SupabaseClient,
  input: {
    swapId: string;
    actorId: string;
    status: ExchangeStatus;
    title?: string;
    description?: string;
  },
): Promise<ExchangeLogisticsState | null> {
  const { data, error } = await supabase
    .from("swaps")
    .select("id, requester_id, responder_id, swap_metadata")
    .eq("id", input.swapId)
    .maybeSingle();

  if (error || !data) {
    console.error("updateExchangeStatus lookup failed", error);
    return null;
  }

  const row = data as SwapLogisticsRow;
  if (input.actorId !== row.requester_id && input.actorId !== row.responder_id) return null;

  const existing = getLogistics(row.swap_metadata) ?? createInitialExchangeState(input.swapId, "local_meetup");
  const next = appendExchangeEvent(existing, {
    type: input.status,
    title: input.title ?? `Exchange status changed to ${input.status}`,
    description: input.description,
    actor_id: input.actorId,
  });

  const nextMetadata = {
    ...(row.swap_metadata ?? {}),
    exchange_logistics: next,
  };

  const { error: updateError } = await supabase
    .from("swaps")
    .update({ swap_metadata: nextMetadata, updated_at: new Date().toISOString() })
    .eq("id", input.swapId);

  if (updateError) {
    console.error("updateExchangeStatus update failed", updateError);
    return null;
  }

  await supabase.from("notifications").insert([
    {
      user_id: row.requester_id,
      type: "exchange_update",
      title: "Exchange updated",
      body: next.timeline.at(-1)?.title ?? "Exchange logistics updated.",
      data: { swap_id: input.swapId, status: input.status },
      read: false,
      is_read: false,
      priority: "normal",
    },
    {
      user_id: row.responder_id,
      type: "exchange_update",
      title: "Exchange updated",
      body: next.timeline.at(-1)?.title ?? "Exchange logistics updated.",
      data: { swap_id: input.swapId, status: input.status },
      read: false,
      is_read: false,
      priority: "normal",
    },
  ]);

  return next;
}
