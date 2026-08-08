"use client";

import { useLocale, useTranslations } from "next-intl";
import { SectionCard } from "@/components/ui-custom";
import { normalizePublicLegalCopy } from "@/lib/legal-copy";

const SECTIONS = [
  { id: "data-collected", titleKey: "privacyDataCollected", textKey: "privacyDataCollectedText" },
  { id: "purpose", titleKey: "privacyPurpose", textKey: "privacyPurposeText" },
  { id: "legal-basis", titleKey: "privacyLegalBasis", textKey: "privacyLegalBasisText" },
  { id: "sharing", titleKey: "privacySharing", textKey: "privacySharingText" },
  { id: "cookies", titleKey: "privacyCookies", textKey: "privacyCookiesText" },
  { id: "rights", titleKey: "privacyRights", textKey: "privacyRightsText" },
  { id: "retention", titleKey: "privacyRetention", textKey: "privacyRetentionText" },
  { id: "contact", titleKey: "privacyContact", textKey: "privacyContactText" },
] as const;

const AI_DISCLOSURE: Record<string, string> = {
  en: "AI provider disclosure: AI image analysis is performed server-side. Depending on configuration and availability, image content submitted for AI analysis may be processed by Groq, Google Gemini, or Hugging Face. Not all providers are necessarily active at the same time.",
  ro: "Furnizor AI: analiza AI a imaginilor este efectuată pe server. În funcție de configurare și disponibilitate, conținutul imaginilor trimise pentru analiză AI poate fi procesat de Groq, Google Gemini sau Hugging Face. Nu toți furnizorii sunt în mod necesar activi în același timp.",
};

function getAiDisclosure(locale: string): string {
  return AI_DISCLOSURE[locale] ?? AI_DISCLOSURE.en;
}

export default function PrivacyPage() {
  const t = useTranslations("legal");
  const locale = useLocale();

  return (
    <div className="space-y-4">
      <SectionCard
        title={normalizePublicLegalCopy(t("privacyTitle"))}
        description={normalizePublicLegalCopy(t("privacyLastUpdated"))}
      >
        {/* Last updated badge */}
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          {normalizePublicLegalCopy(t("lastUpdated"))}: 2026-08-08
        </div>

        {/* Table of Contents */}
        <nav className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <p className="mb-2 text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
            {normalizePublicLegalCopy(t("tableOfContents"))}
          </p>
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {normalizePublicLegalCopy(t(s.titleKey))}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="prose prose-sm dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300">
          {SECTIONS.map((s) => (
            <div key={s.id} id={s.id} className="scroll-mt-20">
              <h3>{normalizePublicLegalCopy(t(s.titleKey))}</h3>
              <p>{normalizePublicLegalCopy(t(s.textKey))}</p>
              {s.id === "sharing" && (
                <p data-testid="privacy-ai-provider-disclosure">
                  {getAiDisclosure(locale)}
                </p>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
