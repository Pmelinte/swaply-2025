"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { StatsGrid } from "@/features/info/StatsGrid";
import { useAppState } from "@/lib/state";
import { NextStepRecommendation, Pill, SectionCard } from "@/components/ui";
import {
  Check, ChevronDown, Minus, Package, Search, MessageCircle, Repeat2, Leaf,
  Trophy, Flame, Crown, Quote, Calculator, UserPlus, Camera, Sparkles, ArrowRight,
} from "lucide-react";

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

const GUIDE_STEPS = [
  { icon: UserPlus, color: "from-emerald-500 to-teal-600" },
  { icon: Camera, color: "from-blue-500 to-cyan-600" },
  { icon: Search, color: "from-violet-500 to-purple-600" },
  { icon: MessageCircle, color: "from-amber-500 to-orange-600" },
  { icon: Repeat2, color: "from-rose-500 to-pink-600" },
] as const;

export default function InfoPage() {
  const { infoStats, items } = useAppState();
  const t = useTranslations("info");

  const activeItems = items.filter((i) => i.status === "active").length;
  const totalUsers = infoStats?.activeUsers ?? 0;
  const isEarlyStage = activeItems < 100 && totalUsers < 100;

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
          {t("pageTitle")}
        </h1>
        <p className="mt-2 text-base text-zinc-500 dark:text-zinc-400">
          {t("pageSubtitle")}
        </p>
      </div>

      {/* Section 1 — Step-by-step guide */}
      <SectionCard title={t("guideTitle")} description={t("guideDescription")}>
        <div className="space-y-4">
          {GUIDE_STEPS.map((s, i) => {
            const Icon = s.icon;
            const n = i + 1;
            return (
              <div
                key={i}
                className="flex gap-4 rounded-xl border border-zinc-200 bg-white/70 p-5 dark:border-zinc-800 dark:bg-zinc-900/70"
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${s.color} text-white shadow-sm`}>
                  <span className="text-lg font-extrabold">{n}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-zinc-400" />
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-50">
                      {t(`guideStep${n}Title` as `guideStep${1 | 2 | 3 | 4 | 5}Title`)}
                    </h3>
                  </div>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {t(`guideStep${n}Text` as `guideStep${1 | 2 | 3 | 4 | 5}Text`)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

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

      {/* Section 3 — Live stats */}
      <SectionCard title={t("liveStatsTitle")} description={t("liveStatsDescription")}>
        {isEarlyStage ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 p-6 text-center dark:border-blue-800 dark:bg-blue-950/30">
            <Sparkles className="h-8 w-8 text-blue-400" />
            <p className="font-semibold text-zinc-800 dark:text-zinc-100">{t("earlyStageTitle")}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("earlyStageText")}</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-green-200 bg-green-50/50 p-4 text-center dark:border-green-900 dark:bg-green-950/30">
              <Package className="mx-auto mb-2 h-8 w-8 text-green-600 dark:text-green-400" />
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {activeItems.toLocaleString("ro-RO")}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">{t("statsActiveItems")}</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-center dark:border-blue-900 dark:bg-blue-950/30">
              <UserPlus className="mx-auto mb-2 h-8 w-8 text-blue-600 dark:text-blue-400" />
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {totalUsers.toLocaleString("ro-RO")}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">{t("statsUsers")}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-center dark:border-amber-900 dark:bg-amber-950/30">
              <Search className="mx-auto mb-2 h-8 w-8 text-amber-600 dark:text-amber-400" />
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">12</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">{t("statsCategories")}</p>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Stats Grid */}
      <div id="stats">
        <SectionCard title={t("title")} description={t("description")}>
          <StatsGrid stats={infoStats} />
        </SectionCard>
      </div>

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

      {/* Sustainability Counter */}
      <div id="sustainability">
        <SectionCard title={t("sustainabilityTitle")} description={t("sustainabilityDescription")}>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-green-200 bg-green-50/50 p-4 text-center dark:border-green-900 dark:bg-green-950/30">
              <Leaf className="mx-auto mb-2 h-8 w-8 text-green-600 dark:text-green-400" />
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {((infoStats?.globalSwaps ?? 0) * 4.2).toFixed(0)} kg
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">{t("co2Saved")}</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-center dark:border-blue-900 dark:bg-blue-950/30">
              <Package className="mx-auto mb-2 h-8 w-8 text-blue-600 dark:text-blue-400" />
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {infoStats?.globalSwaps ?? 0}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">{t("objectsReused")}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-center dark:border-amber-900 dark:bg-amber-950/30">
              <Repeat2 className="mx-auto mb-2 h-8 w-8 text-amber-600 dark:text-amber-400" />
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                {((infoStats?.globalSwaps ?? 0) * 15).toFixed(0)} RON
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">{t("moneySaved")}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">{t("sustainabilityNote")}</p>
        </SectionCard>
      </div>

      {/* Leaderboard */}
      <div id="leaderboard">
        <SectionCard title={t("leaderboardTitle")} description={t("leaderboardDescription")}>
          <div className="space-y-2">
            {[
              { rank: 1, icon: <Crown className="h-4 w-4 text-amber-500" />, name: t("leaderboard1"), swaps: 47, streak: 12 },
              { rank: 2, icon: <Trophy className="h-4 w-4 text-zinc-400" />, name: t("leaderboard2"), swaps: 35, streak: 8 },
              { rank: 3, icon: <Trophy className="h-4 w-4 text-amber-700" />, name: t("leaderboard3"), swaps: 28, streak: 5 },
            ].map((entry) => (
              <div key={entry.rank} className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/70">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  {entry.rank}
                </div>
                {entry.icon}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{entry.name}</p>
                  <p className="text-xs text-zinc-500">{t("leaderboardSwaps", { count: entry.swaps })}</p>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                  <Flame className="h-3 w-3" />
                  {entry.streak} {t("streak")}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{t("leaderboardNote")}</p>
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
            <Link className="rounded-full bg-blue-600 px-3 py-1 text-white hover:bg-blue-700" href="/terms">
              {t("terms")}
            </Link>
            <Link className="rounded-full bg-zinc-900 px-3 py-1 text-white hover:bg-zinc-800 dark:bg-zinc-200 dark:text-zinc-900" href="/privacy">
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
          {/* Tier cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {([
              { key: "tierFree", border: "border-zinc-200 dark:border-zinc-700", bg: "bg-white/70 dark:bg-zinc-800/60", text: "text-zinc-900 dark:text-zinc-50", desc: t("freeDescription") },
              { key: "tierSilver", border: "border-zinc-300 dark:border-zinc-600", bg: "bg-zinc-50/80 dark:bg-zinc-800/80", text: "text-zinc-700 dark:text-zinc-200", desc: t("premiumDescription") },
              { key: "tierGold", border: "border-blue-200 dark:border-blue-900", bg: "bg-blue-50/50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-300", desc: t("premium") },
              { key: "tierPlatinum", border: "border-amber-200 dark:border-amber-900", bg: "bg-amber-50/50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-300", desc: t("platinumDescription") },
            ] as const).map((tier) => (
              <div key={tier.key} className={`rounded-xl border ${tier.border} ${tier.bg} p-4 shadow-sm`}>
                <h4 className={`text-sm font-semibold ${tier.text}`}>{t(tier.key)}</h4>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">{tier.desc}</p>
              </div>
            ))}
          </div>

          {/* Feature comparison table */}
          <div className="mt-4 overflow-x-auto">
            <h4 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">{t("tierComparison")}</h4>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="pb-2 text-left font-medium text-zinc-500 dark:text-zinc-400" />
                  <th className="pb-2 text-center font-semibold text-zinc-700 dark:text-zinc-200">{t("tierFree")}</th>
                  <th className="pb-2 text-center font-semibold text-zinc-600 dark:text-zinc-300">{t("tierSilver")}</th>
                  <th className="pb-2 text-center font-semibold text-blue-700 dark:text-blue-300">{t("tierGold")}</th>
                  <th className="pb-2 text-center font-semibold text-amber-700 dark:text-amber-300">{t("tierPlatinum")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {([
                  { feature: "featureSwaps",        free: true,  silver: true,  gold: true,  platinum: true },
                  { feature: "featureChat",          free: true,  silver: true,  gold: true,  platinum: true },
                  { feature: "featureMatches",       free: false, silver: true,  gold: true,  platinum: true },
                  { feature: "featureMapPin",        free: false, silver: true,  gold: true,  platinum: true },
                  { feature: "featurePriorityMatch", free: false, silver: false, gold: true,  platinum: true },
                  { feature: "featureAnalytics",     free: false, silver: false, gold: true,  platinum: true },
                  { feature: "featureBadge",         free: false, silver: false, gold: false, platinum: true },
                  { feature: "featureSupport",       free: false, silver: false, gold: false, platinum: true },
                ] as const).map((row) => (
                  <tr key={row.feature}>
                    <td className="py-2 pr-4 text-zinc-700 dark:text-zinc-300">{t(row.feature)}</td>
                    {([row.free, row.silver, row.gold, row.platinum] as const).map((has, i) => (
                      <td key={i} className="py-2 text-center">
                        {has ? (
                          <Check className="mx-auto h-4 w-4 text-emerald-500" />
                        ) : (
                          <Minus className="mx-auto h-4 w-4 text-zinc-300 dark:text-zinc-600" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Tokens row — show amounts instead of checkmarks */}
                <tr>
                  <td className="py-2 pr-4 text-zinc-700 dark:text-zinc-300">{t("featureTokens")}</td>
                  <td className="py-2 text-center font-medium text-zinc-600 dark:text-zinc-400">{t("tokensNone")}</td>
                  <td className="py-2 text-center font-medium text-zinc-600 dark:text-zinc-300">{t("tokensSilver")}</td>
                  <td className="py-2 text-center font-medium text-blue-600 dark:text-blue-400">{t("tokensGold")}</td>
                  <td className="py-2 text-center font-medium text-amber-600 dark:text-amber-400">{t("tokensPlatinum")}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-600 dark:text-zinc-300">
            <Pill color="blue">{t("tokenLedger")}</Pill>
            <Pill color="green">{t("accountBenefits")}</Pill>
            <Pill color="amber">{t("promotions")}</Pill>
          </div>
        </SectionCard>
      </div>

      {/* Ad Zone — Stories / YouTube / AdSense (info page only, never in critical flows) */}
      <div id="ad-zone" className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-4 text-center dark:border-zinc-700 dark:bg-zinc-800/30">
        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Sponsored content</p>
        <div className="mt-2 flex min-h-[90px] items-center justify-center rounded-lg bg-zinc-100 text-xs text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
          AdSense / YouTube / Partner Stories — slot reserved
        </div>
        <p className="mt-1 text-[10px] text-zinc-400 dark:text-zinc-500">Ads appear only on Info & Stories pages, never during swaps or matching.</p>
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

      {/* ── Success Stories ── */}
      <SectionCard title={t("successStories")} description={t("successStoriesDesc")}>
        <div className="space-y-3">
          {[
            { name: "Maria & Andrei", city: "Cluj-Napoca", story: t("story1"), emoji: "📱↔️🎸" },
            { name: "Elena & Mihai", city: "București", story: t("story2"), emoji: "🏠↔️🏠" },
            { name: "Dan & Alexandra", city: "Timișoara", story: t("story3"), emoji: "💻↔️📷" },
          ].map((s) => (
            <div key={s.name} className="flex gap-3 rounded-xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
              <Quote className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
              <div>
                <p className="text-sm italic text-zinc-700 dark:text-zinc-300">&ldquo;{s.story}&rdquo;</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-100">{s.name}</span>
                  <span>·</span>
                  <span>{s.city}</span>
                  <span>·</span>
                  <span>{s.emoji}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Cost Calculator ── */}
      <SectionCard title={t("costCalculator")} description={t("costCalculatorDesc")}>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-green-200 bg-green-50/50 p-4 text-center dark:border-green-800 dark:bg-green-950/30">
            <Calculator className="mx-auto mb-2 h-6 w-6 text-green-600 dark:text-green-400" />
            <p className="text-lg font-bold text-green-700 dark:text-green-300">0 RON</p>
            <p className="text-xs text-green-600 dark:text-green-400">{t("costSwapping")}</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-center dark:border-blue-800 dark:bg-blue-950/30">
            <Calculator className="mx-auto mb-2 h-6 w-6 text-blue-600 dark:text-blue-400" />
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">~500 RON</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">{t("costSaved")}</p>
          </div>
          <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 text-center dark:border-purple-800 dark:bg-purple-950/30">
            <Calculator className="mx-auto mb-2 h-6 w-6 text-purple-600 dark:text-purple-400" />
            <p className="text-lg font-bold text-purple-700 dark:text-purple-300">100%</p>
            <p className="text-xs text-purple-600 dark:text-purple-400">{t("costNoFees")}</p>
          </div>
        </div>
      </SectionCard>

      {/* ── Team ── */}
      <SectionCard title={t("teamTitle")} description={t("teamDesc")}>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { name: "Swaply Team", role: t("teamDev"), emoji: "👨‍💻" },
            { name: "AI Engine", role: t("teamAI"), emoji: "🤖" },
            { name: "Community", role: t("teamCommunity"), emoji: "🌍" },
          ].map((m) => (
            <div key={m.name} className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/70">
              <span className="text-2xl">{m.emoji}</span>
              <div>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{m.name}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{m.role}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* CTA final */}
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-gradient-to-br from-blue-50 to-white p-8 text-center shadow-sm dark:border-zinc-700 dark:from-blue-950/30 dark:to-zinc-900">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-base font-bold text-white shadow-md transition hover:bg-blue-700"
        >
          {t("ctaButton")}
          <ArrowRight className="h-4 w-4" />
        </Link>
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
