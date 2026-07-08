import type { AgreementSummaryDraft, GuidedChatMessageDraft } from "./guidedChatTypes";

export const GUIDED_CHAT_MESSAGE_EXAMPLES = [
  {
    conversationId: "conversation-demo-camera",
    senderId: "demo-user-a",
    stage: "interest",
    kind: "free_text",
    originalText: "Hello, I am interested in the camera. Is it still available?",
    sourceLocale: "en",
    targetLocale: "ro",
    translatedText: null,
    showOriginalAvailable: true,
    locationSharingState: "not_requested",
  },
  {
    conversationId: "conversation-demo-camera",
    senderId: "demo-user-b",
    stage: "logistics_clarification",
    kind: "free_text",
    originalText: "We can discuss a public meeting point after we both agree to the exchange.",
    sourceLocale: "en",
    targetLocale: "fr",
    translatedText: null,
    showOriginalAvailable: true,
    locationSharingState: "blocked_until_agreement",
  },
  {
    conversationId: "conversation-demo-location",
    senderId: "demo-user-c",
    stage: "logistics_clarification",
    kind: "free_text",
    originalText: "Meet at 22 Baker Street tomorrow morning.",
    sourceLocale: "en",
    targetLocale: "ro",
    translatedText: null,
    showOriginalAvailable: true,
    locationSharingState: "blocked_until_agreement",
  },
] as const satisfies readonly GuidedChatMessageDraft[];

export const AGREEMENT_SUMMARY_EXAMPLE = {
  conversationId: "conversation-demo-camera",
  sourceMessageIds: ["message-1", "message-2", "message-3"],
  summary: "Both participants discussed the camera condition and agreed to continue only after confirming logistics.",
  unresolvedQuestions: ["Confirm pickup or courier."],
  readyForExchange: false,
  requiresHumanConfirmation: true,
} as const satisfies AgreementSummaryDraft;
