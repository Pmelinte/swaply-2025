// src/app/(app)/items/[id]/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import WishlistButton from "@/features/wishlist/components/WishlistButton";

type ItemImage = { url: string; isPrimary?: boolean };

type Item = {
  id: string;
  ownerId?: string; // poate fi util mai târziu
  title: string;
  description: string | null;

  category: string | null;
  subcategory: string | null;
  tags: string[] | null;
  condition: string | null;

  locationCity: string | null;
  locationCountry: string | null;

  approximateValue: number | null;
  currency: string | null;

  images: ItemImage[] | null;

  status?: string | null;
  createdAt?: string;
};

type ApiResponse = { ok: true; item: Item } | { ok: false; error: string };

export default function ItemPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [swiping, setSwiping] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/items/${id}`, { cache: "no-store" });
        const data: ApiResponse = await res.json();

        if (!res.ok || !data.ok) {
          setError((data as any)?.error ?? "Eroare la încărcarea itemului.");
          setItem(null);
          return;
        }

        setItem(data.item);
        setError(null);
      } catch (err) {
        console.error("[ITEM_PAGE_LOAD_ERROR]", err);
        setError("Eroare la încărcare.");
        setItem(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
  }, [id]);

  const primaryImage = useMemo(() => {
    if (!item?.images || item.images.length === 0) return null;
    return item.images.find((i) => i.isPrimary) ?? item.images[0];
  }, [item]);

  const locationLabel = useMemo(() => {
    const city = item?.locationCity?.trim();
    const country = item?.locationCountry?.trim();
    if (!city && !country) return null;
    if (city && country) return `${city}, ${country}`;
    return city || country || null;
  }, [item]);

  // MVP: "swipe / interest" spre item (endpoint-ul tău existent /api/swipe/supply)
  const proposeInterest = async () => {
    if (!item?.id) return;

    try {
      setSwiping(true);

      const res = await fetch("/api/swipe/supply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          desired_item_id: item.id,
          note: "interest_from_item_page",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        // dacă nu e logat, endpoint-ul tău dă 401 not_authenticated
        alert(
          data?.error === "not_authenticated"
            ? "Trebuie să fii logat ca să arăți interes."
            : "Nu s-a putut trimite interesul (swipe).",
        );
        return;
      }

      alert("✅ Interes trimis! (swipe/supply)");
      // opțional: router.push("/chat") când ai flux complet de match
    } catch (err) {
      console.error("[ITEM_SWIPE_ERROR]", err);
      alert("Eroare la trimiterea interesului.");
    } finally {
      setSwiping(false);
    }
  };

  if (loading) {
    return <div className="max-w-3xl mx-auto p-4">Se încarcă…</div>;
  }

  if (error || !item) {
    return (
      <div className="max-w-3xl mx-auto p-4 text-red-600">
        {error ?? "Item inexistent."}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Imagine */}
      {primaryImage ? (
        <Image
          src={primaryImage.url}
          alt={item.title}
          width={900}
          height={560}
          className="rounded-lg object-cover w-full"
          priority
        />
      ) : (
        <div className="h-64 bg-gray-200 rounded flex items-center justify-center">
          📦
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{item.title}</h1>

          <div className="text-sm text-gray-600 flex flex-wrap gap-x-3 gap-y-1">
            {item.category ? (
              <span className="capitalize">
                🧩 {item.category}
                {item.subcategory ? ` / ${item.subcategory}` : ""}
              </span>
            ) : null}

            {locationLabel ? <span>📍 {locationLabel}</span> : null}

            {item.condition ? (
              <span className="capitalize">🛠️ {item.condition}</span>
            ) : null}

            {typeof item.approximateValue === "number" ? (
              <span>
                💰 {item.approximateValue} {item.currency ?? ""}
              </span>
            ) : null}
          </div>
        </div>

        {/* Wishlist */}
        <div className="shrink-0">
          <WishlistButton itemId={item.id} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={proposeInterest}
          disabled={swiping}
          className={[
            "px-4 py-2 rounded font-semibold border",
            swiping ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50",
          ].join(" ")}
        >
          {swiping ? "Se trimite…" : "🤝 Arată interes (swipe)"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/chat")}
          className="px-4 py-2 rounded font-semibold border hover:bg-gray-50"
          title="Inbox conversații"
        >
          💬 Chat
        </button>
      </div>

      {/* Descriere */}
      {item.description ? (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Descriere</h2>
          <p className="text-gray-800 whitespace-pre-line">{item.description}</p>
        </div>
      ) : null}

      {/* Tags */}
      {item.tags && item.tags.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Etichete</h2>
          <div className="flex flex-wrap gap-2">
            {item.tags.map((t) => (
              <span
                key={t}
                className="text-xs border rounded-full px-3 py-1 bg-white"
              >
                #{t}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* AdSense placeholder (discret, fără script) */}
      <div className="border rounded-lg p-3 bg-gray-50">
        <div className="text-xs text-gray-500">
          Reclame (placeholder discret) — AdSense se conectează mai târziu
        </div>
        <div className="h-20 flex items-center justify-center text-gray-400">
          [Ad slot]
        </div>
      </div>
    </div>
  );
}