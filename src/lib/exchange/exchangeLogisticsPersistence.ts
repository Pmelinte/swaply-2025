import type { SupabaseClient } from "@supabase/supabase-js";
import {
  appendExchangeEvent,
  createInitialExchangeState,
  type ExchangeLogisticsState,
  type ExchangeMethod,
  type ExchangeStatus,
} from "@/lib/exchange/exchangeLogistics";
import { isExactLocationPayload } from "@/lib/chat/chatDelivery";

type SwapLogisticsRow = {
  id: string;
  requester_id: string;
  responder_id: string;
  swap_metadata: Record<string, unknown> | null;
};

function getLogistics(
  metadata: Record<string, unknown> | null,
): ExchangeLogisticsState | null {
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

  return getLogistics(
    (data as { swap_metadata: Record<string, unknown> | null }).swap_metadata,
  );
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
  if (input.actorId !== row.requester_id && input.actorId !== row.responder_id)
    return null;

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
    .update({
      swap_metadata: nextMetadata,
      updated_at: new Date().toISOString(),
    })
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
  if (input.actorId !== row.requester_id && input.actorId !== row.responder_id)
    return null;

  const existing =
    getLogistics(row.swap_metadata) ??
    createInitialExchangeState(input.swapId, "local_meetup");
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
    .update({
      swap_metadata: nextMetadata,
      updated_at: new Date().toISOString(),
    })
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
  const areaLabel = input.areaLabel.trim().slice(0, 160);
  if (!areaLabel) return null;

  const { data, error } = await supabase
    .from("swaps")
    .select("id, requester_id, responder_id, swap_metadata")
    .eq("id", input.swapId)
    .maybeSingle();

  if (error || !data) {
    console.error("setLocalHandoverPlan lookup failed", error);
    return null;
  }

  const row = data as SwapLogisticsRow;
  if (input.actorId !== row.requester_id && input.actorId !== row.responder_id)
    return null;

  const existing =
    getLogistics(row.swap_metadata) ??
    createInitialExchangeState(input.swapId, "local_meetup");
  const confirmedBy = new Set(
    existing.meetup_location?.exact_location_confirmed_by ?? [],
  );
  confirmedBy.add(input.actorId);
  const next = appendExchangeEvent(
    {
      ...existing,
      method: "local_meetup",
      meetup_location: {
        area_label: areaLabel,
        city: input.city?.trim().slice(0, 80) || undefined,
        country: input.country?.trim().slice(0, 80) || undefined,
        scheduled_at: input.scheduledAt ?? null,
        exact_location_confirmed_by: Array.from(confirmedBy),
      },
    },
    {
      type: "meeting_scheduled",
      title: "Local handover plan updated",
      description: areaLabel,
      actor_id: input.actorId,
    },
  );

  const { error: updateError } = await supabase
    .from("swaps")
    .update({
      swap_metadata: { ...(row.swap_metadata ?? {}), exchange_logistics: next },
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.swapId);

  if (updateError) {
    console.error("setLocalHandoverPlan update failed", updateError);
    return null;
  }

  return next;
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

function addConfirmation(
  existing: string[] | undefined,
  actorId: string,
): string[] {
  return Array.from(new Set([...(existing ?? []), actorId]));
}

async function loadParticipantSwap(
  supabase: SupabaseClient,
  swapId: string,
  actorId: string,
): Promise<SwapLogisticsRow | null> {
  const { data, error } = await supabase
    .from("swaps")
    .select("id, requester_id, responder_id, swap_metadata")
    .eq("id", swapId)
    .maybeSingle();

  if (error || !data) {
    console.error("loadParticipantSwap failed", error);
    return null;
  }

  const row = data as SwapLogisticsRow;
  if (actorId !== row.requester_id && actorId !== row.responder_id) return null;
  return row;
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
  const row = await loadParticipantSwap(supabase, input.swapId, input.actorId);
  if (!row) return null;
  const existing =
    getLogistics(row.swap_metadata) ??
    createInitialExchangeState(input.swapId, "national_courier");
  const next = appendExchangeEvent(
    {
      ...existing,
      method:
        existing.method === "international_courier"
          ? "international_courier"
          : "national_courier",
      courier: {
        ...(existing.courier ?? {}),
        provider: cleanText(input.provider, 80),
        tracking_code: cleanText(input.trackingCode, 80),
        packaging: cleanText(input.packaging, 80),
        package_notes: cleanText(input.packageNotes, 240),
        estimated_delivery: cleanDate(input.estimatedDelivery),
      },
    },
    {
      type: "in_transit",
      title: "Courier logistics updated",
      actor_id: input.actorId,
    },
  );
  const { error } = await supabase
    .from("swaps")
    .update({
      swap_metadata: { ...(row.swap_metadata ?? {}), exchange_logistics: next },
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.swapId);
  return error ? null : next;
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
  const row = await loadParticipantSwap(supabase, input.swapId, input.actorId);
  if (!row) return null;
  const existing =
    getLogistics(row.swap_metadata) ??
    createInitialExchangeState(input.swapId, "vacation_handoff");
  const next = appendExchangeEvent(
    {
      ...existing,
      method: "vacation_handoff",
      property: {
        ...(existing.property ?? {}),
        check_in: cleanDate(input.checkIn),
        check_out: cleanDate(input.checkOut),
        rules: cleanText(input.rules, 500),
        confirmed_by: addConfirmation(
          existing.property?.confirmed_by,
          input.actorId,
        ),
      },
    },
    {
      type: "meeting_scheduled",
      title: "Property exchange logistics confirmed",
      actor_id: input.actorId,
    },
  );
  const { error } = await supabase
    .from("swaps")
    .update({
      swap_metadata: { ...(row.swap_metadata ?? {}), exchange_logistics: next },
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.swapId);
  return error ? null : next;
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
  const row = await loadParticipantSwap(supabase, input.swapId, input.actorId);
  if (!row) return null;
  const existing =
    getLogistics(row.swap_metadata) ??
    createInitialExchangeState(input.swapId, "service_exchange");
  const next = appendExchangeEvent(
    {
      ...existing,
      method: "service_exchange",
      service: {
        ...(existing.service ?? {}),
        deliverables: cleanText(input.deliverables, 500),
        deadline: cleanDate(input.deadline),
        session_url: cleanText(input.sessionUrl, 240),
        confirmed_by: addConfirmation(
          existing.service?.confirmed_by,
          input.actorId,
        ),
      },
    },
    {
      type: "meeting_scheduled",
      title: "Service exchange logistics confirmed",
      actor_id: input.actorId,
    },
  );
  const { error } = await supabase
    .from("swaps")
    .update({
      swap_metadata: { ...(row.swap_metadata ?? {}), exchange_logistics: next },
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.swapId);
  return error ? null : next;
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
  const row = await loadParticipantSwap(supabase, input.swapId, input.actorId);
  if (!row) return null;
  const existing =
    getLogistics(row.swap_metadata) ??
    createInitialExchangeState(input.swapId, "local_meetup");
  const next = appendExchangeEvent(
    {
      ...existing,
      event: {
        ...(existing.event ?? {}),
        transfer_deadline: cleanDate(input.transferDeadline),
        proof_label: cleanText(input.proofLabel, 160),
        transfer_notes: cleanText(input.transferNotes, 500),
        confirmed_by: addConfirmation(
          existing.event?.confirmed_by,
          input.actorId,
        ),
      },
    },
    {
      type: "awaiting_pickup",
      title: "Event transfer logistics confirmed",
      actor_id: input.actorId,
    },
  );
  const { error } = await supabase
    .from("swaps")
    .update({
      swap_metadata: { ...(row.swap_metadata ?? {}), exchange_logistics: next },
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.swapId);
  return error ? null : next;
}
