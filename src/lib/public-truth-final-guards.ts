import type { AbstractIntlMessages } from "next-intl";

type MessageTree = Record<string, unknown>;

const NOT_OFFERED = "Not currently offered in Production.";
const FOUNDATION =
  "Foundation or planned capability; Production availability is not implied.";
const COMPATIBILITY =
  "Compatibility tools use available listing signals to suggest possible exchanges.";
const CONVERSATION =
  "Use Swaply's in-platform conversation tools and available safety controls.";
const DELIVERY =
  "Participants arrange handover or delivery directly using options available in the current flow.";

const FINAL_PUBLIC_TRUTH_OVERRIDES: Readonly<Record<string, string>> = {
  "home.howStep3Desc": CONVERSATION,
  "home.actionMatch": "Find matches",

  "objects.metaDescription":
    "Browse object listings, review compatibility and arrange voluntary exchanges on Swaply.",
  "objects.aiAnalyzesCompatibility": COMPATIBILITY,

  "objectWizard.aiAutoFill": FOUNDATION,
  "objectWizard.aiDescription": FOUNDATION,
  "objectWizard.aiValueEstimate": FOUNDATION,
  "objectWizard.aiCategory": FOUNDATION,
  "objectWizard.aiTags": FOUNDATION,

  "itemForm.aiAnalysis": FOUNDATION,
  "itemForm.aiAnalyzing":
    "Analysis tools depend on the current Production configuration.",
  "itemForm.aiCategory": FOUNDATION,
  "itemForm.aiTags": FOUNDATION,
  "itemForm.aiConfidence": "Automated confidence indicator",
  "itemForm.aiGenerateDescription": FOUNDATION,
  "itemForm.aiGeneratedDescription": FOUNDATION,
  "itemForm.aiValueEstimate": FOUNDATION,
  "itemForm.estimatedValue":
    "Approximate value entered or reviewed by the user",

  "match.aiTop3": "Suggested matches",
  "match.aiUnavailable": "Compatibility suggestions are currently unavailable.",
  "match.aiDescription": COMPATIBILITY,
  "match.aiReason": "Compatibility reason",
  "match.semanticAi": "Compatibility suggestions",
  "match.poweredByAi": "Based on available listing signals",

  "chat.description": CONVERSATION,
  "chat.moderated": "Safety controls where available",
  "chat.secureChat": "In-platform conversation",
  "chat.translation":
    "Translation availability depends on current Production configuration.",
  "chat.aiSummary": FOUNDATION,
  "chat.aiSummaryDescription": FOUNDATION,

  "aiAssist.dailyLimitReached":
    "This assistance feature is currently unavailable or limited.",
  "aiAssist.upgradeForMore": "Additional paid access is not currently offered.",

  "change.guestHeroDescription":
    "Coordinate the exchange steps available in the current Production flow.",
  "change.guestStep3Desc": DELIVERY,
  "change.guestStep5Desc":
    "Confirm completion using the current exchange workflow.",
  "change.courierFanCourier":
    "Courier option — provider not activated by this claim",
  "change.courierSameday":
    "Courier option — provider not activated by this claim",
  "change.courierCargus":
    "Courier option — provider not activated by this claim",
  "change.courierDHL": "Courier option — provider not activated by this claim",
  "change.courierDomestic": DELIVERY,
  "change.courierInternational": DELIVERY,
  "change.recommendedCourier": "Delivery option",
  "change.trackingDescription":
    "A tracking reference may be recorded when participants have one; no live carrier integration is implied.",
  "change.houseInsuranceDesc":
    "Insurance is not currently offered as an operational Swaply service.",
  "change.bonusTokens": "No completion bonus is currently promised.",

  "profile.badgeBenefitsDescription":
    "Account features depend on the current Production configuration.",
  "profile.tokenShopDesc":
    "Paid or token-based premium features are not currently offered publicly.",

  "info.howStep3Desc": CONVERSATION,
  "info.discoverMatchesDescription": COMPATIBILITY,
  "info.featurePriorityMatch": "Compatibility suggestions",
  "info.featureAnalytics": "Account activity information where available",
  "info.featureSupport": "Support channels currently available on Swaply",
  "info.premiumTitle": "Planned paid-plan concept",
  "info.platinumTitle": "Planned paid-plan concept",
  "info.tokensTitle": "Token concept",
  "info.tokensDescription": NOT_OFFERED,

  "statsGrid.premiumPercentage": "Paid-plan statistic unavailable",
  "statsGrid.premiumDescription":
    "No paid Production plan is currently offered.",

  "map.premiumVisibility":
    "Map visibility depends on current Production configuration.",

  "premium.title": "Paid-plan concept",
  "premium.subtitle": "Not currently offered in Production.",

  "analytics.upgradeToPremium":
    "Paid analytics access is not currently offered in Production.",
  "badge.premium": "Planned paid tier",
  "badge.platinum": "Planned paid tier",

  "serviceWizard.step4EscrowLabel": "Escrow — not currently available",
  "serviceWizard.escrowLabel": "Escrow — not currently available",
  "propertyWizard.step6EscrowAcceptedLabel":
    "Escrow — not currently available",
  "propertyWizard.step6EscrowRequiredLabel":
    "Escrow — not currently available",
  "propertyWizard.step6DepositLabel":
    "Deposit protection — not currently available",
  "propertyWizard.partialTopup": NOT_OFFERED,
  "eventWizard.step4EscrowLabel": "Escrow — not currently available",
  "eventWizard.partialTopup": NOT_OFFERED,
  "eventWizard.pointsTopup": NOT_OFFERED,

  "exchange.insuranceTitle": "Insurance concept — not currently available",
  "exchange.insurancePlan": "Insurance option — not currently available",
  "exchange.insuranceCoverageBasic": NOT_OFFERED,
  "exchange.insuranceCoverageStandard": NOT_OFFERED,
  "exchange.insuranceCoveragePremium": NOT_OFFERED,
  "exchange.activateInsurance": NOT_OFFERED,
  "exchange.insurance.title": "Insurance concept — not currently available",
  "exchange.insurance.plan": "Insurance option — not currently available",
  "exchange.insurance.coverageBasic": NOT_OFFERED,
  "exchange.insurance.coverageStandard": NOT_OFFERED,
  "exchange.insurance.coveragePremium": NOT_OFFERED,
  "exchange.insurance.activate": NOT_OFFERED,
  "exchange.pdf.disclaimer":
    "This document summarizes participant-provided exchange information. It does not prove activation or endorsement of any external provider.",
  "exchange.services.aiValuation":
    "Automated valuation concept — availability depends on Production configuration.",
  "exchange.services.courier":
    "Delivery coordination — no carrier integration implied",
  "exchange.services.tracking":
    "Tracking reference — no live carrier integration implied",

  "contact.responseTime":
    "Response times vary; no fixed response-time guarantee is stated.",
  "contact.respondWithin24Hours":
    "Response times vary; no fixed response-time guarantee is stated.",
  "contact.successText":
    "Your message was received. Response times vary; no fixed response-time guarantee is stated.",

  "legal.dmcaResponseTime":
    "Requests are reviewed according to the applicable process; no fixed response-time guarantee is stated.",
  "legal.dmcaContactText":
    "DMCA notices are reviewed according to the applicable process; no fixed response-time guarantee is stated.",
  "legal.dmcaRepeatInfringer":
    "Repeat-infringer handling follows the applicable policy and legal requirements.",
};

const UNSAFE_TEXT_RULES: ReadonlyArray<{
  pattern: RegExp;
  replacement: string;
}> = [
  {
    pattern: /\bAI will auto-fill\b/gi,
    replacement:
      "Automated assistance depends on the current Production configuration",
  },
  {
    pattern: /\bTop 3 AI Picks\b/gi,
    replacement: "Suggested matches",
  },
  {
    pattern: /\bSemantic AI\b/gi,
    replacement: "Compatibility suggestions",
  },
  {
    pattern: /\bsecure(?: moderated)? chat\b/gi,
    replacement: "in-platform conversation",
  },
  {
    pattern: /\bfull protection\b/gi,
    replacement: "available exchange controls",
  },
  {
    pattern: /\b30 bonus tokens\b/gi,
    replacement: "no completion bonus is currently promised",
  },
  {
    pattern: /\brecommended courier\b/gi,
    replacement: "delivery option",
  },
  {
    pattern: /\bupgrade to premium\b/gi,
    replacement: "paid Production plan not currently offered",
  },
  {
    pattern: /\bpremium and platinum users are visible on the map\b/gi,
    replacement: "map visibility depends on current Production configuration",
  },
  {
    pattern: /\bglobal visibility\s*[·•-]\s*priority matching\b/gi,
    replacement: "paid Production plan not currently offered",
  },
  {
    pattern: /\bdiscover premium and platinum advantages\b/gi,
    replacement: "account features depend on current Production configuration",
  },
  {
    pattern: /\bspend your earned tokens on boosts and premium features\b/gi,
    replacement:
      "paid or token-based premium features are not currently offered publicly",
  },
  {
    pattern: /\baccept escrow\b/gi,
    replacement: "escrow not currently available",
  },
  {
    pattern: /\brequires escrow\b/gi,
    replacement: "escrow not currently available",
  },
  {
    pattern: /\bwe(?:'ll| will)?(?: get back to you| respond)? within 24 hours\b/gi,
    replacement: "response times vary",
  },
  {
    pattern: /\b(?:within|please allow) 2[-–]3 business days\b/gi,
    replacement: "according to the applicable review process",
  },
  {
    pattern: /\blet AI find matches\b/gi,
    replacement: "review compatibility suggestions",
  },
  {
    pattern: /\bUp to €(?:200|500|2000)\b/gi,
    replacement: NOT_OFFERED,
  },
];

function setPath(root: MessageTree, path: string, value: string) {
  const parts = path.split(".");
  let cursor = root;

  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index];
    const next = cursor[part];
    if (!next || typeof next !== "object" || Array.isArray(next)) return;
    cursor = next as MessageTree;
  }

  const leaf = parts.at(-1);
  if (leaf && Object.prototype.hasOwnProperty.call(cursor, leaf)) {
    cursor[leaf] = value;
  }
}

function sanitizeStrings(value: unknown): unknown {
  if (typeof value === "string") {
    let result = value;
    for (const rule of UNSAFE_TEXT_RULES) {
      result = result.replace(rule.pattern, rule.replacement);
    }
    return result;
  }

  if (Array.isArray(value)) return value.map(sanitizeStrings);

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as MessageTree).map(([key, child]) => [
        key,
        sanitizeStrings(child),
      ]),
    );
  }

  return value;
}

export function applyFinalPublicTruthGuards(
  messages: AbstractIntlMessages,
): AbstractIntlMessages {
  const guarded = sanitizeStrings(messages) as MessageTree;

  for (const [path, value] of Object.entries(FINAL_PUBLIC_TRUTH_OVERRIDES)) {
    setPath(guarded, path, value);
  }

  return guarded as AbstractIntlMessages;
}

export const FINAL_PUBLIC_TRUTH_OVERRIDE_PATHS = Object.freeze(
  Object.keys(FINAL_PUBLIC_TRUTH_OVERRIDES),
);
