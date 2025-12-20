"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type MatchRow = {
  item: any;
  score: number;
  wishlistId: string | null;
};

type ApiResponse =
  | { ok: true; matches: MatchRow[] }
  | { ok: false; error: string };

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/matches", { cache: "no-store" });
        const data: ApiResponse = await res.json();
        if (!res.ok || !data.ok) {
          setError((data as any)?.error ?? "Eroare la încărcare");
          return;
        }
        setMatches(data.matches);
      } catch (err) {
        console.error("[MATCHES_PAGE_ERROR]", err);
        setError("Eroare la încărcare");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">Recomandări</h1>
      <p className="text-sm text-muted-foreground">
        Scoring inițial pe categorie/subcategorie/stare/distanță/popularitate.
      </p>

      {loading && <p>Se încarcă…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && matches.length === 0 && (
        <p className="text-gray-600">Nu există recomandări încă.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {matches.map((match) => {
          const item = match.item;
          const images = Array.isArray(item?.images) ? item.images : [];
          const primary = images.find((img: any) => img?.isPrimary) ?? images[0];

          return (
            <div key={item.id} className="border rounded-lg p-3 space-y-2 bg-white">
              {primary?.url ? (
                <Image
                  src={primary.url}
                  alt={item.title}
                  width={400}
                  height={280}
                  className="h-40 w-full object-cover rounded"
                />
              ) : (
                <div className="h-40 bg-gray-200 rounded flex items-center justify-center">📦</div>
              )}

              <div className="font-semibold line-clamp-2">{item.title}</div>
              <div className="text-xs text-gray-600">
                Scor: {match.score} · {item.category}
              </div>

              <Link
                className="text-sm text-blue-600 hover:underline"
                href={`/items/${item.id}`}
              >
                Vezi item
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
