import type {
  ExchangeChecklistKey,
  ExchangeCompletionGate,
  ExchangeLifecycleSnapshot,
  ExchangeStatus,
} from "./exchangeLifecycleTypes";
import { REQUIRED_EXCHANGE_CHECKLIST_KEYS } from "./exchangeLifecycleTypes";

export function canTransitionExchangeStatus(from: ExchangeStatus, to: ExchangeStatus) {
  if (from === to) return true;
  if (from === "cancelled" || from === "disputed" || from === "completed") return false;

  const allowed: Record<ExchangeStatus, readonly ExchangeStatus[]> = {
    proposed: ["accepted", "cancelled", "disputed"],
    accepted: ["in_progress", "cancelled", "disputed"],
    in_progress: ["shipped", "received", "cancelled", "disputed"],
    shipped: ["received", "cancelled", "disputed"],
    received: ["completed", "disputed"],
    completed: [],
    cancelled: [],
    disputed: [],
  };

  return allowed[from].includes(to);
}

export function getConfirmedChecklistKeys(snapshot: ExchangeLifecycleSnapshot) {
  return snapshot.checklist
    .filter((item) => item.status === "confirmed" || item.status === "not_applicable")
    .map((item) => item.key);
}

export function getMissingRequiredChecklistKeys(snapshot: ExchangeLifecycleSnapshot): ExchangeChecklistKey[] {
  const confirmed = new Set(getConfirmedChecklistKeys(snapshot));
  return REQUIRED_EXCHANGE_CHECKLIST_KEYS.filter((key) => !confirmed.has(key));
}

export function getMissingCompletionParticipantIds(snapshot: ExchangeLifecycleSnapshot) {
  return snapshot.participantConfirmations
    .filter((confirmation) =>
      !confirmation.acceptedTerms ||
      !confirmation.confirmedCondition ||
      !confirmation.confirmedLogistics ||
      !confirmation.confirmedReceived,
    )
    .map((confirmation) => confirmation.userId);
}

export function getExchangeCompletionGate(snapshot: ExchangeLifecycleSnapshot): ExchangeCompletionGate {
  const missingChecklistKeys = getMissingRequiredChecklistKeys(snapshot);
  const missingParticipantUserIds = getMissingCompletionParticipantIds(snapshot);
  const canComplete =
    snapshot.status === "received" &&
    missingChecklistKeys.length === 0 &&
    missingParticipantUserIds.length === 0;

  return {
    canComplete,
    missingChecklistKeys,
    missingParticipantUserIds,
    requiresHumanConfirmation: true,
  };
}

export function shouldReactivateItemsAfterExchangeFailure(snapshot: ExchangeLifecycleSnapshot) {
  return snapshot.status === "cancelled" && snapshot.itemIds.length > 0;
}

export function shouldSuspendStory(snapshot: ExchangeLifecycleSnapshot) {
  return snapshot.status === "disputed" || snapshot.storyStatus === "suspended";
}

export function canPromptFeedback(snapshot: ExchangeLifecycleSnapshot) {
  return snapshot.status === "completed";
}

export function canPromptStory(snapshot: ExchangeLifecycleSnapshot) {
  if (!canPromptFeedback(snapshot)) return false;
  return snapshot.participantConfirmations.every((confirmation) => confirmation.submittedFeedback);
}

export function canAutoCompleteExchange() {
  return false;
}
