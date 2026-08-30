"use client";

import { House, Package, Ticket, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";

const domains = [
  { key: "objects", href: "/objects", icon: Package, active: "border-blue-400 bg-blue-200 text-blue-950", idle: "border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100" },
  { key: "properties", href: "/properties", icon: House, active: "border-emerald-400 bg-emerald-200 text-emerald-950", idle: "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100" },
  { key: "services", href: "/services", icon: Wrench, active: "border-violet-400 bg-violet-200 text-violet-950", idle: "border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-100" },
  { key: "events", href: "/events", icon: Ticket, active: "border-orange-400 bg-orange-200 text-orange-950", idle: "border-orange-200 bg-orange-50 text-orange-900 hover:bg-orange-100" },
] as const;

export default function DomainUniverseBar() {
  const pathname = usePathname();
  const tBranch = useTranslations("branches");

  return (
    <nav className="mx-auto grid max-w-6xl grid-cols-2 gap-2 px-4 pt-4 sm:grid-cols-4" aria-label="Swaply domains">
      {domains.map(({ key, href, icon: Icon, active, idle }) => {
        const isActive = pathname?.includes(href);
        return (
          <Link
            key={key}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none ${isActive ? active : idle}`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {tBranch(key)}
          </Link>
        );
      })}
    </nav>
  );
}
