import {
  getContextualDrawerConfig,
  type ContextualDrawerPage,
  type ContextualDrawerPageConfig,
  type ContextualDrawerSectionConfig,
} from "./contextualDrawerConfig";

export type DrawerAudience = "guest" | "authenticated";

const GUEST_VISIBLE_ITEM_IDS: Record<ContextualDrawerPage, ReadonlySet<string>> = {
  profile: new Set(),
  objects: new Set(["objects-all", "objects-only", "objects-properties", "objects-services"]),
  my_items: new Set(["my-items-browse"]),
  item_detail: new Set(["item-detail-back", "item-detail-safety"]),
  item_editor: new Set(["editor-browse", "editor-rules", "editor-safety"]),
  properties: new Set(["property-list", "property-map"]),
  services: new Set(["service-list", "service-explore"]),
  events: new Set(["event-list", "event-explore"]),
  matching: new Set(["matching-score", "matching-ai"]),
  messages: new Set(["messages-rules", "messages-summary"]),
  chat: new Set(["chat-context", "chat-summary"]),
  exchange: new Set(["exchange-safety", "exchange-ai"]),
  blog: new Set(["blog-guides", "blog-stories"]),
  stories: new Set(["stories-list", "stories-blog", "stories-safety"]),
};

const AUTH_REQUIRED_PREFIXES = [
  "/profile",
  "/my-objects",
  "/objects/new",
  "/properties/new",
  "/services/new",
  "/events/new",
  "/matching",
  "/messages",
  "/exchange",
  "/wishlist",
  "/favorites",
  "/history",
] as const;

function isAuthRequiredHref(href?: string): boolean {
  if (!href) return false;
  return AUTH_REQUIRED_PREFIXES.some((prefix) => href === prefix || href.startsWith(`${prefix}?`) || href.startsWith(`${prefix}/`));
}

function buildGuestSections(page: ContextualDrawerPage, config: ContextualDrawerPageConfig): ContextualDrawerSectionConfig[] {
  const visibleIds = GUEST_VISIBLE_ITEM_IDS[page];
  const visibleSections = config.sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => visibleIds.has(item.id) && !isAuthRequiredHref(item.href)),
    }))
    .filter((section) => section.items.length > 0);

  return [
    ...visibleSections,
    {
      id: "quick_actions",
      titleKey: "common.nextStep",
      items: [
        {
          id: `${page}-guest-login`,
          labelKey: "nav.login",
          icon: "shield",
          href: "/login",
        },
        {
          id: `${page}-guest-register`,
          labelKey: "nav.register",
          icon: "plus",
          href: "/register",
        },
      ],
    },
  ];
}

export function getContextualDrawerConfigForAudience(
  page: ContextualDrawerPage,
  audience: DrawerAudience,
): ContextualDrawerPageConfig {
  const config = getContextualDrawerConfig(page);

  if (audience === "authenticated") {
    return config;
  }

  return {
    ...config,
    sections: buildGuestSections(page, config),
  };
}
