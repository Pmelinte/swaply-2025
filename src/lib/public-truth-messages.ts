import type { AbstractIntlMessages } from "next-intl";

type MessageTree = Record<string, unknown>;

const UNAVAILABLE = "Not currently offered in Production.";
const PROVIDER_FOUNDATION =
  "Provider foundation only. Production activation is not implied.";
const VERIFICATION_BOUNDARY =
  "Available verification signals depend on the current account and production configuration.";
const MODERATION_BOUNDARY =
  "Safety and moderation behavior depends on the current production configuration.";

const PUBLIC_TRUTH_OVERRIDES: Record<string, string> = {
  "about.storyP2":
    "Swaply is designed for people who want to arrange direct exchanges across supported locales.",
  "about.techDescription":
    "Swaply is built with Next.js, React, Supabase, and Tailwind CSS and is hosted on Vercel.",
  "about.metaDescription":
    "The story behind Swaply — a platform for discovering and arranging voluntary exchanges.",
  "footer.activeCities": "Swaply supports multiple locales.",

  "home.mapSubtitle":
    "Map visibility depends on the features currently available for your account.",
  "home.howStep2Title": "Find compatible listings",
  "home.howStep2Desc":
    "Compatibility tools help you review possible exchanges.",
  "home.howStep4Desc":
    "Agree directly on a local handover or another delivery arrangement.",
  "home.nudgeMatchesDesc":
    "Compatibility tools identified possible proposals for your objects.",

  "benefits.aiMatching": "Compatibility matching",
  "benefits.escrow": "Optional protection features are planned",
  "benefits.logistics": "Logistics coordination tools",

  "profile.guestFeatureVerify": "Account verification",
  "profile.guestFeatureVerifyDesc": VERIFICATION_BOUNDARY,
  "profile.verificationDesc": VERIFICATION_BOUNDARY,
  "profile.idVerified": "Identity verification signal",
  "profile.idNotVerified": "Identity verification not available",
  "profile.selfieVerified": "Selfie verification signal",
  "profile.selfieNotVerified": "Selfie verification not available",
  "profile.idVerifyTitle": "Identity verification",
  "profile.idVerifyDesc": UNAVAILABLE,
  "profile.idUploadPlaceholder": UNAVAILABLE,
  "profile.selfieVerifyTitle": "Selfie verification",
  "profile.selfieVerifyDesc": UNAVAILABLE,
  "profile.selfieUploadPlaceholder": UNAVAILABLE,
  "profile.submitDocument": "Unavailable",
  "profile.documentPending": UNAVAILABLE,
  "profile.badgeIdentityConfirmed": "Identity signal",
  "profile.badgeVerifiedUser": "Verification signal",

  "info.premiumPinsOnly":
    "Map visibility depends on current production configuration.",
  "info.premiumDescription":
    "Additional account features are not currently offered as a paid production plan.",
  "info.platinumDescription":
    "Additional account features are not currently offered as a paid production plan.",
  "info.featureMatches": "Compatibility suggestions",
  "info.faqA5":
    "Core swapping is currently offered without a platform commission. No paid production plan is currently offered on the public pricing page.",
  "info.guideStep3Title": "Browse or use compatibility tools",
  "info.guideStep3Text":
    "Browse listings and review compatibility suggestions where available.",
  "info.howStep2": "Find matches",
  "info.howStep2Desc":
    "Compatibility tools can suggest possible exchanges.",
  "info.howStep4Desc":
    "Agree directly on a local handover or another delivery arrangement.",
  "info.metaDescription":
    "Learn how Swaply works: post listings, review compatibility, chat and arrange voluntary exchanges.",
  "info.successStories": "Example exchange stories",
  "info.successStoriesDesc":
    "Illustrative examples only unless a story is explicitly identified as verified.",
  "info.costSaved": "Potential savings depend on the exchange",
  "info.sustainabilityNote":
    "Environmental impact varies by item and exchange; no universal per-item CO₂ saving is claimed.",
  "info.badgeBenefitsDescription":
    "Account benefits depend on the current production configuration.",

  "integrations.subtitle":
    "External-service foundations and planned integrations for Swaply",
  "integrations.activeMockReady": "Foundation / demo",
  "integrations.statusActive": "Foundation",
  "integrations.howItWorksDesc":
    "Provider entries may represent foundations, demos, disabled integrations or planned work. They are not proof of an operational production integration.",
  "integrations.activeMockDesc":
    "Foundation or simulated behavior only; not an operational production provider claim.",
  "integrations.needsKeyDesc": PROVIDER_FOUNDATION,
  "integrations.affiliateDesc": PROVIDER_FOUNDATION,
  "integrations.affiliateLinks": "Provider links",

  "monetization.guestTitle": "Current access",
  "monetization.guestDescription": "Core Swaply access is currently free",
  "monetization.guestIntro":
    "Paid production plans are not currently offered on the public pricing page.",
  "monetization.planPremiumDesc":
    "Planned paid-plan concept; not currently offered in Production.",
  "monetization.planPlatinumDesc":
    "Planned paid-plan concept; not currently offered in Production.",
  "monetization.pricePremium": "Not offered",
  "monetization.pricePlatinum": "Not offered",
  "monetization.upgrade": "Unavailable",
  "monetization.buyTokens": "Unavailable",
  "monetization.buy": "Unavailable",
  "monetization.orPaypal": "Payment option unavailable",
  "monetization.paypalRedirect": UNAVAILABLE,
  "monetization.paypalError": UNAVAILABLE,
  "monetization.networkError": "Payment functionality is unavailable in Production.",
  "monetization.verifiedBadge": "Verification concept",
  "monetization.verifiedBadgeDesc": UNAVAILABLE,
  "monetization.verifiedActivated": UNAVAILABLE,
  "monetization.businessAccount": "Business account concept",
  "monetization.businessAccountDesc": UNAVAILABLE,
  "monetization.businessActivated": UNAVAILABLE,

  "pricing.subtitle": "Core swapping access is currently free.",
  "pricing.metaTitle": "Pricing — current Swaply access",
  "pricing.metaDescription":
    "Core Swaply access is currently free. Paid production plans are not currently offered.",
  "pricing.paymentSuccess": UNAVAILABLE,
  "pricing.paymentCanceled": UNAVAILABLE,
  "pricing.manageSubscription": "Unavailable",
  "pricing.includedInPlatinum": "Planned feature",
  "pricing.premiumPrice": "Not offered",
  "pricing.premiumYearly": "Not offered",
  "pricing.premiumIncludes": "Planned paid-plan concept:",
  "pricing.premium1": "Planned feature",
  "pricing.premium2": "Planned feature",
  "pricing.premium3": "Planned feature",
  "pricing.premium4": "Planned feature",
  "pricing.premium5": "Planned feature",
  "pricing.premium6": "Planned feature",
  "pricing.premiumButton": "Unavailable",
  "pricing.businessPrice": "Not offered",
  "pricing.businessIncludes": "Planned business-plan concept:",
  "pricing.business1": "Planned feature",
  "pricing.business2": "Planned feature",
  "pricing.business3": "Planned feature",
  "pricing.business4": "Planned feature",
  "pricing.businessButton": "Contact us",

  "payments.paymentMethod": "Payment-provider foundation",
  "payments.cardStripe": PROVIDER_FOUNDATION,
  "payments.paypalError": UNAVAILABLE,
  "payments.paypalCaptureFailed": UNAVAILABLE,
  "payments.orPaypal": "Payment option unavailable",
  "payments.processing": UNAVAILABLE,
  "payments.secureCheckout":
    "Payment-provider foundations are not an active public checkout claim.",

  "adBanner.premiumCta":
    "Paid production plans are not currently offered.",
  "adBanner.upgradeNow": "Unavailable",

  "boost.paymentError": UNAVAILABLE,
  "boost.paymentFailed": UNAVAILABLE,
  "boost.stripeUnavailable": UNAVAILABLE,
  "boost.securePayment":
    "Paid boost checkout is not currently offered in Production.",
  "boost.boost7days": "Planned boost option",
  "boost.boost24h": "Planned boost option",
  "boost.boost72h": "Planned boost option",

  "match.guestAlgorithm":
    "Compatibility tools analyze several factors to suggest possible exchanges.",
  "match.guestHeroDescription":
    "Swaply reviews compatibility factors to help surface possible exchanges. Suggestions are not guarantees.",
  "match.autoModeTitle": "Compatibility mode",
  "match.autoModeDesc":
    "Compatibility tools prioritize possible matches based on available signals.",
  "matching.ai_title": "Find matches you might have missed",
  "matching.ai_button": "Find matches",
  "matching.ai_badge": "Suggested",

  "chat.rulesDescription": MODERATION_BOUNDARY,
  "chat.attachmentsScanned":
    "Attachment handling depends on the current production configuration.",
  "chat.guestHeroDescription":
    "Swaply provides in-platform conversations with safety controls. Available moderation and translation behavior depends on current production configuration.",
  "chat.guestFeature1": "In-platform conversations",
  "chat.guestFeature2": "Conversation history",
  "chat.guestFeature3": "Conversation attachments where available",
  "chat.guestFeature4": "Safety controls where available",
  "chat.safetyWarning":
    "Keep conversations respectful and use the available reporting tools when needed.",

  "change.demoNote":
    "Some logistics and provider-assisted features remain demo, foundation, disabled or planned. Only demonstrated production behavior should be treated as live.",
  "change.safetyDescription":
    "Map and notification behavior depends on the current production configuration.",
  "change.typeCourierInternationalDesc":
    "Coordinate a cross-border delivery arrangement directly with the other participant.",
  "change.escrowTitle": "Protection concept",
  "change.escrowDescription":
    "Escrow or deposit functionality is not currently offered as an operational Production service.",
  "change.escrowBannerTitle": "Protection feature not active",
  "change.escrowBannerDesc":
    "No production escrow or good-faith deposit is currently offered by Swaply.",
  "change.escrowPayButton": "Unavailable",
  "change.escrowStatusPending": UNAVAILABLE,
  "change.escrowStatusHeld": UNAVAILABLE,
  "change.escrowStatusReleased": UNAVAILABLE,
  "change.escrowStatusDisputed": UNAVAILABLE,
  "change.escrowBothHeld": UNAVAILABLE,
  "change.escrowReleased": UNAVAILABLE,
  "change.escrowNote": UNAVAILABLE,
  "change.houseModeDesc_one_way_hosting":
    "One-way hosting concept; no token compensation is implied.",
  "change.courierDescription":
    "Participants can coordinate shipping details directly where applicable.",
  "change.shipmentSectionDesc":
    "Participants can record delivery details where the current production flow supports them.",
  "change.openTracking": "Open provided tracking reference",
  "change.bothDelivered":
    "Completion still depends on the current bilateral exchange workflow.",
  "change.travelDesc":
    "Travel coordination is handled directly by participants; no provider integration is implied.",

  "exchange.summary.escrowAgreed":
    "Escrow preference recorded; no operational escrow provider is implied.",
  "exchange.summary.insuranceAgreed":
    "Insurance preference recorded; no operational insurance provider is implied.",
  "exchange.services.escrow": "Escrow — planned / unavailable",
  "exchange.services.insurance": "Insurance — planned / unavailable",
  "exchange.escrow.title": "Escrow — not currently available",
  "exchange.escrow.activate": "Unavailable",
  "exchange.escrow.how":
    "This is a product concept and is not an operational Production service.",
  "exchange.escrow.plans.basic": "Concept only",
  "exchange.escrow.plans.plus": "Concept only",
  "exchange.escrow.plans.full": "Concept only",
  "exchange.escrow.step1": "Concept only",
  "exchange.escrow.step2": "Concept only",
  "exchange.escrow.step3": "Concept only",
  "exchange.insurance.title": "Insurance — not currently available",
  "exchange.insurance.activate": "Unavailable",
  "exchange.insurance.coverageBasic": "Concept only",
  "exchange.insurance.coverageStandard": "Concept only",
  "exchange.insurance.coveragePremium": "Concept only",
  "exchange.transport.orderPickup": "Coordinate pickup directly",

  "legal.termsModerationText": MODERATION_BOUNDARY,
  "legal.termsContactText":
    "For questions about these terms, contact us at support@swaply.world.",
  "legal.privacySharingText":
    "Service-provider processing depends on the current production configuration and applicable privacy documentation. Public profile information follows the user's visibility settings.",
  "legal.privacyContactText":
    "For privacy requests, contact privacy@swaply.world.",
  "legal.cookiesContactText":
    "For questions about our cookie policy, contact privacy@swaply.world.",
  "legal.safetyGeneralText":
    "Use caution, keep communication on-platform when possible, protect sensitive information, and review available profile and exchange signals before proceeding.",
  "legal.safetyMeetingText":
    "Meet in a public, well-lit place, consider bringing another person, inspect the item before confirming, and use only confirmation features that are actually available in the current production flow.",
  "legal.safetyReportingText":
    "Use available Report and Block controls for suspicious content or behavior. Review timing is not guaranteed. For urgent safety concerns, contact local authorities first.",
  "legal.safetyContactText":
    "For safety questions, use the available support or reporting channels. For urgent situations, contact local emergency services first.",

  "onboarding.step2Title": "Discover matches",
  "onboarding.step2Desc":
    "Compatibility tools review available signals to suggest possible exchanges.",
  "onboarding.step3Desc":
    "Use the in-platform conversation tools and available safety controls to agree on exchange details.",
  "onboarding.step4Desc":
    "Agree directly on a safe handover or delivery arrangement and confirm the exchange in Swaply.",
  "onboardingChecklist.stepVerifiedLabel": "Review account security",
  "onboardingChecklist.stepVerifiedDesc":
    "Use security and verification options that are actually available for your account.",
};

function cloneTree(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(cloneTree);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as MessageTree).map(([key, child]) => [
        key,
        cloneTree(child),
      ]),
    );
  }
  return value;
}

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

export function sanitizePublicTruthMessages(
  messages: AbstractIntlMessages,
): AbstractIntlMessages {
  const sanitized = cloneTree(messages) as MessageTree;
  for (const [path, value] of Object.entries(PUBLIC_TRUTH_OVERRIDES)) {
    setPath(sanitized, path, value);
  }
  return sanitized as AbstractIntlMessages;
}

export const PUBLIC_TRUTH_OVERRIDE_PATHS = Object.freeze(
  Object.keys(PUBLIC_TRUTH_OVERRIDES),
);
