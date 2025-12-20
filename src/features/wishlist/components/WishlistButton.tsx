// src/features/wishlist/components/WishlistButton.tsx

"use client";

import { useEffect, useMemo, useState } from "react";

type WishlistApiResponse =
  | { ok: true; entries?: any[] }
  | { ok: false; error: string };

type Props = {
  itemId: string;
  className?: string;
  compact?: boolean; // dacă vrei icon-only în viitor
};

export default function WishlistButton({ itemId, className, compact }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [itemMeta, setItemMeta] = useState<{
    category?: string | null;
    subcategory?: string | null;
    condition?: string | null;
    approximateValue?: number | null;
  } | null>(null);

  const label = useMemo(() => {
    if (saving) return "Se salvează…";
    return isInWishlist ? "❤️ Salvat" : "🤍 Salvează";
  }, [isInWishlist, saving]);

  // ------------------------------------------------
  // Load initial state (is this item in wishlist?)
  // E MVP logic: luăm tot wishlist-ul și verificăm itemId.
  // (Optimizare ulterioară: endpoint /api/wishlist/contains/:itemId)
  // ------------------------------------------------
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [itemRes, wishRes] = await Promise.all([
          fetch(`/api/items/public/${itemId}`, { cache: "no-store" }),
          fetch("/api/wishlist", { cache: "no-store" }),
        ]);
        const itemData = await itemRes.json().catch(() => null);
        const data: WishlistApiResponse = await wishRes.json();

        if (itemRes.ok && itemData?.ok) {
          setItemMeta({
            category: itemData.item?.category ?? null,
            subcategory: itemData.item?.subcategory ?? null,
            condition: itemData.item?.condition ?? null,
            approximateValue: itemData.item?.approximateValue ?? null,
          });
        }

        if (!wishRes.ok || !data.ok) {
          // Dacă nu e logat, nu spargem UI-ul; doar dezactivăm funcția
          setError((data as any)?.error ?? "Nu pot încărca wishlist-ul.");
          if (mounted) setIsInWishlist(false);
          return;
        }

        const entries = (data as any).entries ?? [];

        const match = entries.find((e: any) => {
          return (
            e.category === itemData?.item?.category &&
            (!e.subcategory || e.subcategory === itemData?.item?.subcategory) &&
            (!e.condition || e.condition === itemData?.item?.condition)
          );
        });

        if (mounted) {
          setIsInWishlist(Boolean(match));
          setEntryId(match?.id ?? null);
        }
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Eroare la wishlist.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [itemId]);

  // ------------------------------------------------
  // Toggle
  // ------------------------------------------------
  const toggle = async () => {
    if (loading || saving) return;

    try {
      setSaving(true);
      setError(null);

      if (!isInWishlist) {
        const price = itemMeta?.approximateValue ?? null;
        const min = price ? Math.max(0, price * 0.8) : null;
        const max = price ? price * 1.2 : null;

        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: itemMeta?.category ?? null,
            subcategory: itemMeta?.subcategory ?? null,
            condition: itemMeta?.condition ?? null,
            priceMin: min,
            priceMax: max,
          }),
        });
        const data: WishlistApiResponse = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error((data as any)?.error ?? "Nu s-a putut salva.");
        }

        const createdId = (data as any).entries?.[0]?.id ?? null;
        setEntryId(createdId);
        setIsInWishlist(true);
        return;
      }

      // REMOVE
      const res = await fetch(`/api/wishlist/${entryId ?? itemId}`, {
        method: "DELETE",
      });
      const data: WishlistApiResponse = await res.json().catch(() => ({ ok: true }));

      if (!res.ok || (data as any).ok === false) {
        throw new Error((data as any)?.error ?? "Nu s-a putut elimina.");
      }

      setIsInWishlist(false);
      setEntryId(null);
    } catch (e: any) {
      setError(e?.message ?? "Eroare la wishlist.");
    } finally {
      setSaving(false);
    }
  };

  const disabled = loading || saving;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition",
        disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50",
        isInWishlist ? "border-pink-300" : "border-gray-300",
        className ?? "",
      ].join(" ")}
      aria-label={isInWishlist ? "Elimină din wishlist" : "Adaugă în wishlist"}
      title={isInWishlist ? "Elimină din wishlist" : "Adaugă în wishlist"}
    >
      {compact ? (isInWishlist ? "❤️" : "🤍") : label}
      {error ? <span className="ml-2 text-xs text-red-600">{error}</span> : null}
    </button>
  );
}
