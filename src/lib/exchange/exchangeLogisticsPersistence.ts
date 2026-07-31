import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ExchangeLogisticsState,
  ExchangeMethod,
  ExchangeStatus,
} from "@/lib/exchange/exchangeLogistics";
import { isExactLocationPayload } from "@/lib/chat/chatDelivery";

type LogisticsCommand =
  | "set_method"
  | "set_status"
  | "set_local_handover"
  | "set_courier"
  | "set_property"
  | "set_service"
  | "set_event";

function getLogistics(
  metadata: Record<string, unknown> | null,
): ExchangeLogisticsState | null {
  const value = metadata?.exchange_logistics;
  if (!value || typeof value !== "object") return null;
  return value as ExchangeLogisticsState;
}

function cleanText(value: unknown, max = 240): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().slice(0, max);
  return trimmed || undefined;
}

function cleanDate(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const timestamp = Date.parse(trimmed);
  return Number.isNaN(timestamp)
    ? undefined
    : new Date(timestamp).toISOString();
}

async function applyLogisticsCommand(
  supabase: SupabaseClient,
  input: {
    swapId: string;
    command: LogisticsCommand;
    payload?: Record<string, unknown>;
  },
): Promise<ExchangeLogisticsState | null> {
  const { data, error } = await supabase.rpc("update_exchange_logistics_v1", {
    p_swap_id: input.swapId,
    p_command: input.command,
    p_payload: input.payload ?? {},
  });

  if (error || !data || typeof data !== "object" || Array.isArray(data)) {
    console.error("update_exchange_logistics_v1 failed", error ?? data);
    return null;
  }

  return data as ExchangeLogisticsState;
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

  return getLogistics(
    (data as { swap_metadata: Record<string, unknown> | null }).swap_metadata,
  );
}

export async function setExchangeMethod(
  supabase: SupabaseClient,
  input: { swapId: string; actorId: string; method: ExchangeMethod },
): Promise<ExchangeLogisticsState | null> {
  return applyLogisticsCommand(supabase, {
    swapId: input.swapId,
    command: "set_method",
    payload: { method: input.method },
  });
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
  return applyLogisticsCommand(supabase, {
    swapId: input.swapId,
    command: "set_status",
    payload: {
      status: input.status,
      title: cleanText(input.title, 160),
      description: cleanText(input.description, 500),
    },
  });
}

export async function setLocalHandoverPlan(
  supabase: SupabaseClient,
  input: {
    swapId: string;
    actorId: string;
    areaLabel: string;
    scheduledAt?: string | null;
    city?: string;
    country?: string;
  },
): Promise<ExchangeLogisticsState | null> {
  if (isExactLocationPayload(input)) return null;
  const areaLabel = cleanText(input.areaLabel, 160);
  if (!areaLabel) return null;

  return applyLogisticsCommand(supabase, {
    swapId: input.swapId,
    command: "set_local_handover",
    payload: {
      area_label: areaLabel,
      scheduled_at: cleanDate(input.scheduledAt),
      city: cleanText(input.city, 80),
      country: cleanText(input.country, 80),
    },
  });
}

export async function setCourierLogistics(
  supabase: SupabaseClient,
  input: {
    swapId: string;
    actorId: string;
    provider?: unknown;
    trackingCode?: unknown;
    packaging?: unknown;
    packageNotes?: unknown;
    estimatedDelivery?: unknown;
  },
): Promise<ExchangeLogisticsState | null> {
  return applyLogisticsCommand(supabase, {
    swapId: input.swapId,
    command: "set_courier",
    payload: {
      provider: cleanText(input.provider, 80),
      tracking_code: cleanText(input.trackingCode, 80),
      packaging: cleanText(input.packaging, 80),
      package_notes: cleanText(input.packageNotes, 240),
      estimated_delivery: cleanDate(input.estimatedDelivery),
    },
  });
}

export async function setPropertyLogistics(
  supabase: SupabaseClient,
  input: {
    swapId: string;
    actorId: string;
    checkIn?: unknown;
    checkOut?: unknown;
    rules?: unknown;
  },
): Promise<ExchangeLogisticsState | null> {
  return applyLogisticsCommand(supabase, {
    swapId: input.swapId,
    command: "set_property",
    payload: {
      check_in: cleanDate(input.checkIn),
      check_out: cleanDate(input.checkOut),
      rules: cleanText(input.rules, 500),
    },
  });
}

export async function setServiceLogistics(
  supabase: SupabaseClient,
  input: {
    swapId: string;
    actorId: string;
    deliverables?: unknown;
    deadline?: unknown;
    sessionUrl?: unknown;
  },
): Promise<ExchangeLogisticsState | null> {
  return applyLogisticsCommand(supabase, {
    swapId: input.swapId,
    command: "set_service",
    payload: {
      deliverables: cleanText(input.deliverables, 500),
      deadline: cleanDate(input.deadline),
      session_url: cleanText(input.sessionUrl, 240),
    },
  });
}

export async function setEventLogistics(
  supabase: SupabaseClient,
  input: {
    swapId: string;
    actorId: string;
    transferDeadline?: unknown;
    proofLabel?: unknown;
    transferNotes?: unknown;
  },
): Promise<ExchangeLogisticsState | null> {
  return applyLogisticsCommand(supabase, {
    swapId: input.swapId,
    command: "set_event",
    payload: {
      transfer_deadline: cleanDate(input.transferDeadline),
      proof_label: cleanText(input.proofLabel, 160),
      transfer_notes: cleanText(input.transferNotes, 500),
    },
  });
}
