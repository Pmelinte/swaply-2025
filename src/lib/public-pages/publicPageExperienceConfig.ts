export const PUBLIC_EXPERIENCE_PAGES = [
  "home",
  "objects",
  "explore",
  "properties",
  "services",
  "events",
  "matching",
  "messages",
  "chat",
  "exchange",
  "profile",
] as const;

export type PublicExperiencePage = (typeof PUBLIC_EXPERIENCE_PAGES)[number];

export type PublicExperienceBlock =
  | "hero"
  | "preview"
  | "how_it_works"
  | "what_unlocks_after_login"
  | "trust_and_safety"
  | "guide_cards"
  | "story_preview"
  | "contextual_cta";

export interface PublicPageExperienceConfig {
  page: PublicExperiencePage;
  titleKey: string;
  descriptionKey?: string;
  requiredBlocks: PublicExperienceBlock[];
  contextualCtaKey: string;
  loginRequiredOnlyForRealActions: boolean;
  globallyDiverseExamples: boolean;
  blogGuidesAllowed: boolean;
  storiesAllowed: boolean;
}

export const publicPageExperienceConfigs: Record<PublicExperiencePage, PublicPageExperienceConfig> = {
  home: {
    page: "home",
    titleKey: "home.guestHeadline",
    descriptionKey: "home.guestSubtitle",
    requiredBlocks: ["hero", "how_it_works", "preview", "guide_cards", "story_preview", "contextual_cta"],
    contextualCtaKey: "home.createFreeAccount",
    loginRequiredOnlyForRealActions: true,
    globallyDiverseExamples: true,
    blogGuidesAllowed: true,
    storiesAllowed: true,
  },
  objects: {
    page: "objects",
    titleKey: "branches.objects",
    descriptionKey: "branches.objectsDesc",
    requiredBlocks: ["hero", "preview", "what_unlocks_after_login", "trust_and_safety", "guide_cards", "contextual_cta"],
    contextualCtaKey: "nav.addObject",
    loginRequiredOnlyForRealActions: true,
    globallyDiverseExamples: true,
    blogGuidesAllowed: true,
    storiesAllowed: true,
  },
  explore: {
    page: "explore",
    titleKey: "nav.explore",
    requiredBlocks: ["hero", "preview", "what_unlocks_after_login", "guide_cards", "contextual_cta"],
    contextualCtaKey: "common.search",
    loginRequiredOnlyForRealActions: true,
    globallyDiverseExamples: true,
    blogGuidesAllowed: true,
    storiesAllowed: true,
  },
  properties: {
    page: "properties",
    titleKey: "branches.properties",
    descriptionKey: "branches.propertiesDesc",
    requiredBlocks: ["hero", "preview", "what_unlocks_after_login", "trust_and_safety", "guide_cards", "story_preview", "contextual_cta"],
    contextualCtaKey: "common.search",
    loginRequiredOnlyForRealActions: true,
    globallyDiverseExamples: true,
    blogGuidesAllowed: true,
    storiesAllowed: true,
  },
  services: {
    page: "services",
    titleKey: "branches.services",
    descriptionKey: "branches.servicesDesc",
    requiredBlocks: ["hero", "preview", "what_unlocks_after_login", "trust_and_safety", "guide_cards", "story_preview", "contextual_cta"],
    contextualCtaKey: "common.search",
    loginRequiredOnlyForRealActions: true,
    globallyDiverseExamples: true,
    blogGuidesAllowed: true,
    storiesAllowed: true,
  },
  events: {
    page: "events",
    titleKey: "branches.events",
    descriptionKey: "branches.eventsDesc",
    requiredBlocks: ["hero", "preview", "what_unlocks_after_login", "trust_and_safety", "guide_cards", "story_preview", "contextual_cta"],
    contextualCtaKey: "common.search",
    loginRequiredOnlyForRealActions: true,
    globallyDiverseExamples: true,
    blogGuidesAllowed: true,
    storiesAllowed: true,
  },
  matching: {
    page: "matching",
    titleKey: "nav.matching",
    requiredBlocks: ["hero", "preview", "what_unlocks_after_login", "trust_and_safety", "contextual_cta"],
    contextualCtaKey: "nav.analyzeMatches",
    loginRequiredOnlyForRealActions: true,
    globallyDiverseExamples: true,
    blogGuidesAllowed: true,
    storiesAllowed: false,
  },
  messages: {
    page: "messages",
    titleKey: "nav.messages",
    requiredBlocks: ["hero", "preview", "what_unlocks_after_login", "trust_and_safety", "contextual_cta"],
    contextualCtaKey: "nav.login",
    loginRequiredOnlyForRealActions: true,
    globallyDiverseExamples: true,
    blogGuidesAllowed: true,
    storiesAllowed: false,
  },
  chat: {
    page: "chat",
    titleKey: "nav.messages",
    requiredBlocks: ["hero", "preview", "what_unlocks_after_login", "trust_and_safety", "contextual_cta"],
    contextualCtaKey: "nav.login",
    loginRequiredOnlyForRealActions: true,
    globallyDiverseExamples: true,
    blogGuidesAllowed: true,
    storiesAllowed: false,
  },
  exchange: {
    page: "exchange",
    titleKey: "nav.exchange",
    requiredBlocks: ["hero", "preview", "what_unlocks_after_login", "trust_and_safety", "guide_cards", "story_preview", "contextual_cta"],
    contextualCtaKey: "nav.proposeExchange",
    loginRequiredOnlyForRealActions: true,
    globallyDiverseExamples: true,
    blogGuidesAllowed: true,
    storiesAllowed: true,
  },
  profile: {
    page: "profile",
    titleKey: "profile.guestTitle",
    descriptionKey: "profile.guestDescription",
    requiredBlocks: ["hero", "preview", "what_unlocks_after_login", "trust_and_safety", "contextual_cta"],
    contextualCtaKey: "profile.guestCta",
    loginRequiredOnlyForRealActions: true,
    globallyDiverseExamples: true,
    blogGuidesAllowed: true,
    storiesAllowed: false,
  },
};

export function getPublicPageExperienceConfig(page: PublicExperiencePage) {
  return publicPageExperienceConfigs[page];
}
