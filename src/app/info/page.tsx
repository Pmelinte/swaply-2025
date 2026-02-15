"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { StatsGrid } from "@/features/info/StatsGrid";
import { useAppState } from "@/lib/state";
import { NextStepRecommendation, Pill, SectionCard, StateShowcase } from "@/components/ui";

export default function InfoPage() {
  const { infoStats } = useAppState();
  const t = useTranslations("info");

  return (
    <div className="space-y-4">
      <div id="stats">
        <SectionCard
          title={t("title")}
          description={t("description")}
        >
          <StatsGrid stats={infoStats} />
        </SectionCard>
      </div>

      <div id="map">
        <SectionCard
          title={t("mapAndPrivacy")}
          description={t("mapProviderNote")}
        >
          <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
            <li>{t("premiumPinsOnly")}</li>
            <li>{t("approximateLocation")}</li>
            <li>{t("mapFallback")}</li>
          </ul>
          <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {t("mapRulesNote")}
          </div>
        </SectionCard>
      </div>

      <div id="legal">
        <SectionCard title={t("helpAndLegal")} description={t("helpDescription")}>
          <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
            <li>{t("termsAndPrivacy")}</li>
            <li>{t("manageCookies")}</li>
            <li>{t("faqSwap")}</li>
          </ul>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <Link className="rounded-full bg-blue-600 px-3 py-1 text-white" href="#">
              {t("terms")}
            </Link>
            <Link className="rounded-full bg-zinc-900 px-3 py-1 text-white" href="#">
              {t("gdpr")}
            </Link>
            <Link className="rounded-full bg-emerald-600 px-3 py-1 text-white" href="#">
              {t("help")}
            </Link>
          </div>
        </SectionCard>
      </div>

      <div id="monetizare">
        <SectionCard title={t("monetization")} description={t("monetizationDescription")}>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white/70 p-3 shadow-sm dark:bg-zinc-800/60">
              <h4 className="text-sm font-semibold">{t("free")}</h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">{t("freeDescription")}</p>
            </div>
            <div className="rounded-xl bg-white/70 p-3 shadow-sm dark:bg-zinc-800/60">
              <h4 className="text-sm font-semibold">{t("premium")}</h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">{t("premiumDescription")}</p>
            </div>
            <div className="rounded-xl bg-white/70 p-3 shadow-sm dark:bg-zinc-800/60">
              <h4 className="text-sm font-semibold">{t("platinum")}</h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">{t("platinumDescription")}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-zinc-600 dark:text-zinc-300">
            <Pill color="blue">{t("tokenLedger")}</Pill>
            <Pill color="green">{t("accountBenefits")}</Pill>
            <Pill color="amber">{t("promotions")}</Pill>
          </div>
        </SectionCard>
      </div>

      <div id="ai-contract">
        <SectionCard title={t("aiContract")} description={t("aiContractDescription")} >
          <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
            <li>{t("aiServerSide")}</li>
            <li>{t("aiModeration")}</li>
            <li>{t("aiMetadata")}</li>
            <li>{t("aiSeparation")}</li>
            <li>{t("aiFallback")}</li>
          </ul>
        </SectionCard>
      </div>

      <NextStepRecommendation
        steps={[
          { label: t("startWithObjects"), href: "/objects", description: t("startWithObjectsDescription") },
          { label: t("discoverMatches"), href: "/match", description: t("discoverMatchesDescription") },
          { label: t("authentication"), href: "/login", description: t("authenticationDescription") },
        ]}
      />

      <StateShowcase
        title="Stări INFO"
        states={[
          {
            key: "loading",
            title: "Statistici în încărcare",
            description: "Skeleton pe grila de statistici + badge pentru legal până sosesc datele.",
          },
          {
            key: "empty",
            title: "Nicio metadată disponibilă",
            description: "Afișăm text fallback și link direct către secțiunea legal; nu returnăm 404.",
          },
          {
            key: "error",
            title: "Eroare la hărți/contract AI",
            description: "Mesaj clar despre provider indisponibil + fallback manual explicit pe pagină.",
          },
        ]}
      />
    </div>
  );
}
