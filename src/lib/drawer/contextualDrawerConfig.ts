export const CONTEXTUAL_DRAWER_PAGES = [
  "profile",
  "objects",
  "my_items",
  "item_detail",
  "item_editor",
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
  profile: {
    page: "profile",
    titleKey: "profile.accountAndSettings",
    descriptionKey: "profile.publicIdentityDescription",
    sections: [
      {
        id: "page_context",
        titleKey: "profile.profileNavigation",
        items: [
          { id: "profile-main", labelKey: "profile.publicIdentity", icon: "users", href: "/profile?tab=profil" },
          { id: "profile-properties", labelKey: "profile.propertiesAndServices", icon: "home", href: "/profile?tab=proprietati" },
          { id: "profile-account", labelKey: "profile.accountAndSettings", icon: "shield", href: "/profile?tab=cont" },
        ],
      },
      {
        id: "status",
        titleKey: "profile.reputationAndTokens",
        items: [
          { id: "profile-reputation", labelKey: "profile.reputation", icon: "activity", href: "/profile?tab=reputatie" },
          { id: "profile-verification", labelKey: "profile.verificationTitle", icon: "checklist", href: "/profile?tab=verificare" },
        ],
      },
      {
        id: "quick_actions",
        titleKey: "profile.notificationSettings",
        items: [
          { id: "profile-notifications", labelKey: "notificationSettings.title", icon: "message", href: "/profile?tab=notificari" },
          { id: "profile-alerts", labelKey: "savedSearches.tabTitle", icon: "search", href: "/profile?tab=alerte" },
        ],
      },
      {
        id: "ai_recommendations",
        titleKey: "nav.quickNav",
        items: [
          { id: "profile-my-items", labelKey: "myObjects.title", icon: "activity", href: "/my-objects" },
          { id: "profile-add-item", labelKey: "nav.addObject", icon: "plus", href: "/objects/new" },
          { id: "profile-history", labelKey: "history.title", icon: "checklist", href: "/history" },
        ],
      },
    ],
  },
  objects: {
    page: "objects",
    titleKey: "branches.objects",
    descriptionKey: "branches.objectsDesc",
    sections: [
      {
        id: "filters",
        titleKey: "common.search",
        items: [
          { id: "objects-all", labelKey: "objects.browseAll", icon: "search", href: "/objects" },
          { id: "objects-only", labelKey: "objects.objectsType", icon: "activity", href: "/objects?type=object" },
          { id: "objects-properties", labelKey: "objects.propertiesType", icon: "home", href: "/objects?type=property" },
          { id: "objects-services", labelKey: "objects.servicesType", icon: "users", href: "/objects?type=service" },
        ],
      },
      {
        id: "quick_actions",
        titleKey: "nav.quickNav",
        items: [
          { id: "add-object", labelKey: "nav.addObject", icon: "plus", href: "/objects/new" },
          { id: "my-objects", labelKey: "myObjects.title", icon: "activity", href: "/my-objects" },
          { id: "saved-items", labelKey: "favorites.title", icon: "book", href: "/favorites" },
        ],
      },
      {
        id: "status",
        titleKey: "common.nextStep",
        items: [
          { id: "object-matching", labelKey: "nav.analyzeMatches", icon: "sparkles", href: "/matching" },
          { id: "object-wishlist", labelKey: "objects.desires", icon: "checklist", href: "/wishlist" },
        ],
      },
    ],
  },
  my_items: {
    page: "my_items",
    titleKey: "myObjects.title",
    descriptionKey: "myObjects.subtitle",
    sections: [
      {
        id: "quick_actions",
        titleKey: "nav.quickNav",
        items: [
          { id: "my-items-add", labelKey: "myObjects.addNew", icon: "plus", href: "/objects/new" },
          { id: "my-items-browse", labelKey: "objects.browseAll", icon: "search", href: "/objects" },
          { id: "my-items-matching", labelKey: "nav.analyzeMatches", icon: "sparkles", href: "/matching" },
        ],
      },
      {
        id: "status",
        titleKey: "myObjects.insights",
        items: [
          { id: "my-items-history", labelKey: "history.title", icon: "checklist", href: "/history" },
          { id: "my-items-profile", labelKey: "profile.title", icon: "users", href: "/profile" },
        ],
      },
    ],
  },
  item_detail: {
    page: "item_detail",
    titleKey: "objectDetail.detailsAndActions",
    sections: [
      {
        id: "quick_actions",
        titleKey: "nav.quickNav",
        items: [
          { id: "item-detail-back", labelKey: "objectDetail.backToObjects", icon: "search", href: "/objects" },
          { id: "item-detail-match", labelKey: "objectDetail.requestMatch", icon: "sparkles", href: "/matching" },
          { id: "item-detail-messages", labelKey: "nav.messages", icon: "message", href: "/messages" },
        ],
      },
      {
        id: "page_context",
        titleKey: "nav.info",
        items: [
          { id: "item-detail-owner-profile", labelKey: "objectDetail.owner", icon: "users", href: "/profile" },
          { id: "item-detail-safety", labelKey: "legal.safetyTitle", icon: "shield", href: "/safety" },
        ],
      },
    ],
  },
  item_editor: {
    page: "item_editor",
    titleKey: "objectNew.title",
    descriptionKey: "objectNew.description",
    sections: [
      {
        id: "page_context",
        titleKey: "objectWizard.step5Title",
        items: [
          { id: "editor-my-items", labelKey: "myObjects.title", icon: "activity", href: "/my-objects" },
          { id: "editor-browse", labelKey: "objects.browseAll", icon: "search", href: "/objects" },
        ],
      },
      {
        id: "quick_actions",
        titleKey: "nav.info",
        items: [
          { id: "editor-profile", labelKey: "profile.localization", icon: "map", href: "/profile?tab=profil" },
          { id: "editor-rules", labelKey: "legal.termsTitle", icon: "book", href: "/terms" },
          { id: "editor-safety", labelKey: "legal.safetyTitle", icon: "shield", href: "/safety" },
        ],
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
          { id: "property-list", labelKey: "branches.properties", icon: "search", href: "/properties" },
          { id: "property-map", labelKey: "nav.searchOnMap", icon: "map", href: "/explore?type=property" },
        ],
      },
      {
        id: "quick_actions",
        titleKey: "nav.quickNav",
        items: [
          { id: "add-property", labelKey: "common.add", icon: "plus", href: "/properties/new" },
          { id: "property-profile", labelKey: "profile.propertiesAndServices", icon: "home", href: "/profile?tab=proprietati" },
        ],
      },
      {
        id: "status",
        titleKey: "common.nextStep",
        items: [{ id: "property-match", labelKey: "nav.analyzeMatches", icon: "sparkles", href: "/matching" }],
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
          { id: "service-list", labelKey: "branches.services", icon: "search", href: "/services" },
          { id: "service-explore", labelKey: "nav.explore", icon: "map", href: "/explore?type=service" },
        ],
      },
      {
        id: "quick_actions",
        titleKey: "nav.quickNav",
        items: [
          { id: "add-service", labelKey: "common.add", icon: "plus", href: "/services/new" },
          { id: "service-profile", labelKey: "profile.propertiesAndServices", icon: "users", href: "/profile?tab=proprietati" },
        ],
      },
      {
        id: "status",
        titleKey: "common.nextStep",
        items: [{ id: "service-match", labelKey: "nav.analyzeMatches", icon: "sparkles", href: "/matching" }],
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
          { id: "event-list", labelKey: "branches.events", icon: "search", href: "/events" },
          { id: "event-explore", labelKey: "nav.explore", icon: "calendar", href: "/explore?type=event" },
        ],
      },
      {
        id: "quick_actions",
        titleKey: "nav.quickNav",
        items: [{ id: "add-event", labelKey: "common.add", icon: "plus", href: "/events/new" }],
      },
      {
        id: "status",
        titleKey: "common.nextStep",
        items: [{ id: "event-match", labelKey: "nav.analyzeMatches", icon: "sparkles", href: "/matching" }],
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
        items: [{ id: "blog-guides", labelKey: "blog.allArticles", icon: "book", href: "/blog" }],
      },
      {
        id: "quick_actions",
        titleKey: "nav.quickNav",
        items: [{ id: "blog-stories", labelKey: "info.successStories", icon: "users", href: "/stories" }],
      },
    ],
  },
  stories: {
    page: "stories",
    titleKey: "info.successStories",
    sections: [
      {
        id: "page_context",
        titleKey: "nav.info",
        items: [
          { id: "stories-list", labelKey: "info.successStories", icon: "users", href: "/stories" },
          { id: "stories-blog", labelKey: "blog.pageTitle", icon: "book", href: "/blog" },
        ],
      },
      {
        id: "quick_actions",
        titleKey: "nav.quickNav",
        items: [{ id: "stories-safety", labelKey: "legal.safetyTitle", icon: "shield", href: "/safety" }],
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
