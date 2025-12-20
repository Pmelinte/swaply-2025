// src/features/wishlist/components/WishlistToggleButton.tsx

"use client";

import { useState } from "react";
import { useWishlist } from "@/features/wishlist/hooks/use-wishlist";

interface WishlistToggleButtonProps {
  itemId: string;
  entryId?: string;
  initialInWishlist?: boolean;
  size?: "sm" | "md";
}

export default function WishlistToggleButton({
  itemId,
  entryId,
  initialInWishlist = false,
  size = "md",
}: WishlistToggleButtonProps) {
  const { add, remove } = useWishlist();
  const [inWishlist, setInWishlist] = useState(initialInWishlist);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (loading) return;
    setLoading(true);

    try {
      if (inWishlist) {
        if (!entryId) {
          throw new Error("missing_entry_id");
        }
        await remove(entryId);
        setInWishlist(false);
      } else {
        await add({});
        setInWishlist(true);
      }
    } catch (err) {
      alert("Nu s-a putut actualiza wishlist-ul.");
    } finally {
      setLoading(false);
    }
  };

  const classes =
    size === "sm"
      ? "text-xs px-2 py-1"
      : "text-sm px-3 py-2";

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`rounded border transition ${
        inWishlist
          ? "bg-red-50 border-red-400 text-red-600 hover:bg-red-100"
          : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
      } ${classes}`}
      title={inWishlist ? "Elimină din wishlist" : "Adaugă în wishlist"}
    >
      {inWishlist ? "❤️ Salvat" : "🤍 Wishlist"}
    </button>
  );
}
