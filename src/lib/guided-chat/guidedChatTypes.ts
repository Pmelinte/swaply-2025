export type GuidedChatStage =
  | "interest"
  | "why_i_want_it"
  | "what_i_offer"
  | "condition_clarification"
  | "logistics_clarification"
  | "agreement_summary"
  | "move_to_exchange"
  | "feedback"
  | "story_prompt";

export type GuidedChatMessageKind = "free_text" | "guided_prompt" | "decline_template" | "system_summary" | "exchange_handoff";

export type LocationSharingState = "not_requested" | "requested" | "mutually_agreed" | "blocked_until_agreement";

export interface GuidedChatMessageDraft {
  conversationId: string;
  senderId: string;
  stage: GuidedChatStage;
  kind: GuidedChatMessageKind;
  originalText: string;
  sourceLocale: string;
  targetLocale?: string | null;
  translatedText?: string | null;
  showOriginalAvailable: boolean;
  locationSharingState: LocationSharingState;
}

export interface GuidedChatStageConfig {
  stage: GuidedChatStage;
  label: string;
  optional: true;
  canUseFreeText: true;
  exchangeRelevant: boolean;
}

export interface PoliteDeclineTemplate {
  id: string;
  stage: GuidedChatStage;
  text: string;
  tone: "neutral" | "warm" | "firm";
}

export interface AgreementSummaryDraft {
  conversationId: string;
  sourceMessageIds: string[];
  summary: string;
  unresolvedQuestions: string[];
  readyForExchange: boolean;
  requiresHumanConfirmation: true;
}

export const GUIDED_CHAT_STAGES: readonly GuidedChatStage[] = [
  "interest",
  "why_i_want_it",
  "what_i_offer",
  "condition_clarification",
  "logistics_clarification",
  "agreement_summary",
  "move_to_exchange",
  "feedback",
  "story_prompt",
] as const;

export const GUIDED_CHAT_STAGE_CONFIGS: readonly GuidedChatStageConfig[] = [
  { stage: "interest", label: "Interest", optional: true, canUseFreeText: true, exchangeRelevant: true },
  { stage: "why_i_want_it", label: "Why I want it", optional: true, canUseFreeText: true, exchangeRelevant: true },
  { stage: "what_i_offer", label: "What I offer", optional: true, canUseFreeText: true, exchangeRelevant: true },
  { stage: "condition_clarification", label: "Condition clarification", optional: true, canUseFreeText: true, exchangeRelevant: true },
  { stage: "logistics_clarification", label: "Logistics clarification", optional: true, canUseFreeText: true, exchangeRelevant: true },
  { stage: "agreement_summary", label: "Agreement summary", optional: true, canUseFreeText: true, exchangeRelevant: true },
  { stage: "move_to_exchange", label: "Move to Exchange", optional: true, canUseFreeText: true, exchangeRelevant: true },
  { stage: "feedback", label: "Feedback", optional: true, canUseFreeText: true, exchangeRelevant: false },
  { stage: "story_prompt", label: "Story prompt", optional: true, canUseFreeText: true, exchangeRelevant: false },
] as const;
