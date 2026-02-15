"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

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
