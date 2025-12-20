// src/app/(app)/page.tsx

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Swaply</h1>
        <p className="text-sm text-muted-foreground">
          Etapă de testare: fluxurile sunt conectate end-to-end.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <Link className="rounded-lg border p-4 hover:bg-muted" href="/browse">
          <div className="font-medium">Browse</div>
          <div className="text-xs text-muted-foreground">Listări publice</div>
        </Link>

        <Link className="rounded-lg border p-4 hover:bg-muted" href="/items">
          <div className="font-medium">Items</div>
          <div className="text-xs text-muted-foreground">Obiectele mele</div>
        </Link>

        <Link className="rounded-lg border p-4 hover:bg-muted" href="/matches">
          <div className="font-medium">Matches</div>
          <div className="text-xs text-muted-foreground">Recomandări</div>
        </Link>

        <Link className="rounded-lg border p-4 hover:bg-muted" href="/swaps">
          <div className="font-medium">Swaps</div>
          <div className="text-xs text-muted-foreground">Propuneri & status</div>
        </Link>

        <Link className="rounded-lg border p-4 hover:bg-muted" href="/chat">
          <div className="font-medium">Chat</div>
          <div className="text-xs text-muted-foreground">Mesaje legate de swap</div>
        </Link>

        <Link className="rounded-lg border p-4 hover:bg-muted" href="/map">
          <div className="font-medium">Nearby swaps</div>
          <div className="text-xs text-muted-foreground">Hartă aproximativă</div>
        </Link>

        <Link className="rounded-lg border p-4 hover:bg-muted" href="/premium">
          <div className="font-medium">Premium</div>
          <div className="text-xs text-muted-foreground">Stripe checkout</div>
        </Link>

        <Link className="rounded-lg border p-4 hover:bg-muted" href="/route-map">
          <div className="font-medium">Route map</div>
          <div className="text-xs text-muted-foreground">Toate paginile</div>
        </Link>
      </section>
    </main>
  );
}
