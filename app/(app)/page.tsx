// src/app/(app)/page.tsx

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Swaply</h1>
        <p className="text-sm text-muted-foreground">
          Skeleton-ul e live ✅ Acum ai un Home real (nu doar layout).
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <Link className="rounded-lg border p-4 hover:bg-muted" href="/items">
          <div className="font-medium">Items</div>
          <div className="text-xs text-muted-foreground">Listă / browse</div>
        </Link>

        <Link className="rounded-lg border p-4 hover:bg-muted" href="/items/add">
          <div className="font-medium">Add</div>
          <div className="text-xs text-muted-foreground">Adaugă un item</div>
        </Link>

        <Link className="rounded-lg border p-4 hover:bg-muted" href="/matches">
          <div className="font-medium">Matches</div>
          <div className="text-xs text-muted-foreground">Conversații / match-uri</div>
        </Link>

        <Link className="rounded-lg border p-4 hover:bg-muted" href="/settings/profile">
          <div className="font-medium">Profile</div>
          <div className="text-xs text-muted-foreground">Setări profil</div>
        </Link>

        <Link className="rounded-lg border p-4 hover:bg-muted" href="/routes">
          <div className="font-medium">Route map</div>
          <div className="text-xs text-muted-foreground">Toate paginile</div>
        </Link>
      </section>

      <footer className="text-xs text-muted-foreground">
        Dacă după asta paginile încă “arată la fel”, următorul vinovat e
        `src/app/(app)/layout.tsx` (layout-ul înghite copiii).
      </footer>
    </main>
  );
}
