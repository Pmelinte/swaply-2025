"use client";

import { Link, usePathname } from "@/i18n/navigation";
import {
  Activity,
  BookOpen,
  Database,
  GitBranch,
  LayoutDashboard,
  Flag,
  Users,
  Package,
  Shield,
} from "lucide-react";
import { useTranslations } from "next-intl";

export function AdminNav() {
  const pathname = usePathname();
  const t = useTranslations("admin");

  const NAV_ITEMS = [
    { href: "/admin", label: t("overview"), icon: LayoutDashboard },
    { href: "/admin/reports", label: t("reports"), icon: Flag },
    { href: "/admin/users", label: t("users"), icon: Users },
    { href: "/admin/items", label: t("items"), icon: Package },
    { href: "/admin/diagnostic", label: "Diagnostic", icon: Activity },
    { href: "/admin/canonical", label: "Canonical", icon: BookOpen },
    { href: "/admin/flows", label: "Flows", icon: GitBranch },
    { href: "/admin/live-data", label: "Live Data", icon: Database },
  ] as const;

  return (
    <nav className="flex flex-wrap gap-1.5">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-blue-600 text-white shadow-sm"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("admin");
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <Shield className="h-6 w-6 text-blue-600" />
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            {t("panelTitle")}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t("panelSubtitle")}
          </p>
        </div>
      </div>
      <AdminNav />
      <div>{children}</div>
    </div>
  );
}

export function AdminGuard({
  user,
  children,
}: {
  user: { role?: string } | null;
  children: React.ReactNode;
}) {
  const t = useTranslations("admin");

  if (!user) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-100">
        <h3 className="text-base font-semibold">{t("authRequired")}</h3>
        <p className="mt-1">{t("authRequiredDesc")}</p>
        <Link
          className="mt-3 inline-flex rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          href="/login?returnTo=/admin"
        >
          {t("authenticate")}
        </Link>
      </div>
    );
  }

  if (user.role !== "admin" && user.role !== "moderator") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-800 dark:bg-red-900/40 dark:text-red-100">
        <h3 className="text-base font-semibold">{t("accessRestricted")}</h3>
        <p className="mt-1">{t("accessRestrictedDesc")}</p>
        <Link
          className="mt-3 inline-flex rounded-full bg-zinc-600 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
          href="/"
        >
          {t("backHome")}
        </Link>
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}

/** Stat card used on the overview page */
export function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {value}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
        </div>
      </div>
    </div>
  );
}
