"use client";

import { useEffect, useState } from "react";
import { Compass, House, Package, Sparkles, Ticket, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAppState } from "@/lib/state";
import { GuestBanner } from "@/components/GuestBanner";
import { WantsZone } from "@/components/explore/WantsZone";
import { OffersZone } from "@/components/explore/OffersZone";
import { MapSection } from "@/components/explore/MapSection";
import { TrendingFeed } from "@/components/explore/TrendingFeed";
import { GlobalExploreFeed } from "@/components/explore/GlobalExploreFeed";
import { CategoryPickerSheet } from "@/components/explore/CategoryPickerSheet";
import {
  EXPLORE_APPLY_EVENT,
  type ExploreFilters,
} from "@/components/drawer/variants/DrawerExplore";
import { filtersToSearchParams } from "@/lib/explore/exploreFilters";

export function ExploreClient() {
  const { user } = useAppState();
  const router = useRouter();
  const tBranch = useTranslations("branches");
  const tNav = useTranslations("nav");

  const [addWantOpen, setAddWantOpen] = useState(false);
  const [addOfferOpen, setAddOfferOpen] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const filters = (e as CustomEvent<ExploreFilters>).detail;
      const sp = filtersToSearchParams(filters);
      const qs = sp.toString();
      router.replace(qs ? `/explore?${qs}` : `/explore`, { scroll: false });
    };
    window.addEventListener(EXPLORE_APPLY_EVENT, handler);
    return () => window.removeEventListener(EXPLORE_APPLY_EVENT, handler);
  }, [router]);

  const domains = [
    { label: tBranch("objects"), href: "/objects", icon: Package, tone: "border-blue-300 bg-blue-100 text-blue-950 hover:bg-blue-200" },
    { label: tBranch("properties"), href: "/properties", icon: House, tone: "border-emerald-300 bg-emerald-100 text-emerald-950 hover:bg-emerald-200" },
    { label: tBranch("services"), href: "/services", icon: Wrench, tone: "border-violet-300 bg-violet-100 text-violet-950 hover:bg-violet-200" },
    { label: tBranch("events"), href: "/events", icon: Ticket, tone: "border-orange-300 bg-orange-100 text-orange-950 hover:bg-orange-200" },
  ] as const;

  return (
    <>
      {!user && <GuestBanner />}

      <div className="mx-auto max-w-6xl space-y-5 px-4 py-4">
        <section className="relative overflow-hidden rounded-[2rem] border border-cyan-200 bg-gradient-to-br from-cyan-100 via-sky-50 to-emerald-100 p-5 shadow-sm sm:p-7" aria-labelledby="explore-identity-title">
          <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-cyan-300/35 blur-3xl" aria-hidden="true" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300 bg-cyan-50/90 px-3 py-1.5 text-xs font-black text-cyan-900">
              <Compass className="h-4 w-4" aria-hidden="true" />
              Swaply Explore
            </span>
            <h1 id="explore-identity-title" className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {tNav("explore")}
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600">
              Discover across all four Swaply worlds. Explore is the cross-domain discovery space, not a fifth category.
            </p>

            <nav className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Swaply domains">
              {domains.map(({ label, href, icon: Icon, tone }) => (
                <Link key={href} href={href} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none ${tone}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-lime-300 bg-gradient-to-r from-lime-100 via-green-50 to-cyan-100 p-5 shadow-sm sm:p-6" aria-labelledby="swaply-pulse-title">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-green-800">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Swaply Pulse · Week 35
              </div>
              <h2 id="swaply-pulse-title" className="mt-2 text-2xl font-black text-slate-950">Harvest Week</h2>
              <p className="mt-1 text-sm text-slate-600">A weekly theme from the 52 Weeks Calendar, ready to be localized by country and language.</p>
            </div>
            <span className="rounded-full border border-green-300 bg-green-200/80 px-3 py-1.5 text-xs font-black text-green-950">29 Aug – 4 Sep</span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <PulseCard icon={Package} title="Harvest Finds" description="Garden tools, planters, reuse and seasonal objects" tone="border-blue-200 bg-blue-100/75 text-blue-950" />
            <PulseCard icon={House} title="Harvest Stays" description="Country homes, gardens and late-summer stays" tone="border-emerald-200 bg-emerald-100/75 text-emerald-950" />
            <PulseCard icon={Wrench} title="Harvest Skills" description="Gardening, repair, preserving and local know-how" tone="border-violet-200 bg-violet-100/75 text-violet-950" />
            <PulseCard icon={Ticket} title="Harvest Events" description="Local fairs, community gatherings and seasonal experiences" tone="border-orange-200 bg-orange-100/75 text-orange-950" />
          </div>
        </section>

        <WantsZone onAddWant={() => setAddWantOpen(true)} />
        <MapSection />
        <GlobalExploreFeed />
        <TrendingFeed />
        <OffersZone onAddOffer={() => setAddOfferOpen(true)} />
      </div>

      <CategoryPickerSheet open={addWantOpen} onClose={() => setAddWantOpen(false)} intent="want" />
      <CategoryPickerSheet open={addOfferOpen} onClose={() => setAddOfferOpen(false)} intent="offer" />
    </>
  );
}

function PulseCard({ icon: Icon, title, description, tone }: { icon: typeof Package; title: string; description: string; tone: string }) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${tone}`}>
      <Icon className="h-5 w-5" aria-hidden="true" />
      <h3 className="mt-3 font-black">{title}</h3>
      <p className="mt-1 text-xs font-medium leading-5 opacity-75">{description}</p>
    </div>
  );
}

export default ExploreClient;
