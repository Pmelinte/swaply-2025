import type {
  AdvancedSwapProposal,
  SwapAssetDomain,
  SwapMode,
  SwapModeExplanation,
  SwapParticipant,
} from "./swapModeTypes";
import { CROSS_DOMAIN_SWAP_MODES, MULTI_PARTICIPANT_SWAP_MODES } from "./swapModeTypes";

export function isMultiParticipantSwapMode(mode: SwapMode) {
  return MULTI_PARTICIPANT_SWAP_MODES.includes(mode);
}

export function isCrossDomainSwapMode(mode: SwapMode) {
  return CROSS_DOMAIN_SWAP_MODES.includes(mode);
}

export function requiresTokenAdjustment(mode: SwapMode) {
  return mode === "token_adjusted_swap";
}

export function getMinimumParticipantCount(mode: SwapMode) {
  if (mode === "circular_swap_3_users") return 3;
  if (mode === "swap_chain_4_or_5_users") return 4;
  return 2;
}

export function getMaximumParticipantCount(mode: SwapMode) {
  if (mode === "circular_swap_3_users") return 3;
  if (mode === "swap_chain_4_or_5_users") return 5;
  return 2;
}

export function hasRequiredParticipantCount(proposal: AdvancedSwapProposal) {
  const minimum = getMinimumParticipantCount(proposal.mode);
  const maximum = getMaximumParticipantCount(proposal.mode);
  return proposal.participants.length >= minimum && proposal.participants.length <= maximum;
}

export function hasAllParticipantConsent(proposal: AdvancedSwapProposal) {
  return proposal.participants.every((participant) =>
    participant.status === "accepted" ||
    participant.status === "confirmed" ||
    participant.status === "completed",
  );
}

export function canMoveToExchange(proposal: AdvancedSwapProposal) {
  if (!proposal.requiresAllParticipantConsent) return false;
  if (!hasRequiredParticipantCount(proposal)) return false;
  if (!hasAllParticipantConsent(proposal)) return false;
  if (requiresTokenAdjustment(proposal.mode) && !proposal.tokenAdjustment) return false;
  if (proposal.status === "cancelled" || proposal.status === "disputed") return false;
  return true;
}

export function canAutoFinalizeSwap() {
  return false;
}

export function getSwapModeAssetDomains(mode: SwapMode): readonly SwapAssetDomain[] {
  switch (mode) {
    case "object_for_service":
      return ["objects", "services"];
    case "object_for_property":
      return ["objects", "properties"];
    case "object_for_event":
      return ["objects", "events"];
    case "service_for_service":
      return ["services"];
    case "property_for_property":
      return ["properties"];
    case "event_bundle_swap":
      return ["events", "properties", "services"];
    case "token_adjusted_swap":
      return ["objects", "properties", "services", "events", "tokens"];
    default:
      return ["objects"];
  }
}

export function participantHasGiveAndReceiveLeg(participant: SwapParticipant) {
  return participant.givesAssetIds.length > 0 && participant.receivesAssetIds.length > 0;
}

export function validateSwapProposal(proposal: AdvancedSwapProposal) {
  const errors: string[] = [];

  if (!hasRequiredParticipantCount(proposal)) {
    errors.push(`Mode ${proposal.mode} requires ${getMinimumParticipantCount(proposal.mode)}-${getMaximumParticipantCount(proposal.mode)} participants.`);
  }

  if (!proposal.participants.every(participantHasGiveAndReceiveLeg)) {
    errors.push("Every participant must have at least one give leg and one receive leg before exchange.");
  }

  if (requiresTokenAdjustment(proposal.mode) && !proposal.tokenAdjustment) {
    errors.push("Token-adjusted swaps require an explicit token adjustment record.");
  }

  if (!proposal.requiresAllParticipantConsent) {
    errors.push("Advanced swap proposals must require consent from all participants.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function buildSwapModeExplanation(proposal: AdvancedSwapProposal): SwapModeExplanation {
  const validation = validateSwapProposal(proposal);
  const reasons = [
    `Swap mode: ${proposal.mode}.`,
    isMultiParticipantSwapMode(proposal.mode)
      ? "This is a multi-participant swap and needs every participant to accept before exchange."
      : "This is a direct or cross-domain swap and still needs human confirmation.",
  ];

  if (proposal.tokenAdjustment) {
    reasons.push(`Token adjustment present: ${proposal.tokenAdjustment.amount} swapleni.`);
  }

  return {
    advisoryOnly: true,
    summary: validation.valid
      ? "This proposal can be reviewed by the participants. AI must not finalize it automatically."
      : "This proposal is incomplete and must be repaired before exchange.",
    reasons,
    risks: validation.errors.length > 0
      ? validation.errors
      : ["Do not finalize until the participants confirm condition, logistics and timing."],
    requiresHumanConfirmation: true,
  };
}
