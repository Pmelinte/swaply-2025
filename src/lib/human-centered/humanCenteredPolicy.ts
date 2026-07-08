import type {
  HumanCenteredItemContext,
  MeaningMatchExplanation,
  MeaningMatchSignals,
  RecipientInterestContext,
} from "./humanCenteredTypes";

const SENSITIVE_DETAIL_PATTERNS = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu,
  /\b(?:\+?\d[\s.-]?){8,}\b/u,
  /\b(strada|street|st\.?|avenue|bulevardul|bd\.?|road|rd\.?)\s+[\p{L}0-9 .'-]+\s+\d+\b/iu,
  /\b\d{2}\.\d{4,},\s*\d{2}\.\d{4,}\b/u,
] as const;

export function isHumanContextOptional(context: Partial<HumanCenteredItemContext>) {
  return (
    !context.objectStory &&
    !context.whyISwapIt &&
    !context.preferredUseIntent &&
    !context.avoidImmediateResale &&
    !context.wantsRecipientMessage &&
    (!context.swapIntentions || context.swapIntentions.length === 0)
  );
}

export function containsSensitiveHumanContext(text: string | null | undefined) {
  if (!text) return false;
  return SENSITIVE_DETAIL_PATTERNS.some((pattern) => pattern.test(text));
}

export function sanitizeHumanContextText(text: string | null | undefined) {
  if (!text) return text ?? null;
  return SENSITIVE_DETAIL_PATTERNS.reduce((current, pattern) => current.replace(pattern, "[redacted]"), text);
}

export function getHumanContextPrivacyWarnings(context: Partial<HumanCenteredItemContext>) {
  const warnings: string[] = [];

  if (containsSensitiveHumanContext(context.objectStory)) {
    warnings.push("Object story contains contact, exact location or similarly sensitive details.");
  }

  if (containsSensitiveHumanContext(context.whyISwapIt)) {
    warnings.push("Swap reason contains contact, exact location or similarly sensitive details.");
  }

  if (context.storyVisibility === "public_story_after_consent") {
    warnings.push("Public stories require later consent from all required participants and moderation.");
  }

  return warnings;
}

export function buildMeaningMatchExplanation(input: {
  itemContext?: Partial<HumanCenteredItemContext>;
  interestContext?: Partial<RecipientInterestContext>;
  signals: MeaningMatchSignals;
}): MeaningMatchExplanation {
  const { signals, itemContext, interestContext } = input;
  const score = clampScore(
    Math.round(
      signals.economicFit * 0.15 +
        signals.logisticsFit * 0.15 +
        signals.categoryFit * 0.15 +
        signals.intentionFit * 0.2 +
        signals.sentimentalFit * 0.2 +
        signals.languageFit * 0.05 +
        signals.trustFit * 0.1 -
        signals.riskScore * 0.1,
    ),
  );

  const reasons: string[] = ["AI explanation is advisory only. The owner and requester decide."];

  if (itemContext?.secondLifeTag) reasons.push("The item is marked as a second-life object.");
  if (itemContext?.swapIntentions?.includes("meaningful_swap")) reasons.push("The owner is open to a meaningful swap, not only a value-balanced swap.");
  if (interestContext?.whyIWantIt) reasons.push("The requester provided a reason for wanting the item.");
  if (interestContext?.canRepairOrReuse) reasons.push("The requester says the item can be repaired or reused.");

  return {
    advisoryOnly: true,
    score,
    signals: normalizeSignals(signals),
    reasons,
    privacyNotes: [
      "Do not share exact address or direct contact details before both people agree.",
      "Sentimental context is optional and should never be required.",
    ],
    humanDecisionRequired: true,
  };
}

function normalizeSignals(signals: MeaningMatchSignals): MeaningMatchSignals {
  return {
    economicFit: clampScore(signals.economicFit),
    logisticsFit: clampScore(signals.logisticsFit),
    categoryFit: clampScore(signals.categoryFit),
    intentionFit: clampScore(signals.intentionFit),
    sentimentalFit: clampScore(signals.sentimentalFit),
    languageFit: clampScore(signals.languageFit),
    trustFit: clampScore(signals.trustFit),
    riskScore: clampScore(signals.riskScore),
  };
}

function clampScore(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
}
