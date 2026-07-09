import { describe, expect, it } from "vitest";
import {
  canAutoCompleteExchange,
  canPromptFeedback,
  canPromptStory,
  canTransitionExchangeStatus,
  getExchangeCompletionGate,
  getMissingRequiredChecklistKeys,
  shouldReactivateItemsAfterExchangeFailure,
  shouldSuspendStory,
} from "@/lib/exchange-lifecycle/exchangeLifecyclePolicy";
import { EXCHANGE_LIFECYCLE_EXAMPLES } from "@/lib/exchange-lifecycle/exchangeLifecycleSeeds";
import { EXCHANGE_STATUSES, REQUIRED_EXCHANGE_CHECKLIST_KEYS } from "@/lib/exchange-lifecycle/exchangeLifecycleTypes";

describe("exchange lifecycle policy", () => {
  it("defines the expected exchange statuses and required checklist", () => {
    expect(EXCHANGE_STATUSES).toEqual([
      "proposed",
      "accepted",
      "in_progress",
      "shipped",
      "received",
      "completed",
      "cancelled",
      "disputed",
    ]);

    expect(REQUIRED_EXCHANGE_CHECKLIST_KEYS).toEqual([
      "condition_confirmed",
      "packaging_confirmed",
      "handoff_or_shipment_confirmed",
      "received_confirmed",
    ]);
  });

  it("allows only safe forward status transitions", () => {
    expect(canTransitionExchangeStatus("proposed", "accepted")).toBe(true);
    expect(canTransitionExchangeStatus("accepted", "in_progress")).toBe(true);
    expect(canTransitionExchangeStatus("received", "completed")).toBe(true);
    expect(canTransitionExchangeStatus("proposed", "completed")).toBe(false);
    expect(canTransitionExchangeStatus("completed", "disputed")).toBe(false);
  });

  it("allows completion only after received status, checklist and participant confirmations", () => {
    const ready = EXCHANGE_LIFECYCLE_EXAMPLES[0];
    const gate = getExchangeCompletionGate(ready);

    expect(gate.canComplete).toBe(true);
    expect(gate.missingChecklistKeys).toEqual([]);
    expect(gate.missingParticipantUserIds).toEqual([]);
    expect(gate.requiresHumanConfirmation).toBe(true);
  });

  it("blocks completion while received confirmation is missing", () => {
    const incomplete = EXCHANGE_LIFECYCLE_EXAMPLES[1];
    const gate = getExchangeCompletionGate(incomplete);

    expect(gate.canComplete).toBe(false);
    expect(getMissingRequiredChecklistKeys(incomplete)).toContain("received_confirmed");
    expect(gate.missingParticipantUserIds).toContain("demo-user-a");
    expect(gate.missingParticipantUserIds).toContain("demo-user-b");
  });

  it("reactivates items only after cancelled exchanges", () => {
    expect(shouldReactivateItemsAfterExchangeFailure({ ...EXCHANGE_LIFECYCLE_EXAMPLES[1], status: "cancelled" })).toBe(true);
    expect(shouldReactivateItemsAfterExchangeFailure(EXCHANGE_LIFECYCLE_EXAMPLES[0])).toBe(false);
  });

  it("suspends stories for disputed exchanges", () => {
    expect(shouldSuspendStory(EXCHANGE_LIFECYCLE_EXAMPLES[2])).toBe(true);
    expect(shouldSuspendStory(EXCHANGE_LIFECYCLE_EXAMPLES[0])).toBe(false);
  });

  it("prompts feedback only after completion and story only after feedback", () => {
    const completedWithoutFeedback = { ...EXCHANGE_LIFECYCLE_EXAMPLES[0], status: "completed" as const };
    const completedWithFeedback = {
      ...completedWithoutFeedback,
      participantConfirmations: completedWithoutFeedback.participantConfirmations.map((confirmation) => ({
        ...confirmation,
        submittedFeedback: true,
      })),
    };

    expect(canPromptFeedback(completedWithoutFeedback)).toBe(true);
    expect(canPromptStory(completedWithoutFeedback)).toBe(false);
    expect(canPromptStory(completedWithFeedback)).toBe(true);
  });

  it("never auto-completes an exchange", () => {
    expect(canAutoCompleteExchange()).toBe(false);
  });
});
