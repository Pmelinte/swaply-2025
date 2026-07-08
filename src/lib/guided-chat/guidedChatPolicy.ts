import type {
  AgreementSummaryDraft,
  GuidedChatMessageDraft,
  GuidedChatStage,
  PoliteDeclineTemplate,
} from "./guidedChatTypes";
import { GUIDED_CHAT_STAGE_CONFIGS, GUIDED_CHAT_STAGES } from "./guidedChatTypes";

const EXACT_LOCATION_PATTERNS = [
  /\b(strada|street|st\.?|avenue|bulevardul|bd\.?|road|rd\.?)\s+[\p{L}0-9 .'-]+\s+\d+\b/iu,
  /\b\d{1,5}\s+[\p{L}0-9 .'-]+\s+(street|st\.?|road|rd\.?|avenue|ave\.?|bulevardul|bd\.?)\b/iu,
  /\b\d{2}\.\d{4,},\s*\d{2}\.\d{4,}\b/u,
] as const;

export const POLITE_DECLINE_TEMPLATES: readonly PoliteDeclineTemplate[] = [
  {
    id: "decline-not-right-fit",
    stage: "interest",
    text: "Thank you, but this is not the right fit for me.",
    tone: "neutral",
  },
  {
    id: "decline-looking-for-something-else",
    stage: "what_i_offer",
    text: "Your offer is interesting, but I am looking for something different right now.",
    tone: "warm",
  },
  {
    id: "decline-no-courier",
    stage: "logistics_clarification",
    text: "Thank you, but I prefer not to use courier for this exchange.",
    tone: "firm",
  },
] as const;

export function isGuidedChatStage(stage: string): stage is GuidedChatStage {
  return GUIDED_CHAT_STAGES.includes(stage as GuidedChatStage);
}

export function getNextGuidedChatStage(stage: GuidedChatStage): GuidedChatStage | null {
  const index = GUIDED_CHAT_STAGES.indexOf(stage);
  return GUIDED_CHAT_STAGES[index + 1] ?? null;
}

export function isGuidedChatOptional() {
  return true;
}

export function canUseFreeTextInGuidedChat(stage: GuidedChatStage) {
  return GUIDED_CHAT_STAGE_CONFIGS.find((config) => config.stage === stage)?.canUseFreeText ?? true;
}

export function containsExactLocation(text: string) {
  return EXACT_LOCATION_PATTERNS.some((pattern) => pattern.test(text));
}

export function canShareExactLocation(message: GuidedChatMessageDraft) {
  if (!containsExactLocation(message.originalText)) return true;
  return message.locationSharingState === "mutually_agreed";
}

export function redactExactLocationUntilAgreement(message: GuidedChatMessageDraft) {
  if (canShareExactLocation(message)) return message.originalText;
  return EXACT_LOCATION_PATTERNS.reduce((current, pattern) => current.replace(pattern, "[location hidden until both people agree]"), message.originalText);
}

export function shouldPreserveOriginalMessage(message: GuidedChatMessageDraft) {
  return message.originalText.trim().length > 0 && message.showOriginalAvailable;
}

export function buildAgreementSummaryDraft(input: {
  conversationId: string;
  sourceMessageIds: string[];
  summary: string;
  unresolvedQuestions?: string[];
}): AgreementSummaryDraft {
  const unresolvedQuestions = input.unresolvedQuestions ?? [];

  return {
    conversationId: input.conversationId,
    sourceMessageIds: input.sourceMessageIds,
    summary: input.summary.trim(),
    unresolvedQuestions,
    readyForExchange: unresolvedQuestions.length === 0 && input.sourceMessageIds.length > 0,
    requiresHumanConfirmation: true,
  };
}

export function getPoliteDeclineTemplatesForStage(stage: GuidedChatStage) {
  return POLITE_DECLINE_TEMPLATES.filter((template) => template.stage === stage || stage === "interest");
}
