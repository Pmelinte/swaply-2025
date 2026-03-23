"use client";

import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/ui";

const SECTIONS = [
  { id: "acceptance", titleKey: "termsAcceptance", textKey: "termsAcceptanceText" },
  { id: "eligibility", titleKey: "termsEligibility", textKey: "termsEligibilityText" },
  { id: "account-rules", titleKey: "termsAccountRules", textKey: "termsAccountRulesText" },
  { id: "swap-rules", titleKey: "termsSwapRules", textKey: "termsSwapRulesText" },
  { id: "prohibited", titleKey: "termsProhibited", textKey: "termsProhibitedText" },
  { id: "moderation", titleKey: "termsModeration", textKey: "termsModerationText" },
  { id: "liability", titleKey: "termsLiability", textKey: "termsLiabilityText" },
  { id: "changes", titleKey: "termsChanges", textKey: "termsChangesText" },
  { id: "contact", titleKey: "termsContact", textKey: "termsContactText" },
] as const;

export default function TermsPage() {
  const t = useTranslations("legal");

  return (
    <div className="space-y-4">
      <SectionCard title={t("termsTitle")} description={t("termsLastUpdated")}>
        {/* Last updated badge */}
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          {t("lastUpdated")}: 2026-02-15
        </div>

        {/* Table of Contents */}
        <nav className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <p className="mb-2 text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">{t("tableOfContents")}</p>
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {t(s.titleKey)}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="prose prose-sm dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300">
          {SECTIONS.map((s) => (
            <div key={s.id} id={s.id} className="scroll-mt-20">
              <h3>{t(s.titleKey)}</h3>
              <p>{t(s.textKey)}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
