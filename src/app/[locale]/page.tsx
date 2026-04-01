import { Suspense } from "react";
import HomePageClient from "./HomePageClient";
import { StatsBar } from "@/components/homepage/StatsBar";
import { RecentItems } from "@/components/homepage/RecentItems";
import { CurrentEventBanner } from "@/components/events/CurrentEventBanner";
import { SkeletonGrid } from "@/components/ui-custom";

function StatsBarFallback() {
  return (
    <section className="rounded-2xl bg-[#F8F9FA] px-4 py-8 shadow-sm dark:bg-zinc-800/50 sm:px-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200/60 bg-white px-4 py-5 shadow-sm dark:border-zinc-700/50 dark:bg-zinc-900">
            <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-7 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-3 w-20 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
          </div>
        ))}
      </div>
    </section>
  );
}

function RecentItemsFallback() {
  return (
    <section>
      <div className="mb-4 h-6 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
      <SkeletonGrid count={4} />
    </section>
  );
}

export default function HomePage() {
  return (
    <HomePageClient
      statsSlot={
        <Suspense fallback={<StatsBarFallback />}>
          <StatsBar />
        </Suspense>
      }
      eventSlot={
        <Suspense fallback={null}>
          <CurrentEventBanner />
        </Suspense>
      }
      recentItemsSlot={
        <Suspense fallback={<RecentItemsFallback />}>
          <RecentItems />
        </Suspense>
      }
    />
  );
}
