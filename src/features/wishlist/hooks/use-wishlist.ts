// src/features/wishlist/hooks/use-wishlist.ts

"use client";

import { useCallback, useEffect, useState } from "react";
import type { WishlistEntry, WishlistApiResponse } from "@/features/wishlist/types";

export function useWishlist() {
  const [items, setItems] = useState<WishlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/wishlist", { cache: "no-store" });
      const data: WishlistApiResponse = await res.json();

      if (!res.ok || !data.ok) {
        setError((data as any)?.error ?? "Eroare la încărcare wishlist.");
        return;
      }

      setItems(data.entries ?? []);
      setError(null);
    } catch (err) {
      console.error("[USE_WISHLIST_LOAD_ERROR]", err);
      setError("Eroare la încărcare wishlist.");
    } finally {
      setLoading(false);
    }
  }, []);

  const add = useCallback(async (input: Partial<WishlistEntry>) => {
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const data: WishlistApiResponse = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error((data as any)?.error ?? "Nu s-a putut adăuga.");
    }

    await load();
  }, [load]);

  const remove = useCallback(async (entryId: string) => {
    const res = await fetch(`/api/wishlist/${entryId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error("Nu s-a putut elimina.");
    }

    setItems((prev) => prev.filter((i) => i.id !== entryId));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    items,
    loading,
    error,
    reload: load,
    add,
    remove,
  };
}
