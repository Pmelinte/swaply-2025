export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
      <div className="h-8 w-40 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
        ))}
      </div>
    </div>
  );
}
