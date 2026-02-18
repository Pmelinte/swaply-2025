"use client";

import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/ui";

export default function TermsPage() {
  const t = useTranslations("legal");

  return (
    <div className="space-y-4">
      <SectionCard title={t("termsTitle")} description={t("termsLastUpdated")}>
        <div className="prose prose-sm dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300">
          <h3>{t("termsAcceptance")}</h3>
          <p>{t("termsAcceptanceText")}</p>

          <h3>{t("termsEligibility")}</h3>
          <p>{t("termsEligibilityText")}</p>

          <h3>{t("termsAccountRules")}</h3>
          <p>{t("termsAccountRulesText")}</p>

          <h3>{t("termsSwapRules")}</h3>
          <p>{t("termsSwapRulesText")}</p>

          <h3>{t("termsProhibited")}</h3>
          <p>{t("termsProhibitedText")}</p>

          <h3>{t("termsModeration")}</h3>
          <p>{t("termsModerationText")}</p>

          <h3>{t("termsLiability")}</h3>
          <p>{t("termsLiabilityText")}</p>

          <h3>{t("termsChanges")}</h3>
          <p>{t("termsChangesText")}</p>

          <h3>{t("termsContact")}</h3>
          <p>{t("termsContactText")}</p>
        </div>
      </SectionCard>
    </div>
  );
}
