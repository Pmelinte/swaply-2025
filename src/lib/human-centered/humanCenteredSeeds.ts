import type { HumanCenteredItemContext, RecipientInterestContext } from "./humanCenteredTypes";

export const HUMAN_CENTERED_ITEM_CONTEXT_EXAMPLES = [
  {
    sentimentalValueLevel: "medium",
    objectStory: "This camera was used for travel photos and deserves a second life instead of staying in a drawer.",
    whyISwapIt: "I no longer use it and prefer someone to use it creatively.",
    preferredUseIntent: "creative_project",
    avoidImmediateResale: true,
    wantsRecipientMessage: true,
    storyVisibility: "exchange_partner",
    swapIntentions: ["meaningful_swap", "second_life"],
    secondLifeTag: true,
  },
  {
    sentimentalValueLevel: "low",
    objectStory: null,
    whyISwapIt: "I want a practical and quick swap with clear logistics.",
    preferredUseIntent: "direct_use",
    avoidImmediateResale: false,
    wantsRecipientMessage: false,
    storyVisibility: "private",
    swapIntentions: ["quick_practical_swap", "balanced_value"],
    secondLifeTag: false,
  },
] as const satisfies readonly HumanCenteredItemContext[];

export const RECIPIENT_INTEREST_EXAMPLES = [
  {
    itemId: "demo-camera",
    requesterId: "demo-requester-one",
    whyIWantIt: "I want to use it for a small creative project and can pick it up locally.",
    intendedUse: "creative_project",
    canRepairOrReuse: false,
    agreesToOwnerPreference: true,
  },
  {
    itemId: "demo-chair",
    requesterId: "demo-requester-two",
    whyIWantIt: "I can repair and reuse it instead of buying something new.",
    intendedUse: "repair_or_reuse",
    canRepairOrReuse: true,
    agreesToOwnerPreference: true,
  },
] as const satisfies readonly RecipientInterestContext[];
