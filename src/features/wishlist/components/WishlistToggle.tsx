// src/features/wishlist/components/WishlistToggle.tsx

"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  itemId: string;
  className?: string;

  /**
   * Aspect UI:
   * - "icon" = mic, discret, bun pe carduri
   * - "button" = buton normal, bun pe pagina itemului
   */
  variant?: "icon" | "button";

  /**
   * Text opțional (dacă vrei să-l forțezi)
   */
  labelAdd?: string;
  labelRemove?: string;
};

type WishlistEntry = {
  id: string;
  userId: string;
  itemId: string;
  createdAt: string;
};

type WishlistApiResponse =
  | { ok: true; entries?: WishlistEntry[]; items?: any[] }
  | { ok: false; error: string };

export function WishlistToggle({
  itemId,
  className,
  variant = "button",
  labelAdd = "Salvează",
  labelRemove = "Salvat",
}: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [entries, setEntries] = useState<WishlistEntry[]>([]);

  const isInWishlist = useMemo(() => {
    return entries.some((e) => e.itemId === itemId);
  }, [entries, itemId]);

  // ------------------------------------------------
  // Load wishlist entries (minimal)
  // ------------------------------------------------
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/wishlist", { cache: "no-store" });
        const data: WishlistApiResponse = await res.json();

        if (!res.ok || !data.ok) {
          // dacă nu e logat, nu e “error fatal” pentru UI, doar dezactivează
          const err = (data as any)?.error ?? "failed_to_load_wishlist";
          if (mounted) setError(err);
          return;
        }

        const list = (data.entries ?? []) as WishlistEntry[];
        if (mounted) setEntries(list);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "load_error");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  // ------------------------------------------------
  // Actions
  // ------------------------------------------------
  const add = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });

      const data: WishlistApiResponse = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error((data as any)?.error ?? "add_failed");
      }

      // API-ul tău întoarce entries: [data] (row-ul inserat)
      const inserted = (data.entries?.[0] ?? null) as WishlistEntry | null;

      // fallback: dacă nu ne întoarce row-ul, reîncărcăm minimal
      if (!inserted) {
        // re-fetch wishlist
        const res2 = await fetch("/api/wishlist", { cache: "no-store" });
        const data2: WishlistApiResponse = await res2.json();
        if (res2.ok && data2.ok) {
          setEntries((data2.entries ?? []) as WishlistEntry[]);
        }
        return;
      }

      setEntries((prev) => {
        if (prev.some((e) => e.itemId === itemId)) return prev;
        return [inserted, ...prev];
      });
    } catch (e: any) {
      setError(e?.message ?? "add_error");
      alert("Nu s-a putut adăuga în wishlist.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/wishlist/${encodeURIComponent(itemId)}`, {
        method: "DELETE",
      });

      const data: WishlistApiResponse = await res.json().catch(() => ({ ok: true }));

      if (!res.ok) {
        throw new Error((data as any)?.error ?? "remove_failed");
      }

      setEntries((prev) => prev.filter((e) => e.itemId !== itemId));
    } catch (e: any) {
      setError(e?.message ?? "remove_error");
      alert("Nu s-a putut elimina din wishlist.");
    } finally {
      setSaving(false);
    }
  };

  // ------------------------------------------------
  // UI helpers
  // ------------------------------------------------
  const disabled = loading || saving;

  const title = !error
    ? isInWishlist
      ? "Este în wishlist"
      : "Adaugă în wishlist"
    : error === "not_authenticated"
    ? "Trebuie să fii logat ca să folosești wishlist"
    : "Wishlist indisponibil momentan";

  // dacă nu e logat, afișăm totuși UI discret dar dezactivat
  const locked = error === "not_authenticated";

  if (variant === "icon") {
    return (
      <button
        type="button"
        className={
          className ??
          `inline-flex items-center justify-center rounded-full border px-2 py-1 text-sm ${
            isInWishlist ? "bg-blue-50 border-blue-300" : "bg-white"
          } ${locked ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}`
        }
        title={title}
        disabled={disabled || locked}
        onClick={() => (isInWishlist ? remove() : add())}
        aria-label={isInWishlist ? labelRemove : labelAdd}
      >
        {isInWishlist ? "❤️" : "🤍"}
      </button>
    );
  }

  // variant "button"
  return (
    <div className={className ?? ""}>
      <button
        type="button"
        className={`inline-flex items-center gap-2 rounded px-3 py-2 border text-sm font-semibold ${
          isInWishlist ? "bg-blue-600 text-white border-blue-600" : "bg-white"
        } ${
          locked
            ? "opacity-50 cursor-not-allowed"
            : "hover:opacity-90 transition"
        }`}
        title={title}
        disabled={disabled || locked}
        onClick={() => (isInWishlist ? remove() : add())}
      >
        <span>{isInWishlist ? "❤️" : "🤍"}</span>
        <span>{isInWishlist ? labelRemove : labelAdd}</span>
      </button>

      {/* mic hint doar dacă e o eroare diferită */}
      {error && error !== "not_authenticated" && (
        <div className="mt-1 text-xs text-gray-500">
          Wishlist: {error}
        </div>
      )}
      {locked && (
        <div className="mt-1 text-xs text-gray-500">
          Trebuie să fii logat ca să salvezi în wishlist.
        </div>
      )}
    </div>
  );
}