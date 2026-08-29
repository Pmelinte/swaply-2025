import { Suspense } from "react";
import HomeBotanicalFrame from "./HomeBotanicalFrame";
import HomeDashboardClient from "./HomeDashboardClient";
import HomeLivingWorld from "./HomeLivingWorld";
import HomeWorldExperience from "./HomeWorldExperience";
import { SkeletonGrid } from "@/components/ui-custom";

export const revalidate = 300;

export default function HomePage() {
  return (
    <Suspense fallback={<SkeletonGrid count={4} />}>
      <div className="relative isolate overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-sky-50 via-lime-50/55 to-green-100/85 p-1 pb-24 sm:p-2 sm:pb-28">
        <div className="relative z-10 space-y-8">
          <HomeWorldExperience />
          <HomeDashboardClient />
          <HomeLivingWorld />
        </div>
        <HomeBotanicalFrame />
      </div>
    </Suspense>
  );
}
