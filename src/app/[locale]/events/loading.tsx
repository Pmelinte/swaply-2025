export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
      <div className="h-8 w-48 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-36 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
      ))}
    </div>
  );
}
