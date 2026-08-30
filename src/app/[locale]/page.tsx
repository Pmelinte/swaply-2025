import { Suspense } from "react";
import HomeBotanicalFrame from "./HomeBotanicalFrame";
import HomeDashboardClient from "./HomeDashboardClient";
import HomeLivingWorld from "./HomeLivingWorld";
import HomeReferenceHero from "./HomeReferenceHero";
import HomeStaticWorldMap from "./HomeStaticWorldMap";
import { SkeletonGrid } from "@/components/ui-custom";

export const revalidate = 300;

export default function HomePage() {
  return (
    <Suspense fallback={<SkeletonGrid count={4} />}>
      <div className="relative left-1/2 w-[calc(100vw-1rem)] -translate-x-1/2 isolate overflow-hidden bg-gradient-to-b from-[#bdefff] via-[#f5ffe9] to-[#eaffb8] px-3 pb-28 pt-3 sm:w-[calc(100vw-2rem)] sm:px-5 sm:pb-32 lg:px-8 xl:px-10">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_48%_5%,rgba(255,255,255,0.96),transparent_18%),radial-gradient(circle_at_78%_12%,rgba(255,255,255,0.75),transparent_15%),linear-gradient(180deg,rgba(83,202,255,0.34),rgba(255,255,255,0)_78%)]"
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto max-w-[1920px] space-y-5">
          <div className="relative [&_section>div:nth-child(3)]:lg:grid-cols-[0.42fr_1.58fr] [&_section>div:nth-child(3)>div:nth-child(2)]:hidden">
            <HomeReferenceHero />
            <HomeStaticWorldMap />
          </div>
          <div className="[&_[data-home-state='authenticated-dashboard']>section:first-child]:!overflow-visible [&_[data-home-state='authenticated-dashboard']>section:first-child]:!rounded-none [&_[data-home-state='authenticated-dashboard']>section:first-child]:!bg-none [&_[data-home-state='authenticated-dashboard']>section:first-child]:!bg-transparent [&_[data-home-state='authenticated-dashboard']>section:first-child]:!text-slate-950 [&_[data-home-state='authenticated-dashboard']>section:first-child]:!shadow-none [&_[data-home-state='authenticated-dashboard']>section:first-child>div:first-child]:!hidden [&_[data-home-state='authenticated-dashboard']>section:first-child_span]:!text-slate-950 [&_[data-home-state='authenticated-dashboard']>section:first-child_p]:!text-slate-600 [&_[data-home-state='authenticated-dashboard']>section:first-child_a]:!border-white/80 [&_[data-home-state='authenticated-dashboard']>section:first-child_a]:!bg-white/60 [&_[data-home-state='authenticated-dashboard']>section:first-child_a]:!text-slate-800 [&_[data-home-state='authenticated-dashboard']>section:first-child_[class*='bg-white/10']]:!bg-white/50 [&_[data-home-state='authenticated-dashboard']>section:first-child_[class*='border-white/15']]:!border-white/80">
            <HomeDashboardClient />
          </div>
          <HomeLivingWorld />
        </div>
        <HomeBotanicalFrame />
      </div>
    </Suspense>
  );
}
