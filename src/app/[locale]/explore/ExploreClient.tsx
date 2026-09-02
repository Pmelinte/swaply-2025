"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Megaphone, ShieldCheck, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useAppState } from "@/lib/state";
import { GuestBanner } from "@/components/GuestBanner";
import { GlobalExploreFeed } from "@/components/explore/GlobalExploreFeed";
import {
  DomainDiscoveryWorld,
  ExploreHubIntro,
  ExploreOpportunityRadar,
} from "@/components/explore/ExploreWorld";
import {
  EXPLORE_APPLY_EVENT,
  type ExploreFilters,
} from "@/components/drawer/variants/DrawerExplore";
import { filtersToSearchParams } from "@/lib/explore/exploreFilters";
import { itemFallbackDemand } from "@/lib/explore/exploreArchitecture";

export function ExploreClient() {
  const { user, items } = useAppState();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("explore.architecture");
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const demands = useMemo(() => itemFallbackDemand(items), [items]);

  useEffect(() => {
    const handler = (event: Event) => {
      const filters = (event as CustomEvent<ExploreFilters>).detail;
      const params = filtersToSearchParams(filters);
      if (query.trim()) params.set("q", query.trim());
      const search = params.toString();
      router.replace(search ? `/explore?${search}` : "/explore", { scroll: false });
    };
    window.addEventListener(EXPLORE_APPLY_EVENT, handler);
    return () => window.removeEventListener(EXPLORE_APPLY_EVENT, handler);
  }, [query, router]);

  useEffect(() => {
    const normalized = query.trim();
    if ((searchParams.get("q") ?? "") === normalized) return;
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (normalized) params.set("q", normalized);
      else params.delete("q");
      const search = params.toString();
      router.replace(search ? `/explore?${search}` : "/explore", { scroll: false });
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [query, router, searchParams]);

  return (
    <>
      {!user && <GuestBanner />}

      <div className="mx-auto max-w-6xl space-y-5 py-2">
        <ExploreHubIntro query={query} onQueryChange={setQuery} />
        <ExploreOpportunityRadar items={items} demands={demands} />

        <section className="grid gap-3 md:grid-cols-2" aria-label={t("campaignsAndLearning")}>
          <article className="rounded-3xl border border-lime-300/80 bg-gradient-to-br from-lime-100/85 to-emerald-50/80 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lime-200 text-lime-900"><Megaphone className="h-5 w-5" /></div>
              <div><span className="text-[10px] font-black uppercase tracking-[.14em] text-lime-800">{t("campaigns")}</span><h2 className="font-black text-slate-950">{t("campaignTitle")}</h2></div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-700">{t("campaignDescription")}</p>
            <div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full border border-lime-300 bg-white/55 px-3 py-1 text-xs font-bold text-lime-900">{t("campaignSeasonal")}</span><span className="rounded-full border border-lime-300 bg-white/55 px-3 py-1 text-xs font-bold text-lime-900">{t("campaignLocal")}</span><span className="rounded-full border border-lime-300 bg-white/55 px-3 py-1 text-xs font-bold text-lime-900">{t("campaignSocial")}</span><span className="rounded-full border border-slate-300 bg-white/55 px-3 py-1 text-xs font-bold text-slate-700">{t("sponsoredLabel")}</span></div>
          </article>

          <article className="rounded-3xl border border-cyan-200/80 bg-gradient-to-br from-cyan-50/90 to-white/80 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-900"><BookOpen className="h-5 w-5" /></div>
              <div><span className="text-[10px] font-black uppercase tracking-[.14em] text-cyan-800">{t("learnTitle")}</span><h2 className="font-black text-slate-950">{t("learnHeading")}</h2></div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-700">{t("learnDescription")}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2"><span className="flex items-center gap-2 rounded-2xl bg-white/70 p-3 text-xs font-bold text-slate-700"><ShieldCheck className="h-4 w-4 text-emerald-700" />{t("learnPrivacy")}</span><span className="flex items-center gap-2 rounded-2xl bg-white/70 p-3 text-xs font-bold text-slate-700"><Sparkles className="h-4 w-4 text-sky-700" />{t("learnAi")}</span></div>
          </article>
        </section>

        <DomainDiscoveryWorld query={query} onQueryChange={setQuery} />
        <GlobalExploreFeed query={query} onQueryChange={setQuery} />
      </div>
    </>
  );
}

export default ExploreClient;
