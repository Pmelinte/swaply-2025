import { Suspense } from "react";
import HomePageClient from "./HomePageClient";
import { SkeletonGrid } from "@/components/ui-custom";

export const revalidate = 300;

function MapFallback() {
  return (
    <div className="h-64 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<SkeletonGrid count={4} />}>
      <HomePageClient />
    </Suspense>
  );
}
