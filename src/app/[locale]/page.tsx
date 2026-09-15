import { Suspense } from "react";
import HomeDashboardClient from "./HomeDashboardClient";
import HomeLivingWorld from "./HomeLivingWorld";
import HomeStaticWorldMap from "./HomeStaticWorldMap";
import HomeWorldHero from "@/components/home/HomeWorldHero";
import styles from "./HomeUnifiedTheme.module.css";
import { SkeletonGrid } from "@/components/ui-custom";

export const revalidate = 300;

export default function HomePage() {
  return (
    <Suspense fallback={<SkeletonGrid count={4} />}>
      <div className={`${styles.home} relative left-1/2 w-[calc(100vw-1rem)] -translate-x-1/2 isolate px-2 pb-28 pt-3 sm:w-[calc(100vw-2rem)] sm:px-4 sm:pb-32 lg:px-6`}>
        <div className="relative z-10 mx-auto max-w-[1920px] space-y-5">
          <HomeWorldHero />
          <HomeDashboardClient />
          <div className={styles.map}><HomeStaticWorldMap /></div>
          <HomeLivingWorld />
        </div>
      </div>
    </Suspense>
  );
}
