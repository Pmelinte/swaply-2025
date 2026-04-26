export type ListingCat = "objects" | "properties" | "services" | "events";

export function getListingCat(listingType?: string | null): ListingCat {
  if (listingType === "property") return "properties";
  if (listingType === "service") return "services";
  return "objects";
}

export const CAT = {
  objects: {
    topBorder: "cat-top-border-obj",
    badge: "bg-cat-obj text-white",
    chip: "bg-cat-obj-muted text-cat-obj-ink border border-cat-obj-ring",
    placeholder: "bg-cat-obj-muted",
    addBtn: "bg-cat-obj hover:bg-sky-500 text-white",
    tabActive: "bg-cat-obj text-white",
    leftBorder: "cat-left-border-obj",
    icon: "📦",
    hex: "#38BDF8",
  },
  properties: {
    topBorder: "cat-top-border-prop",
    badge: "bg-cat-prop text-white",
    chip: "bg-cat-prop-muted text-cat-prop-ink border border-cat-prop-ring",
    placeholder: "bg-cat-prop-muted",
    addBtn: "bg-cat-prop hover:bg-violet-500 text-white",
    tabActive: "bg-cat-prop text-white",
    leftBorder: "cat-left-border-prop",
    icon: "🏠",
    hex: "#A78BFA",
  },
  services: {
    topBorder: "cat-top-border-svc",
    badge: "bg-cat-svc text-white",
    chip: "bg-cat-svc-muted text-cat-svc-ink border border-cat-svc-ring",
    placeholder: "bg-cat-svc-muted",
    addBtn: "bg-cat-svc hover:bg-teal-500 text-white",
    tabActive: "bg-cat-svc text-white",
    leftBorder: "cat-left-border-svc",
    icon: "🔧",
    hex: "#2DD4BF",
  },
  events: {
    topBorder: "cat-top-border-evt",
    badge: "bg-cat-evt text-cat-evt-ink",
    chip: "bg-cat-evt-muted text-cat-evt-ink border border-cat-evt-ring",
    placeholder: "bg-cat-evt-muted",
    addBtn: "bg-cat-evt hover:bg-yellow-400 text-cat-evt-ink",
    tabActive: "bg-cat-evt text-cat-evt-ink",
    leftBorder: "cat-left-border-evt",
    icon: "🎫",
    hex: "#FDE047",
  },
} as const satisfies Record<ListingCat, {
  topBorder: string; badge: string; chip: string; placeholder: string;
  addBtn: string; tabActive: string; leftBorder: string; icon: string; hex: string;
}>;
