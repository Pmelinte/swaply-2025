"use client";

import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/ui-custom";
import {
  SWAPLY_TERMS_REVISION_DATE,
  getPublicTermsSectionCopy,
  normalizePublicLegalCopy,
  type PublicTermsSectionId,
} from "@/lib/legal-copy";

const SECTIONS: ReadonlyArray<{
  id: PublicTermsSectionId;
  titleKey:
    | "termsAcceptance"
    | "termsEligibility"
    | "termsAccountRules"
    | "termsSwapRules"
    | "termsProhibited"
    | "termsModeration"
    | "termsLiability"
    | "termsIP"
    | "termsChanges"
    | "termsContact";
  textKey:
    | "termsAcceptanceText"
    | "termsEligibilityText"
    | "termsAccountRulesText"
    | "termsSwapRulesText"
    | "termsProhibitedText"
    | "termsModerationText"
    | "termsLiabilityText"
    | "termsIPText"
    | "termsChangesText"
    | "termsContactText";
}> = [
  { id: "acceptance", titleKey: "termsAcceptance", textKey: "termsAcceptanceText" },
  { id: "eligibility", titleKey: "termsEligibility", textKey: "termsEligibilityText" },
  { id: "account-rules", titleKey: "termsAccountRules", textKey: "termsAccountRulesText" },
  { id: "swap-rules", titleKey: "termsSwapRules", textKey: "termsSwapRulesText" },
  { id: "prohibited", titleKey: "termsProhibited", textKey: "termsProhibitedText" },
  { id: "moderation", titleKey: "termsModeration", textKey: "termsModerationText" },
  { id: "liability", titleKey: "termsLiability", textKey: "termsLiabilityText" },
  { id: "intellectual-property", titleKey: "termsIP", textKey: "termsIPText" },
  { id: "changes", titleKey: "termsChanges", textKey: "termsChangesText" },
  { id: "contact", titleKey: "termsContact", textKey: "termsContactText" },
];

export default function TermsPage() {
  const t = useTranslations("legal");

  return (
    <div className="space-y-4">
      <SectionCard
        title={normalizePublicLegalCopy(t("termsTitle"))}
        description={normalizePublicLegalCopy(t("termsLastUpdated"))}
      >
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          {normalizePublicLegalCopy(t("lastUpdated"))}: {SWAPLY_TERMS_REVISION_DATE}
        </div>

        <nav className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <p className="mb-2 text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
            {normalizePublicLegalCopy(t("tableOfContents"))}
          </p>
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {normalizePublicLegalCopy(t(section.titleKey))}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="prose prose-sm dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300">
          {SECTIONS.map((section) => (
            <div key={section.id} id={section.id} className="scroll-mt-20">
              <h3>{normalizePublicLegalCopy(t(section.titleKey))}</h3>
              <p>{getPublicTermsSectionCopy(section.id, t(section.textKey))}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
