// src/features/swipe/components/swipe-deck.tsx

"use client";

import { useState } from "react";
import Image from "next/image";
import type { Item } from "@/features/items/types";

type SwipeKind = "supply" | "demand";

interface SwipeDeckProps {
  kind: SwipeKind;
  items: Item[];
}

export function SwipeDeck({ kind, items }: SwipeDeckProps) {
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const hasMore = index < items.length;
  const current = hasMore ? items[index] : null;

  const handleSwipe = async (
    direction: "like" | "dislike" | "superlike",
  ) => {
    if (!current || loading) return;
    setLoading(true);

    try {
      const endpoint =
        kind === "supply" ? "/api/swipe/supply" : "/api/swipe/demand";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: current.id,
          direction,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        console.error("Swipe error:", data.error);
        alert(data.error ?? "Eroare la swipe.");
      } else {
        const match = data.result?.createdMatch;
        if (match) {
          alert("🎉 Ai un match! Poți continua în zona de conversații.");
        }
        // trecem la următorul item
        setIndex((i) => i + 1);
      }
    } catch (err) {
      console.error(err);
      alert("Eroare de rețea la swipe.");
    } finally {
      setLoading(false);
    }
  };

  if (!hasMore) {
    return (
      <div className="text-center mt-10">
        <p className="text-xl font-semibold mb-2">Nu mai sunt obiecte de afișat.</p>
        <p className="text-gray-600 text-sm">
          Revino mai târziu sau ajustează-ți preferințele când modulul de filtre va fi gata.
        </p>
      </div>
    );
  }

  const primaryImage =
    current!.images.find((img) => img.isPrimary) ?? current!.images[0];

  return (
    <div className="max-w-md mx-auto mt-6 space-y-4">
      {/* Cardul obiectului */}
      <div className="border rounded-2xl overflow-hidden shadow-sm bg-white">
        {primaryImage && (
          <div className="relative w-full h-64">
            <Image
              src={primaryImage.url}
              alt={current!.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className="p-4 space-y-2">
          <h2 className="text-2xl font-bold">{current!.title}</h2>
          <p className="text-sm text-gray-500">
            {current!.category}
            {current!.subcategory ? ` • ${current!.subcategory}` : ""}
          </p>

          {current!.description && (
            <p className="text-sm text-gray-700 line-clamp-3">
              {current!.description}
            </p>
          )}

          {current!.locationCity && (
            <p className="text-xs text-gray-500 mt-1">
              Locație: {current!.locationCity}
              {current!.locationCountry ? `, ${current!.locationCountry}` : ""}
            </p>
          )}
        </div>
      </div>

      {/* Butoane de swipe */}
      <div className="flex justify-between gap-3 mt-4">
        <button
          type="button"
          disabled={loading}
          onClick={() => handleSwipe("dislike")}
          className="flex-1 py-3 rounded-full border border-gray-400 text-gray-800 font-semibold"
        >
          ❌ Nu
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => handleSwipe("like")}
          className="flex-1 py-3 rounded-full bg-green-600 text-white font-semibold"
        >
          ✅ Îmi place
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => handleSwipe("superlike")}
          className="flex-1 py-3 rounded-full bg-purple-600 text-white font-semibold text-sm"
        >
          ⭐ Superlike
        </button>
      </div>

      {loading && (
        <p className="text-center text-sm text-gray-500 mt-2">
          Se trimite swipe-ul...
        </p>
      )}
    </div>
  );
}
