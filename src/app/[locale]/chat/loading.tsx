import { SkeletonList } from "@/components/ui-custom";

export default function ChatLoading() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-48 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
      <SkeletonList count={5} />
    </div>
  );
}
