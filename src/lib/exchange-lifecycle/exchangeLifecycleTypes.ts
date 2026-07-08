export type ExchangeStatus =
  | "proposed"
  | "accepted"
  | "in_progress"
  | "shipped"
  | "received"
  | "completed"
  | "cancelled"
  | "disputed";

export type ExchangeLogisticsMode =
  | "local_handover"
  | "national_courier"
  | "international_courier"
  | "vacation_handover"
  | "property_exchange"
  | "service_exchange"
  | "event_reservation_transfer";

export type ExchangeChecklistKey =
  | "condition_confirmed"
  | "packaging_confirmed"
  | "handoff_or_shipment_confirmed"
  | "received_confirmed"
  | "feedback_requested";

export type ExchangeChecklistItemStatus = "pending" | "confirmed" | "not_applicable";

export interface ExchangeChecklistItem {
  key: ExchangeChecklistKey;
  status: ExchangeChecklistItemStatus;
  confirmedByUserIds: string[];
}

export interface ExchangeParticipantConfirmation {
  userId: string;
  acceptedTerms: boolean;
  confirmedCondition: boolean;
  confirmedLogistics: boolean;
  confirmedReceived: boolean;
  submittedFeedback: boolean;
}

export interface ExchangeLifecycleSnapshot {
  exchangeId: string;
  status: ExchangeStatus;
  logisticsMode: ExchangeLogisticsMode;
  participantConfirmations: ExchangeParticipantConfirmation[];
  checklist: ExchangeChecklistItem[];
  itemIds: string[];
  storyStatus?: "not_started" | "prompted" | "pending_consent" | "published" | "suspended" | null;
}

export interface ExchangeCompletionGate {
  canComplete: boolean;
  missingChecklistKeys: ExchangeChecklistKey[];
  missingParticipantUserIds: string[];
  requiresHumanConfirmation: true;
}

export const EXCHANGE_STATUSES: readonly ExchangeStatus[] = [
  "proposed",
  "accepted",
  "in_progress",
  "shipped",
  "received",
  "completed",
  "cancelled",
  "disputed",
] as const;

export const REQUIRED_EXCHANGE_CHECKLIST_KEYS: readonly ExchangeChecklistKey[] = [
  "condition_confirmed",
  "packaging_confirmed",
  "handoff_or_shipment_confirmed",
  "received_confirmed",
] as const;
