import { SkeletonGrid } from "@/components/ui";

export default function ObjectsLoading() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-48 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
      <div className="h-10 w-full animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
      <SkeletonGrid count={8} />
    </div>
  );
}
