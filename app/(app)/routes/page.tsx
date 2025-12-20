import Link from "next/link";

const ROUTES = [
  { href: "/", label: "Home" },
  { href: "/browse", label: "Browse items" },
  { href: "/items", label: "My items" },
  { href: "/items/add", label: "Create item (AI)" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/matches", label: "Matches" },
  { href: "/chat", label: "Chat" },
  { href: "/exchanges", label: "Swaps / Exchanges" },
  { href: "/map", label: "Nearby swaps map" },
  { href: "/premium", label: "Premium" },
  { href: "/settings/profile", label: "Profile settings" },
  { href: "/profile", label: "My profile" },
  { href: "/admin", label: "Admin" },
  { href: "/login", label: "Login" },
  { href: "/register", label: "Register" },
];

export default function RouteMapPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Route map</h1>
        <p className="text-sm text-gray-600">
          Harta completă a paginilor Swaply (MVP testare).
        </p>
      </header>

      <ul className="space-y-2">
        {ROUTES.map((route) => (
          <li key={route.href}>
            <Link
              href={route.href}
              className="text-blue-600 hover:underline"
            >
              {route.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
