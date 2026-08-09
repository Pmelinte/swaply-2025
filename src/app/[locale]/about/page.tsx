"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, Camera, MessageCircle, Search } from "lucide-react";

const STEPS = [
  { titleKey: "step1Title", icon: Camera },
  { titleKey: "step2Title", icon: Search },
  { titleKey: "step3Title", icon: MessageCircle },
] as const;

export default function AboutPage() {
  const t = useTranslations("about");

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
          {t("title")}
        </h1>
        <p className="mx-auto mt-2 max-w-3xl text-base leading-7 text-zinc-500 dark:text-zinc-400">
          {t("subtitle")}
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          {t("howTitle")}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {STEPS.map(({ titleKey, icon: Icon }) => (
            <div
              key={titleKey}
              className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-50">
                {t(titleKey)}
              </h3>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          {t("whoTitle")}
        </h2>
        <blockquote className="mt-3 border-l-4 border-blue-400 pl-4 text-sm italic text-zinc-600 dark:text-zinc-300">
          {t("whoQuote")}
        </blockquote>
      </section>

      <div className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-gradient-to-br from-blue-50 to-white p-8 text-center shadow-sm dark:border-zinc-700 dark:from-blue-950/30 dark:to-zinc-900">
        <Link
          href="/register"
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-base font-bold text-white shadow-md transition hover:bg-blue-700"
        >
          {t("ctaButton")}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          {t("ctaSub")}
        </p>
      </div>
    </div>
  );
}
