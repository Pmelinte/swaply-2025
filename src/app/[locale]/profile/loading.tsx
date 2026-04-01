import { SkeletonList } from "@/components/ui-custom";

export default function ProfileLoading() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-full animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-24 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
        ))}
      </div>
      <SkeletonList count={4} />
    </div>
  );
}
