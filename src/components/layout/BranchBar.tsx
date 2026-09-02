"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { House, Package, Ticket, Wrench } from "lucide-react";

const TABS = [
  {
    href: "/objects",
    icon: Package,
    tone: "border-sky-300 bg-sky-100/90 text-sky-900",
    labelKey: "objects",
    descKey: "objectsDesc",
  },
  {
    href: "/properties",
    icon: House,
    tone: "border-violet-300 bg-violet-100/90 text-violet-900",
    labelKey: "properties",
    descKey: "propertiesDesc",
  },
  {
    href: "/services",
    icon: Wrench,
    tone: "border-teal-300 bg-teal-100/90 text-teal-900",
    labelKey: "services",
    descKey: "servicesDesc",
  },
  {
    href: "/events",
    icon: Ticket,
    tone: "border-yellow-300 bg-yellow-100/90 text-yellow-950",
    labelKey: "events",
    descKey: "eventsDesc",
  },
] as const;

export function BranchBar() {
  const t = useTranslations("branches");
  const pathname = usePathname();

  const normalizedPathname = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
  const visible = normalizedPathname === "/explore" || TABS.some(({ href }) => normalizedPathname === href || normalizedPathname.startsWith(`${href}/`));
  if (!visible) return null;

  return (
    <nav
      aria-label={t("domainNavigation")}
      className="sticky top-[53px] z-20 border-b border-white/70 bg-white/72 shadow-sm backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/78"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-4 gap-1.5 px-2 py-1.5 sm:gap-2 sm:px-4">
        {TABS.map(({ href, icon: Icon, tone, labelKey, descKey }) => {
          const label = t(labelKey);
          const active = normalizedPathname === href || normalizedPathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              title={t(descKey)}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-10 items-center justify-center gap-1 rounded-xl border px-1 text-[10px] font-black transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm motion-reduce:transform-none sm:gap-2 sm:px-3 sm:text-sm ${active ? `${tone} shadow-sm` : "border-transparent bg-white/35 text-slate-600 dark:text-zinc-300"}`}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{label}</span>
              <span className="leading-none sm:hidden">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
