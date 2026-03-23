"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/ui";
import { Camera, Search, MessageCircle, ArrowRight, Code2 } from "lucide-react";

const STEPS_ICONS = [Camera, Search, MessageCircle] as const;

const COMPARISON_ROWS = [
  "needMoney",
  "commission",
  "priceNegotiation",
  "getSomethingUseful",
  "ecoImpact",
] as const;

export default function AboutPage() {
  const t = useTranslations("about");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
          {t("title")}
        </h1>
        <p className="mt-2 text-base text-zinc-500 dark:text-zinc-400">
          {t("subtitle")}
        </p>
      </div>

      {/* Section 1 — Story */}
      <SectionCard title={t("storyTitle")}>
        <div className="prose prose-sm dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-300">
          <p>{t("storyP1")}</p>
          <p>{t("storyP2")}</p>
          <p>{t("storyP3")}</p>
        </div>
      </SectionCard>

      {/* Section 2 — How it works */}
      <SectionCard title={t("howTitle")} description={t("howDescription")}>
        <div className="grid gap-4 sm:grid-cols-3">
          {([0, 1, 2] as const).map((i) => {
            const Icon = STEPS_ICONS[i];
            return (
              <div
                key={i}
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-50">
                  {t(`step${i + 1}Title` as `step${1 | 2 | 3}Title`)}
                </h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {t(`step${i + 1}Text` as `step${1 | 2 | 3}Text`)}
                </p>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Section 3 — Why Swaply */}
      <SectionCard title={t("whyTitle")}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="pb-2 pr-4 font-semibold text-zinc-500 dark:text-zinc-400" />
                <th className="pb-2 pr-4 font-semibold text-zinc-500 dark:text-zinc-400">{t("compareColumnOther")}</th>
                <th className="pb-2 font-semibold text-blue-600 dark:text-blue-400">Swaply</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {COMPARISON_ROWS.map((row) => (
                <tr key={row}>
                  <td className="py-2.5 pr-4 font-medium text-zinc-700 dark:text-zinc-300">
                    {t(`compare_${row}_label`)}
                  </td>
                  <td className="py-2.5 pr-4 text-zinc-500 dark:text-zinc-400">
                    {t(`compare_${row}_olx`)}
                  </td>
                  <td className="py-2.5 font-medium text-zinc-900 dark:text-zinc-100">
                    {t(`compare_${row}_swaply`)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Section 4 — Who we are */}
      <SectionCard title={t("whoTitle")}>
        <blockquote className="border-l-4 border-blue-400 pl-4 text-sm italic text-zinc-600 dark:text-zinc-300">
          {t("whoQuote")}
        </blockquote>
      </SectionCard>

      {/* Section 5 — Tech stack */}
      <SectionCard title={t("techTitle")}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">
            <Code2 className="h-5 w-5" />
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            {t("techDescription")}
          </p>
        </div>
      </SectionCard>

      {/* Section 6 — CTA */}
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
