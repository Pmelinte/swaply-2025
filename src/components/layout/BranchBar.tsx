"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const TABS = [
  { href: "/objects", emoji: "📦", labelKey: "objects", descKey: "objectsDesc", beta: false },
  { href: "/properties", emoji: "🏠", labelKey: "properties", descKey: "propertiesDesc", beta: true },
  { href: "/services", emoji: "🔧", labelKey: "services", descKey: "servicesDesc", beta: true },
  { href: "/events", emoji: "🎫", labelKey: "events", descKey: "eventsDesc", beta: true },
] as const;

export function BranchBar() {
  const t = useTranslations("branches");
  const pathname = usePathname();

  // Hide on individual conversation pages — the chat layout owns the full viewport there
  if (pathname.startsWith("/chat/")) return null;

  function isActive(href: string) {
    if (href === "/objects") {
      return pathname === "/" || pathname === "/objects" || pathname.startsWith("/objects/");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav
      aria-label="Branch navigation"
      className="sticky top-[53px] z-10 h-[44px] border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="mx-auto flex h-full max-w-6xl items-stretch px-2 sm:px-4">
        {TABS.map(({ href, emoji, labelKey, descKey, beta }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              title={t(descKey)}
              className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 px-1 text-xs font-medium transition-colors sm:flex-row sm:gap-1.5 sm:px-3 sm:text-sm ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <span className="text-base leading-none sm:text-lg" aria-hidden="true">
                {emoji}
              </span>
              {/* Desktop: always show text */}
              <span className="hidden sm:inline">{t(labelKey)}</span>
              {/* Mobile: show text only when active */}
              {active && (
                <span className="text-[10px] leading-none sm:hidden">{t(labelKey)}</span>
              )}
              {beta && (
                <span
                  className={`rounded px-1 py-0.5 text-[9px] font-semibold uppercase leading-none ${
                    active
                      ? "bg-blue-500 text-blue-100"
                      : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                  }`}
                >
                  Beta
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
