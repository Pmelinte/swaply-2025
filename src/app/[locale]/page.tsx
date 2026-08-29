import { Suspense } from "react";
import HomeDashboardClient from "./HomeDashboardClient";
import HomeLivingWorld from "./HomeLivingWorld";
import HomeWorldExperience from "./HomeWorldExperience";
import { SkeletonGrid } from "@/components/ui-custom";

export const revalidate = 300;

export default function HomePage() {
  return (
    <Suspense fallback={<SkeletonGrid count={4} />}>
      <div className="space-y-8 rounded-[2.5rem] bg-gradient-to-b from-sky-50 via-lime-50/50 to-green-100/70 p-1 sm:p-2">
        <HomeWorldExperience />
        <HomeDashboardClient />
        <HomeLivingWorld />
      </div>
    </Suspense>
  );
}
