export const CANONICAL_ROUTES = [
  { key: "home", path: "/", label: "Home", area: "core" },
  { key: "objects", path: "/objects", label: "Objects", area: "domain" },
  { key: "explore", path: "/explore", label: "Explore", area: "core" },
  { key: "matching", path: "/matching", label: "Matching", area: "core" },
  { key: "messages", path: "/messages", label: "Messages", area: "core" },
  { key: "exchange", path: "/exchange", label: "Exchange", area: "core" },
  { key: "chat", path: "/chat", label: "Chat", area: "core" },
  { key: "properties", path: "/properties", label: "Properties", area: "domain" },
  { key: "services", path: "/services", label: "Services", area: "domain" },
  { key: "events", path: "/events", label: "Events", area: "domain" },
  { key: "blog", path: "/blog", label: "Blog", area: "content" },
  { key: "about", path: "/about", label: "About", area: "content" },
  { key: "contact", path: "/contact", label: "Contact", area: "content" },
  { key: "admin", path: "/admin", label: "Admin", area: "admin" },
  { key: "diagnostic", path: "/admin/diagnostic", label: "Diagnostic", area: "admin" },
  { key: "canonical", path: "/admin/canonical", label: "Canonical", area: "admin" },
] as const;

export const LEGACY_ROUTE_ALIASES = [
  { legacy: "/match", canonical: "/matching", note: "Use Matching everywhere." },
  { legacy: "/change", canonical: "/exchange", note: "Use Exchange everywhere." },
  { legacy: "/items", canonical: "/objects", note: "Use Objects as public wording." },
] as const;

export const CANONICAL_MODELS = [
  { key: "account", title: "Account", source: "Supabase user plus Swaply profile", rule: "One account flow and one profile record." },
  { key: "profile", title: "Profile", source: "profiles", rule: "Stores app identity, language, location radius, rating and onboarding." },
  { key: "object", title: "Object", source: "items and item_images", rule: "UI says Objects while database migration may still use items." },
  { key: "matching", title: "Matching", source: "match candidates", rule: "Matching proposes pairings; Exchange executes them." },
  { key: "conversation", title: "Messages and Chat", source: "swap_messages", rule: "Messages is the inbox; Chat is a specific conversation." },
  { key: "exchange", title: "Exchange", source: "swaps", rule: "Exchange covers logistics, confirmation, completion and feedback." },
  { key: "domains", title: "Domains", source: "object, property, service and event flows", rule: "All domains share matching and exchange with domain-specific fields." },
] as const;

export const CANONICAL_DYNAMIC_ROUTES = [
  { key: "objectDetail", pattern: "/objects/[id]" },
  { key: "profileDetail", pattern: "/profile/[id]" },
  { key: "chatDetail", pattern: "/chat/[id]" },
  { key: "exchangeDetail", pattern: "/exchange/[id]" },
] as const;
