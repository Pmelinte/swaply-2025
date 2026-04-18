"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  Home,
  Search,
  Package,
  Wrench,
  Ticket,
  HeartHandshake,
  MessageCircle,
  Shuffle,
} from "lucide-react";

function getExploreIcon(pathname: string) {
  if (pathname === "/objects" || pathname.startsWith("/objects/")) return Package;
  if (pathname === "/properties" || pathname.startsWith("/properties/")) return Home;
  if (pathname === "/services" || pathname.startsWith("/services/")) return Wrench;
  if (pathname === "/events" || pathname.startsWith("/events/")) return Ticket;
  return Search;
}

export function FooterNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  // Badge: show conversation count (no unread tracking yet)
  const chatBadge = 0;

  const ExploreIcon = getExploreIcon(pathname);

  const links = [
    { href: "/", label: t("home"), icon: Home, badge: 0 },
    { href: "/explore", label: t("explore"), icon: ExploreIcon, badge: 0 },
    { href: "/matching", label: t("matching"), icon: HeartHandshake, badge: 0 },
    { href: "/chat", label: t("messages"), icon: MessageCircle, badge: chatBadge },
    { href: "/exchange", label: t("exchange"), icon: Shuffle, badge: 0 },
  ];

  return (
    <nav aria-label="Main navigation" className="sticky bottom-0 z-20 border-t border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="mx-auto grid max-w-6xl grid-cols-5 gap-1 px-2 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
        {links.map((link) => {
          const Icon = link.icon;
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex flex-col items-center gap-1 rounded-xl px-2 py-2 transition hover:bg-zinc-100 dark:hover:bg-zinc-800 ${active ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-100" : ""}`}
            >
              <span className="relative">
                <Icon className="h-5 w-5" />
                {link.badge > 0 && (
                  <span className="absolute -right-2 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                    {link.badge > 9 ? "9+" : link.badge}
                  </span>
                )}
              </span>
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
