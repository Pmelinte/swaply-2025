import type { PublicExperiencePage } from "./publicPageExperienceConfig";

export type GuestProofRegion = "europe" | "americas" | "asia" | "africa" | "oceania" | "global";
export type GuestProofAction = "browse" | "learn" | "compare" | "preview" | "start_after_login";

export interface PublicGuestProofExample {
  id: string;
  page: PublicExperiencePage;
  region: GuestProofRegion;
  action: GuestProofAction;
  title: string;
  description: string;
  requiresLogin: boolean;
}

export const PUBLIC_GUEST_PROOF_EXAMPLES = [
  {
    id: "home-europe-object-service",
    page: "home",
    region: "europe",
    action: "preview",
    title: "Camera gear for a weekend repair service",
    description: "A visitor can understand a mixed object-service swap before creating an account.",
    requiresLogin: false,
  },
  {
    id: "home-asia-property-event",
    page: "home",
    region: "asia",
    action: "learn",
    title: "Apartment stay for event tickets",
    description: "A visitor can see that Swaply supports packages, not only simple one-to-one objects.",
    requiresLogin: false,
  },
  {
    id: "objects-americas-tools-bike",
    page: "objects",
    region: "americas",
    action: "browse",
    title: "Tools for a mountain bike",
    description: "A guest can browse object cards and understand value matching before login.",
    requiresLogin: false,
  },
  {
    id: "objects-africa-phone-lessons",
    page: "objects",
    region: "africa",
    action: "compare",
    title: "Phone for language lessons",
    description: "A guest can compare cross-category intent without sending a proposal yet.",
    requiresLogin: false,
  },
  {
    id: "properties-europe-village-flat",
    page: "properties",
    region: "europe",
    action: "preview",
    title: "Village house for city flat stay",
    description: "A visitor can preview property exchange logic without exposing an exact address.",
    requiresLogin: false,
  },
  {
    id: "services-asia-design-translation",
    page: "services",
    region: "asia",
    action: "browse",
    title: "Design help for translation support",
    description: "A guest can understand remote and local service swaps before account creation.",
    requiresLogin: false,
  },
  {
    id: "events-europe-ticket-hotel",
    page: "events",
    region: "europe",
    action: "preview",
    title: "Concert ticket plus hotel night",
    description: "A visitor can see event packages and transfer constraints before login.",
    requiresLogin: false,
  },
  {
    id: "explore-global-map-preview",
    page: "explore",
    region: "global",
    action: "browse",
    title: "Explore by category and approximate area",
    description: "A visitor can browse global categories without revealing a precise location.",
    requiresLogin: false,
  },
  {
    id: "matching-oceania-ai-preview",
    page: "matching",
    region: "oceania",
    action: "preview",
    title: "AI explains why two offers may fit",
    description: "A guest can preview the explanation pattern; expressing interest still requires login.",
    requiresLogin: false,
  },
  {
    id: "messages-global-safety-preview",
    page: "messages",
    region: "global",
    action: "learn",
    title: "Safe messaging rules before chat",
    description: "A visitor can read translation, moderation and safety expectations before login.",
    requiresLogin: false,
  },
  {
    id: "chat-global-context-required",
    page: "chat",
    region: "global",
    action: "start_after_login",
    title: "Conversation starts after mutual interest",
    description: "Chat is explained publicly, but an actual conversation requires a real match.",
    requiresLogin: true,
  },
  {
    id: "exchange-africa-local-handover",
    page: "exchange",
    region: "africa",
    action: "learn",
    title: "Local handover with safety checklist",
    description: "A guest can learn exchange methods, packaging and feedback steps before login.",
    requiresLogin: false,
  },
  {
    id: "profile-global-trust-preview",
    page: "profile",
    region: "global",
    action: "start_after_login",
    title: "Trust profile completed after signup",
    description: "A visitor can learn what the profile contains; editing profile requires login.",
    requiresLogin: true,
  },
] as const satisfies readonly PublicGuestProofExample[];

export function getGuestProofExamplesForPage(page: PublicExperiencePage) {
  return PUBLIC_GUEST_PROOF_EXAMPLES.filter((example) => example.page === page);
}

export function getGuestProofRegionsForPage(page: PublicExperiencePage) {
  return new Set(getGuestProofExamplesForPage(page).map((example) => example.region));
}
