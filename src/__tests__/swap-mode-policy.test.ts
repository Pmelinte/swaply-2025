import { describe, expect, it } from "vitest";
import {
  buildSwapModeExplanation,
  canAutoFinalizeSwap,
  canMoveToExchange,
  getMaximumParticipantCount,
  getMinimumParticipantCount,
  getSwapModeAssetDomains,
  hasAllParticipantConsent,
  hasRequiredParticipantCount,
  isCrossDomainSwapMode,
  isMultiParticipantSwapMode,
  requiresTokenAdjustment,
  validateSwapProposal,
} from "@/lib/swap-modes/swapModePolicy";
import { ADVANCED_SWAP_PROPOSAL_EXAMPLES } from "@/lib/swap-modes/swapModeSeeds";
import { SWAP_MODES } from "@/lib/swap-modes/swapModeTypes";

describe("advanced swap mode policy", () => {
  it("defines all required advanced swap modes", () => {
    expect(SWAP_MODES).toEqual([
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
    ]);
  });

  it("identifies multi-participant and cross-domain modes", () => {
    expect(isMultiParticipantSwapMode("circular_swap_3_users")).toBe(true);
    expect(isMultiParticipantSwapMode("one_to_one")).toBe(false);
    expect(isCrossDomainSwapMode("object_for_service")).toBe(true);
    expect(isCrossDomainSwapMode("one_to_one")).toBe(false);
  });

  it("uses participant limits that prevent incomplete circular proposals", () => {
    expect(getMinimumParticipantCount("circular_swap_3_users")).toBe(3);
    expect(getMaximumParticipantCount("circular_swap_3_users")).toBe(3);
    expect(getMinimumParticipantCount("swap_chain_4_or_5_users")).toBe(4);
    expect(getMaximumParticipantCount("swap_chain_4_or_5_users")).toBe(5);
  });

  it("does not allow exchange until all participants consent", () => {
    const circular = ADVANCED_SWAP_PROPOSAL_EXAMPLES[1];

    expect(hasRequiredParticipantCount(circular)).toBe(true);
    expect(hasAllParticipantConsent(circular)).toBe(false);
    expect(canMoveToExchange(circular)).toBe(false);
  });

  it("allows exchange readiness only after consent and required token adjustment", () => {
    const tokenAdjusted = ADVANCED_SWAP_PROPOSAL_EXAMPLES[2];

    expect(requiresTokenAdjustment(tokenAdjusted.mode)).toBe(true);
    expect(hasAllParticipantConsent(tokenAdjusted)).toBe(true);
    expect(canMoveToExchange(tokenAdjusted)).toBe(true);
  });

  it("blocks token-adjusted swaps without token adjustment", () => {
    const invalid = {
      ...ADVANCED_SWAP_PROPOSAL_EXAMPLES[2],
      tokenAdjustment: null,
    };

    expect(validateSwapProposal(invalid).valid).toBe(false);
    expect(canMoveToExchange(invalid)).toBe(false);
  });

  it("keeps AI explanation advisory and human-confirmed", () => {
    const explanation = buildSwapModeExplanation(ADVANCED_SWAP_PROPOSAL_EXAMPLES[0]);

    expect(explanation.advisoryOnly).toBe(true);
    expect(explanation.requiresHumanConfirmation).toBe(true);
    expect(explanation.summary).toContain("AI must not finalize");
  });

  it("never auto-finalizes any swap", () => {
    expect(canAutoFinalizeSwap()).toBe(false);
  });

  it("maps cross-domain asset domains", () => {
    expect(getSwapModeAssetDomains("object_for_property")).toEqual(["objects", "properties"]);
    expect(getSwapModeAssetDomains("event_bundle_swap")).toEqual(["events", "properties", "services"]);
    expect(getSwapModeAssetDomains("token_adjusted_swap")).toContain("tokens");
  });
});
