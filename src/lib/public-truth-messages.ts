import type {AbstractIntlMessages} from "next-intl";

type MessageTree = Record<string, unknown>;

const PUBLIC_TRUTH_OVERRIDES: Record<string, string> = {
  "about.storyP2": "Swaply is designed for people who want to arrange direct exchanges across supported locales.",
  "about.techDescription": "Swaply is built with Next.js, React, Supabase, and Tailwind CSS and is hosted on Vercel.",
  "about.metaDescription": "The story behind Swaply — a platform for discovering and arranging voluntary exchanges.",
  "footer.activeCities": "Swaply supports multiple locales.",
  "home.mapSubtitle": "Map visibility depends on the features currently available for your account.",
  "home.howStep2Title": "Find compatible listings",
  "home.howStep2Desc": "Compatibility tools help you review possible exchanges.",
  "home.howStep4Desc": "Agree directly on a local handover or another delivery arrangement.",
  "home.nudgeMatchesDesc": "Compatibility tools identified possible proposals for your objects.",
  "benefits.aiMatching": "Compatibility matching",
  "benefits.escrow": "Optional protection features are planned",
  "benefits.logistics": "Logistics coordination tools",
  "profile.guestFeatureVerify": "Account verification",
  "profile.guestFeatureVerifyDesc": "Available verification signals depend on the current account and production configuration.",
  "info.premiumPinsOnly": "Map visibility depends on current production configuration.",
  "info.premiumDescription": "Additional account features are not currently offered as a paid production plan.",
  "info.platinumDescription": "Additional account features are not currently offered as a paid production plan.",
  "info.featureMatches": "Compatibility suggestions",
  "info.faqA5": "Core swapping is currently offered without a platform commission. No paid production plan is currently offered on the public pricing page.",
  "info.guideStep3Title": "Browse or use compatibility tools",
  "info.guideStep3Text": "Browse listings and review compatibility suggestions where available.",
  "info.howStep2": "Find matches",
  "info.howStep2Desc": "Compatibility tools can suggest possible exchanges.",
  "info.howStep4Desc": "Agree directly on a local handover or another delivery arrangement.",
  "info.metaDescription": "Learn how Swaply works: post listings, review compatibility, chat and arrange voluntary exchanges.",
  "integrations.subtitle": "External-service foundations and planned integrations for Swaply",
  "integrations.activeMockReady": "Foundation / demo",
  "integrations.statusActive": "Foundation",
  "integrations.howItWorksDesc": "Provider entries may represent foundations, demos, disabled integrations or planned work. They are not proof of an operational production integration.",
  "integrations.activeMockDesc": "Foundation or simulated behavior only; not an operational production provider claim.",
  "integrations.needsKeyDesc": "Provider foundation only. Production activation is not implied.",
  "monetization.guestTitle": "Current access",
  "monetization.guestDescription": "Core Swaply access is currently free",
  "monetization.guestIntro": "Paid production plans are not currently offered on the public pricing page.",
  "monetization.planPremiumDesc": "Planned paid-plan concept; not currently offered in Production.",
  "monetization.planPlatinumDesc": "Planned paid-plan concept; not currently offered in Production.",
  "monetization.pricePremium": "Not offered",
  "monetization.pricePlatinum": "Not offered",
  "pricing.metaTitle": "Pricing — current Swaply access",
  "pricing.metaDescription": "Core Swaply access is currently free. Paid production plans are not currently offered.",
  "payments.secureCheckout": "Payment-provider foundations are not an active public checkout claim.",
  "match.guestAlgorithm": "Compatibility tools analyze several factors to suggest possible exchanges.",
  "match.guestHeroDescription": "Swaply reviews compatibility factors to help surface possible exchanges. Suggestions are not guarantees.",
  "match.autoModeTitle": "Compatibility mode",
  "match.autoModeDesc": "Compatibility tools prioritize possible matches based on available signals.",
  "matching.ai_title": "Find matches you might have missed",
  "matching.ai_button": "Find matches",
  "matching.ai_badge": "Suggested",
  "chat.guestHeroDescription": "Swaply provides in-platform conversations with safety controls. Available moderation and translation behavior depends on current production configuration.",
  "chat.guestFeature1": "In-platform conversations",
  "change.demoNote": "Some logistics and provider-assisted features remain demo, foundation, disabled or planned. Only demonstrated production behavior should be treated as live.",
  "change.typeCourierInternationalDesc": "Coordinate a cross-border delivery arrangement directly with the other participant.",
  "change.escrowTitle": "Protection concept",
  "change.escrowDescription": "Escrow or deposit functionality is not currently offered as an operational Production service.",
  "change.escrowBannerTitle": "Protection feature not active",
  "change.escrowBannerDesc": "No production escrow or good-faith deposit is currently offered by Swaply.",
  "exchange.summary.escrowAgreed": "Escrow preference recorded; no operational escrow provider is implied.",
  "exchange.summary.insuranceAgreed": "Insurance preference recorded; no operational insurance provider is implied.",
  "exchange.services.escrow": "Escrow — planned / unavailable",
  "exchange.services.insurance": "Insurance — planned / unavailable",
  "exchange.escrow.title": "Escrow — not currently available",
  "exchange.escrow.activate": "Unavailable",
  "exchange.escrow.how": "This is a product concept and is not an operational Production service.",
  "exchange.insurance.title": "Insurance — not currently available",
  "exchange.insurance.activate": "Unavailable",
  "onboarding.step2Title": "Discover matches",
  "onboarding.step2Desc": "Compatibility tools review available signals to suggest possible exchanges.",
  "onboarding.step4Desc": "Agree directly on a safe handover or delivery arrangement and confirm the exchange in Swaply.",
};

function cloneTree(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(cloneTree);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as MessageTree).map(([key, child]) => [key, cloneTree(child)]),
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
