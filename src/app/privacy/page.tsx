"use client";

import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/ui";

export default function PrivacyPage() {
  const t = useTranslations("legal");

  return (
    <div className="space-y-4">
      <SectionCard title={t("privacyTitle")} description={t("privacyLastUpdated")}>
        <div className="prose prose-sm dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300">
          <h3>{t("privacyDataCollected")}</h3>
          <p>{t("privacyDataCollectedText")}</p>

          <h3>{t("privacyPurpose")}</h3>
          <p>{t("privacyPurposeText")}</p>

          <h3>{t("privacyLegalBasis")}</h3>
          <p>{t("privacyLegalBasisText")}</p>

          <h3>{t("privacySharing")}</h3>
          <p>{t("privacySharingText")}</p>

          <h3>{t("privacyCookies")}</h3>
          <p>{t("privacyCookiesText")}</p>

          <h3>{t("privacyRights")}</h3>
          <p>{t("privacyRightsText")}</p>

          <h3>{t("privacyRetention")}</h3>
          <p>{t("privacyRetentionText")}</p>

          <h3>{t("privacyContact")}</h3>
          <p>{t("privacyContactText")}</p>
        </div>
      </SectionCard>
    </div>
  );
}
