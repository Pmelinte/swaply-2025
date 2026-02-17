"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { StatsGrid } from "@/features/info/StatsGrid";
import { useAppState } from "@/lib/state";
import { NextStepRecommendation, Pill, SectionCard } from "@/components/ui";
import { ChevronDown, HelpCircle, Package, Search, MessageCircle, Repeat2 } from "lucide-react";

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-zinc-100 dark:border-zinc-800">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-3 text-left"
      >
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{question}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <p className="pb-3 text-sm text-zinc-600 dark:text-zinc-300">{answer}</p>
      )}
    </div>
  );
}

export default function InfoPage() {
  const { infoStats } = useAppState();
  const t = useTranslations("info");

  return (
    <div className="space-y-4">
      {/* How it works */}
      <SectionCard title={t("howItWorks")} description={t("howItWorksDescription")}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { step: "1", icon: <Package className="h-5 w-5" />, title: t("howStep1"), desc: t("howStep1Desc"), color: "from-emerald-500 to-teal-600" },
            { step: "2", icon: <Search className="h-5 w-5" />, title: t("howStep2"), desc: t("howStep2Desc"), color: "from-blue-500 to-cyan-600" },
            { step: "3", icon: <MessageCircle className="h-5 w-5" />, title: t("howStep3"), desc: t("howStep3Desc"), color: "from-violet-500 to-purple-600" },
            { step: "4", icon: <Repeat2 className="h-5 w-5" />, title: t("howStep4"), desc: t("howStep4Desc"), color: "from-amber-500 to-orange-600" },
          ].map((s) => (
            <div
              key={s.step}
              className="rounded-xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/70"
            >
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} text-white shadow-sm`}>
                {s.icon}
              </div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{s.title}</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Stats */}
      <div id="stats">
        <SectionCard title={t("title")} description={t("description")}>
          <StatsGrid stats={infoStats} />
        </SectionCard>
      </div>

      {/* FAQ */}
      <SectionCard title={t("faq")} description={t("faqDescription")}>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          <FaqItem question={t("faqQ1")} answer={t("faqA1")} />
          <FaqItem question={t("faqQ2")} answer={t("faqA2")} />
          <FaqItem question={t("faqQ3")} answer={t("faqA3")} />
          <FaqItem question={t("faqQ4")} answer={t("faqA4")} />
          <FaqItem question={t("faqQ5")} answer={t("faqA5")} />
        </div>
      </SectionCard>

      {/* Map & Privacy */}
      <div id="map">
        <SectionCard title={t("mapAndPrivacy")} description={t("mapProviderNote")}>
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

      {/* Help & Legal */}
      <div id="legal">
        <SectionCard title={t("helpAndLegal")} description={t("helpDescription")}>
          <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
            <li>{t("termsAndPrivacy")}</li>
            <li>{t("manageCookies")}</li>
            <li>{t("faqSwap")}</li>
          </ul>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <Link className="rounded-full bg-blue-600 px-3 py-1 text-white hover:bg-blue-700" href="/info#legal">
              {t("terms")}
            </Link>
            <Link className="rounded-full bg-zinc-900 px-3 py-1 text-white hover:bg-zinc-800" href="/info#legal">
              {t("gdpr")}
            </Link>
            <Link className="rounded-full bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-700" href="/info#stats">
              {t("help")}
            </Link>
          </div>
        </SectionCard>
      </div>

      {/* Monetization */}
      <div id="monetizare">
        <SectionCard title={t("monetization")} description={t("monetizationDescription")}>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white/70 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-800/60">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{t("free")}</h4>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">{t("freeDescription")}</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm dark:border-blue-900 dark:bg-blue-950/30">
              <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300">{t("premium")}</h4>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">{t("premiumDescription")}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm dark:border-amber-900 dark:bg-amber-950/30">
              <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-300">{t("platinum")}</h4>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">{t("platinumDescription")}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-600 dark:text-zinc-300">
            <Pill color="blue">{t("tokenLedger")}</Pill>
            <Pill color="green">{t("accountBenefits")}</Pill>
            <Pill color="amber">{t("promotions")}</Pill>
          </div>
        </SectionCard>
      </div>

      {/* AI Contract */}
      <div id="ai-contract">
        <SectionCard title={t("aiContract")} description={t("aiContractDescription")}>
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
    </div>
  );
}
