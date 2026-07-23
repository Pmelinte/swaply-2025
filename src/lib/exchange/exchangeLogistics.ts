export type ExchangeMethod =
  | "local_meetup"
  | "national_courier"
  | "international_courier"
  | "vacation_handoff"
  | "service_exchange";

export type ExchangeStatus =
  | "planning"
  | "meeting_scheduled"
  | "packaging"
  | "in_transit"
  | "awaiting_pickup"
  | "delivered"
  | "completed"
  | "failed";

export type ExchangeTimelineEvent = {
  id: string;
  type: ExchangeStatus;
  title: string;
  description?: string;
  created_at: string;
  actor_id?: string;
};

export type ExchangeLogisticsState = {
  swap_id: string;
  method: ExchangeMethod;
  status: ExchangeStatus;
  meetup_location?: {
    area_label: string;
    city?: string;
    country?: string;
    exact_location_confirmed_by?: string[];
    scheduled_at?: string | null;
    label?: string;
  } | null;
  courier?: {
    provider?: string;
    tracking_code?: string;
    estimated_delivery?: string;
  } | null;
  vacation?: {
    city?: string;
    country?: string;
    arrival_date?: string;
  } | null;
  timeline: ExchangeTimelineEvent[];
};

export const EXCHANGE_METHOD_LABELS: Record<ExchangeMethod, string> = {
  local_meetup: "Local meetup",
  national_courier: "National courier",
  international_courier: "International courier",
  vacation_handoff: "Vacation handoff",
  service_exchange: "Service exchange",
};

export const EXCHANGE_STATUS_LABELS: Record<ExchangeStatus, string> = {
  planning: "Planning",
  meeting_scheduled: "Meeting scheduled",
  packaging: "Packaging",
  in_transit: "In transit",
  awaiting_pickup: "Awaiting pickup",
  delivered: "Delivered",
  completed: "Completed",
  failed: "Failed",
};

export function createInitialExchangeState(
  swapId: string,
  method: ExchangeMethod,
): ExchangeLogisticsState {
  return {
    swap_id: swapId,
    method,
    status: "planning",
    meetup_location: null,
    courier: null,
    vacation: null,
    timeline: [
      {
        id: crypto.randomUUID(),
        type: "planning",
        title: "Exchange planning started",
        created_at: new Date().toISOString(),
      },
    ],
  };
}

export function appendExchangeEvent(
  state: ExchangeLogisticsState,
  event: Omit<ExchangeTimelineEvent, "id" | "created_at">,
): ExchangeLogisticsState {
  return {
    ...state,
    status: event.type,
    timeline: [
      ...state.timeline,
      {
        ...event,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      },
    ],
  };
}
