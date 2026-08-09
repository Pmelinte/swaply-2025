"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { useAppState } from "@/lib/state";

const FREE_FEATURE_KEYS = ["free1", "free2", "free3", "free4", "free5"] as const;

export default function PricingPage() {
  const t = useTranslations("pricing");
  const { user } = useAppState();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
          {t("title")}
        </h1>
      </div>

      <div className="mx-auto max-w-2xl rounded-2xl border-2 border-blue-500 bg-white p-6 shadow-sm dark:bg-zinc-800">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          {t("freeTitle")}
        </h2>
        <p className="mt-2 text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
          {t("freePrice")}
        </p>

        <ul className="mt-5 space-y-2.5">
          {FREE_FEATURE_KEYS.map((key) => (
            <li key={key} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
              <span>{t(key)}</span>
            </li>
          ))}
        </ul>

        {!user && (
          <Link
            href="/register"
            className="mt-6 inline-flex rounded-full bg-blue-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            {t("freeButton")}
          </Link>
        )}
      </div>
    </div>
  );
}
