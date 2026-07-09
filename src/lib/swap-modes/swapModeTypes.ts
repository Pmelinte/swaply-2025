export type SwapMode =
  | "one_to_one"
  | "one_to_many"
  | "many_to_one"
  | "object_for_service"
  | "object_for_property"
  | "object_for_event"
  | "service_for_service"
  | "property_for_property"
  | "event_bundle_swap"
  | "circular_swap_3_users"
  | "swap_chain_4_or_5_users"
  | "token_adjusted_swap";

export type SwapAssetDomain = "objects" | "properties" | "services" | "events" | "tokens";

export type SwapParticipantStatus = "invited" | "accepted" | "declined" | "confirmed" | "completed";

export type SwapChainStatus =
  | "draft"
  | "ai_suggested"
  | "awaiting_participant_consent"
  | "ready_for_exchange"
  | "in_exchange"
  | "completed"
  | "cancelled"
  | "disputed";

export interface SwapAssetReference {
  assetId: string;
  ownerId: string;
  domain: SwapAssetDomain;
  label?: string;
  estimatedValue?: number | null;
  currency?: string | null;
}

export interface SwapParticipant {
  userId: string;
  status: SwapParticipantStatus;
  givesAssetIds: string[];
  receivesAssetIds: string[];
}

export interface TokenAdjustment {
  payerUserId: string;
  receiverUserId: string;
  amount: number;
  currency: "swapleni";
  reason: "value_gap" | "logistics_support" | "bundle_adjustment";
}

export interface SwapModeExplanation {
  advisoryOnly: true;
  summary: string;
  reasons: string[];
  risks: string[];
  requiresHumanConfirmation: true;
}

export interface AdvancedSwapProposal {
  id: string;
  mode: SwapMode;
  participants: SwapParticipant[];
  offeredAssets: SwapAssetReference[];
  requestedAssets: SwapAssetReference[];
  tokenAdjustment?: TokenAdjustment | null;
  status: SwapChainStatus;
  aiExplanation?: SwapModeExplanation | null;
  requiresAllParticipantConsent: true;
}

export const SWAP_MODES: readonly SwapMode[] = [
  "one_to_one",
  "one_to_many",
  "many_to_one",
  "object_for_service",
  "object_for_property",
  "object_for_event",
  "service_for_service",
  "property_for_property",
  "event_bundle_swap",
  "circular_swap_3_users",
  "swap_chain_4_or_5_users",
  "token_adjusted_swap",
] as const;

export const MULTI_PARTICIPANT_SWAP_MODES: readonly SwapMode[] = [
  "circular_swap_3_users",
  "swap_chain_4_or_5_users",
] as const;

export const CROSS_DOMAIN_SWAP_MODES: readonly SwapMode[] = [
  "object_for_service",
  "object_for_property",
  "object_for_event",
  "service_for_service",
  "property_for_property",
  "event_bundle_swap",
] as const;
