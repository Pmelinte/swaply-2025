import { SkeletonGrid } from "@/components/ui";

export default function MyObjectsLoading() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-48 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
      <SkeletonGrid count={6} />
    </div>
  );
}
