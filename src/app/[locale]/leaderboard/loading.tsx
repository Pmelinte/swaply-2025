export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
      <div className="h-8 w-48 mx-auto animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
      ))}
    </div>
  );
}
