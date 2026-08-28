import { Suspense } from "react";
import HomeDashboardClient from "./HomeDashboardClient";
import HomeLivingWorld, { HomeWorldMap } from "./HomeLivingWorld";
import { SkeletonGrid } from "@/components/ui-custom";

export const revalidate = 300;

export default function HomePage() {
  return (
    <Suspense fallback={<SkeletonGrid count={4} />}>
      <div className="space-y-8">
        <HomeWorldMap />
        <HomeDashboardClient />
        <HomeLivingWorld />
      </div>
    </Suspense>
  );
}
