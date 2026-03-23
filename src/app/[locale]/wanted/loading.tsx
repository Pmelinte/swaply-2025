export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
      ))}
    </div>
  );
}
