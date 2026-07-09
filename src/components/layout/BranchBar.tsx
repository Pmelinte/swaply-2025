"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const TABS = [
  { href: "/objects",    emoji: "📦", labelKey: "objects",    descKey: "objectsDesc",    activeClass: "bg-cat-obj text-white" },
  { href: "/properties", emoji: "🏠", labelKey: "properties", descKey: "propertiesDesc", activeClass: "bg-cat-prop text-white" },
  { href: "/services",   emoji: "🔧", labelKey: "services",   descKey: "servicesDesc",   activeClass: "bg-cat-svc text-white" },
  { href: "/events",     emoji: "🎫", labelKey: "events",     descKey: "eventsDesc",     activeClass: "bg-cat-evt text-cat-evt-ink" },
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
        {TABS.map(({ href, emoji, labelKey, descKey, activeClass }) => {
          const active = isActive(href);
          const label = t(labelKey);
          return (
            <Link
              key={href}
              href={href}
              title={t(descKey)}
              className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 px-1 text-xs font-medium transition-colors sm:flex-row sm:gap-1.5 sm:px-3 sm:text-sm ${
                active
                  ? activeClass
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <span className="text-base leading-none sm:text-lg" aria-hidden="true">
                {emoji}
              </span>
              <span className="hidden sm:inline">{label}</span>
              <span className="text-[10px] leading-none sm:hidden">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
