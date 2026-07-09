export const CONTEXTUAL_DRAWER_PAGES = [
  "objects",
  "properties",
  "services",
  "events",
  "matching",
  "messages",
  "chat",
  "exchange",
  "blog",
  "stories",
] as const;

export type ContextualDrawerPage = (typeof CONTEXTUAL_DRAWER_PAGES)[number];

export type ContextualDrawerSectionId =
  | "page_context"
  | "filters"
  | "quick_actions"
  | "ai_recommendations"
  | "status";

export type ContextualDrawerIcon =
  | "activity"
  | "book"
  | "calendar"
  | "checklist"
  | "home"
  | "info"
  | "map"
  | "message"
  | "plus"
  | "search"
  | "shield"
  | "sparkles"
  | "sliders"
  | "users";

export interface ContextualDrawerItemConfig {
  id: string;
  labelKey: string;
  icon: ContextualDrawerIcon;
  href?: string;
  disabled?: boolean;
}

export interface ContextualDrawerSectionConfig {
  id: ContextualDrawerSectionId;
  titleKey: string;
  items: ContextualDrawerItemConfig[];
}

export interface ContextualDrawerPageConfig {
  page: ContextualDrawerPage;
  titleKey: string;
  descriptionKey?: string;
  sections: ContextualDrawerSectionConfig[];
}

export const BOTTOM_NAV_HREFS = [
  "/",
  "/explore",
  "/matching",
  "/messages",
  "/exchange",
] as const;

export const contextualDrawerConfigs: Record<ContextualDrawerPage, ContextualDrawerPageConfig> = {
  objects: {
    page: "objects",
    titleKey: "branches.objects",
    descriptionKey: "branches.objectsDesc",
    sections: [
      {
        id: "filters",
        titleKey: "common.search",
        items: [
          { id: "object-text-search", labelKey: "common.search", icon: "search" },
          { id: "object-map-search", labelKey: "nav.searchOnMap", icon: "map" },
        ],
      },
      {
        id: "quick_actions",
        titleKey: "nav.quickNav",
        items: [
          { id: "add-object", labelKey: "nav.addObject", icon: "plus", href: "/objects/new" },
          { id: "view-objects", labelKey: "nav.viewObjects", icon: "activity" },
        ],
      },
      {
        id: "ai_recommendations",
        titleKey: "common.recommendedNextStep",
        items: [{ id: "object-ai-match", labelKey: "nav.analyzeMatches", icon: "sparkles" }],
      },
    ],
  },
  properties: {
    page: "properties",
    titleKey: "branches.properties",
    descriptionKey: "branches.propertiesDesc",
    sections: [
      {
        id: "filters",
        titleKey: "common.search",
        items: [
          { id: "property-search", labelKey: "common.search", icon: "search" },
          { id: "property-map", labelKey: "nav.searchOnMap", icon: "map" },
        ],
      },
      {
        id: "quick_actions",
        titleKey: "nav.quickNav",
        items: [{ id: "add-property", labelKey: "common.add", icon: "plus", disabled: true }],
      },
      {
        id: "ai_recommendations",
        titleKey: "common.recommendedNextStep",
        items: [{ id: "property-ai-match", labelKey: "nav.analyzeMatches", icon: "sparkles" }],
      },
    ],
  },
  services: {
    page: "services",
    titleKey: "branches.services",
    descriptionKey: "branches.servicesDesc",
    sections: [
      {
        id: "filters",
        titleKey: "common.search",
        items: [
          { id: "service-search", labelKey: "common.search", icon: "search" },
          { id: "service-remote-local", labelKey: "common.apply", icon: "sliders" },
        ],
      },
      {
        id: "quick_actions",
        titleKey: "nav.quickNav",
        items: [{ id: "add-service", labelKey: "common.add", icon: "plus", disabled: true }],
      },
      {
        id: "ai_recommendations",
        titleKey: "common.recommendedNextStep",
        items: [{ id: "service-ai-match", labelKey: "nav.analyzeMatches", icon: "sparkles" }],
      },
    ],
  },
  events: {
    page: "events",
    titleKey: "branches.events",
    descriptionKey: "branches.eventsDesc",
    sections: [
      {
        id: "filters",
        titleKey: "common.search",
        items: [
          { id: "event-search", labelKey: "common.search", icon: "search" },
          { id: "event-date", labelKey: "common.next", icon: "calendar" },
        ],
      },
      {
        id: "quick_actions",
        titleKey: "nav.quickNav",
        items: [{ id: "add-event", labelKey: "common.add", icon: "plus", disabled: true }],
      },
      {
        id: "ai_recommendations",
        titleKey: "common.recommendedNextStep",
        items: [{ id: "event-ai-match", labelKey: "nav.analyzeMatches", icon: "sparkles" }],
      },
    ],
  },
  matching: {
    page: "matching",
    titleKey: "nav.matching",
    sections: [
      {
        id: "filters",
        titleKey: "common.search",
        items: [{ id: "matching-score", labelKey: "nav.analyzeMatches", icon: "sliders" }],
      },
      {
        id: "ai_recommendations",
        titleKey: "common.recommendedNextStep",
        items: [{ id: "matching-ai", labelKey: "nav.analyzeMatches", icon: "sparkles" }],
      },
      {
        id: "status",
        titleKey: "common.nextStep",
        items: [{ id: "matching-status", labelKey: "common.noData", icon: "activity" }],
      },
    ],
  },
  messages: {
    page: "messages",
    titleKey: "nav.messages",
    sections: [
      {
        id: "page_context",
        titleKey: "nav.contextMenu",
        items: [{ id: "messages-context", labelKey: "nav.messages", icon: "message" }],
      },
      {
        id: "quick_actions",
        titleKey: "nav.quickNav",
        items: [{ id: "messages-rules", labelKey: "nav.chatRules", icon: "shield" }],
      },
      {
        id: "ai_recommendations",
        titleKey: "common.recommendedNextStep",
        items: [{ id: "messages-summary", labelKey: "common.nextStep", icon: "sparkles" }],
      },
    ],
  },
  chat: {
    page: "chat",
    titleKey: "nav.messages",
    sections: [
      {
        id: "page_context",
        titleKey: "nav.contextMenu",
        items: [{ id: "chat-context", labelKey: "nav.chatRules", icon: "message" }],
      },
      {
        id: "quick_actions",
        titleKey: "nav.quickNav",
        items: [{ id: "chat-exchange", labelKey: "nav.proposeExchange", icon: "checklist" }],
      },
      {
        id: "ai_recommendations",
        titleKey: "common.recommendedNextStep",
        items: [{ id: "chat-summary", labelKey: "common.nextStep", icon: "sparkles" }],
      },
    ],
  },
  exchange: {
    page: "exchange",
    titleKey: "nav.exchange",
    sections: [
      {
        id: "status",
        titleKey: "common.nextStep",
        items: [{ id: "exchange-status", labelKey: "nav.confirmExchange", icon: "checklist" }],
      },
      {
        id: "quick_actions",
        titleKey: "nav.quickNav",
        items: [{ id: "exchange-safety", labelKey: "legal.safetyTitle", icon: "shield" }],
      },
      {
        id: "ai_recommendations",
        titleKey: "common.recommendedNextStep",
        items: [{ id: "exchange-ai", labelKey: "common.nextStep", icon: "sparkles" }],
      },
    ],
  },
  blog: {
    page: "blog",
    titleKey: "blog.pageTitle",
    sections: [
      {
        id: "page_context",
        titleKey: "nav.info",
        items: [{ id: "blog-guides", labelKey: "blog.allArticles", icon: "book" }],
      },
      {
        id: "quick_actions",
        titleKey: "nav.quickNav",
        items: [{ id: "blog-search", labelKey: "common.search", icon: "search" }],
      },
      {
        id: "ai_recommendations",
        titleKey: "common.recommendedNextStep",
        items: [{ id: "blog-related", labelKey: "common.nextStep", icon: "sparkles" }],
      },
    ],
  },
  stories: {
    page: "stories",
    titleKey: "home.announcements",
    sections: [
      {
        id: "page_context",
        titleKey: "nav.info",
        items: [{ id: "stories-context", labelKey: "home.announcements", icon: "users" }],
      },
      {
        id: "quick_actions",
        titleKey: "nav.quickNav",
        items: [{ id: "stories-safety", labelKey: "legal.safetyTitle", icon: "shield" }],
      },
      {
        id: "ai_recommendations",
        titleKey: "common.recommendedNextStep",
        items: [{ id: "stories-ai", labelKey: "common.nextStep", icon: "sparkles" }],
      },
    ],
  },
};

export function getContextualDrawerConfig(page: ContextualDrawerPage) {
  return contextualDrawerConfigs[page];
}

export function isBottomNavHref(href?: string): boolean {
  if (!href) return false;
  return BOTTOM_NAV_HREFS.includes(href as (typeof BOTTOM_NAV_HREFS)[number]);
}
