"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const TABS = [
  {
    href: "/objects",
    emoji: "📦",
    labelKey: "objects",
    descKey: "objectsDesc",
  },
  {
    href: "/properties",
    emoji: "🏠",
    labelKey: "properties",
    descKey: "propertiesDesc",
  },
  {
    href: "/services",
    emoji: "🔧",
    labelKey: "services",
    descKey: "servicesDesc",
  },
  {
    href: "/events",
    emoji: "🎫",
    labelKey: "events",
    descKey: "eventsDesc",
  },
] as const;

export function BranchBar() {
  const t = useTranslations("branches");
  const pathname = usePathname();

  // Domain selection belongs exclusively to Explore.
  if (pathname !== "/explore") return null;

  return (
    <nav
      aria-label="Branch navigation"
      className="sticky top-[53px] z-10 h-[44px] border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="mx-auto flex h-full max-w-6xl items-stretch px-2 sm:px-4">
        {TABS.map(({ href, emoji, labelKey, descKey }) => {
          const label = t(labelKey);

          return (
            <Link
              key={href}
              href={href}
              title={t(descKey)}
              className="relative flex flex-1 flex-col items-center justify-center gap-0.5 px-1 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 sm:flex-row sm:gap-1.5 sm:px-3 sm:text-sm dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
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
