"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Crown } from "lucide-react";
import type { PremiumFeature } from "@/lib/monetization";
import { useAppState } from "@/lib/state";

export function LoggedOutGate({ returnTo }: { returnTo: string }) {
  const t = useTranslations("gated");
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-100">
      <h3 className="text-base font-semibold">{t("notLoggedIn")}</h3>
      <p className="mt-1 text-amber-800 dark:text-amber-100">
        {t("loginToView")}
      </p>
      <Link
        className="mt-3 inline-flex rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        href={`/login?returnTo=${encodeURIComponent(returnTo)}`}
      >
        {t("login")}
      </Link>
    </div>
  );
}

export function AdminGate({ }: { children: React.ReactNode }) {
  const t = useTranslations("gated");
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-800 dark:bg-red-900/40 dark:text-red-100">
      <h3 className="text-base font-semibold">{t("accessDenied")}</h3>
      <p className="mt-1 text-red-800 dark:text-red-100">
        {t("adminOnly")}
      </p>
      <Link
        className="mt-3 inline-flex rounded-full bg-zinc-600 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
        href="/"
      >
        {t("backHome")}
      </Link>
    </div>
  );
}

/**
 * Premium feature gate — renders children only if user has access to the feature.
 * Otherwise shows upgrade prompt linking to /pricing.
 */
export function PremiumGate({
  feature,
  children,
  fallback,
}: {
  feature: PremiumFeature;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { hasFeature } = useAppState();
  if (hasFeature(feature)) return <>{children}</>;
  if (fallback) return <>{fallback}</>;
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/30">
      <div className="flex items-center gap-2">
        <Crown className="h-4 w-4 text-amber-500" />
        <span className="font-semibold text-amber-800 dark:text-amber-300">Premium</span>
      </div>
      <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
        Aceasta functionalitate este disponibila doar pentru utilizatorii Premium.
      </p>
      <Link
        href="/pricing"
        className="mt-2 inline-flex rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white hover:bg-amber-600"
      >
        Upgrade la Premium
      </Link>
    </div>
  );
}

export function MissingDataCallout({
  title,
  message,
  cta,
}: {
  title: string;
  message: string;
  cta: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
      </h3>
      <p className="mt-2 text-zinc-600 dark:text-zinc-300">{message}</p>
      <div className="mt-3">{cta}</div>
    </div>
  );
}
