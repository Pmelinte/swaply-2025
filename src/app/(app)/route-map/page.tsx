import Link from "next/link";

const ROUTES = [
  { section: "Public", routes: [
    { href: "/", label: "Home" },
    { href: "/browse", label: "Browse" },
    { href: "/items/[id]", label: "Item detail (public)" },
    { href: "/map", label: "Nearby swaps map" },
  ]},
  { section: "Auth", routes: [
    { href: "/login", label: "Login" },
    { href: "/register", label: "Register" },
    { href: "/logout", label: "Logout" },
  ]},
  { section: "Profile", routes: [
    { href: "/settings/profile", label: "Profile view/edit" },
    { href: "/profile/[id]", label: "Public profile" },
  ]},
  { section: "Items", routes: [
    { href: "/items", label: "My items" },
    { href: "/items/add", label: "Create item" },
    { href: "/items/[id]/edit", label: "Edit item" },
  ]},
  { section: "Wishlist & Matches", routes: [
    { href: "/wishlist", label: "Wishlist" },
    { href: "/matches", label: "Matches / recommendations" },
  ]},
  { section: "Swaps & Chat", routes: [
    { href: "/swaps", label: "Swaps list" },
    { href: "/swaps/[id]", label: "Swap detail" },
    { href: "/chat", label: "Chat inbox" },
    { href: "/chat/[swapId]", label: "Swap chat" },
  ]},
  { section: "Payments & API", routes: [
    { href: "/premium", label: "Premium" },
    { href: "/api-docs", label: "Public API" },
  ]},
  { section: "Admin", routes: [
    { href: "/admin", label: "Admin dashboard" },
  ]},
];

export default function RouteMapPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Route map</h1>
        <p className="text-sm text-muted-foreground">
          Hartă completă a paginilor Swaply pentru etapa de testare.
        </p>
      </div>

      <div className="space-y-5">
        {ROUTES.map((group) => (
          <section key={group.section} className="space-y-2">
            <h2 className="text-lg font-semibold">{group.section}</h2>
            <ul className="grid sm:grid-cols-2 gap-2">
              {group.routes.map((route) => (
                <li key={route.href} className="rounded-lg border bg-white p-3">
                  {route.href.includes("[") ? (
                    <div className="text-sm font-medium">{route.label}</div>
                  ) : (
                    <Link className="text-sm font-medium text-blue-600" href={route.href}>
                      {route.label}
                    </Link>
                  )}
                  <div className="text-xs text-muted-foreground">{route.href}</div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
