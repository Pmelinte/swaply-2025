// src/features/items/components/ItemRowActions.tsx

"use client";

import { useTransition } from "react";

export default function ItemRowActions({ itemId }: { itemId: string }) {
  const [pending, start] = useTransition();

  const onDelete = () => {
    start(async () => {
      try {
        const res = await fetch(`/api/items/${itemId}`, {
          method: "DELETE",
        });

        const data = await res.json();

        if (!res.ok || !data?.ok) {
          throw new Error(data?.error ?? "Nu am putut șterge item-ul.");
        }

        // refresh simplu fără router import (minim)
        window.location.reload();
      } catch (e: any) {
        alert(e?.message ?? "Nu am putut șterge item-ul.");
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      {/* ✅ ARCHIVE / SOFT-DELETE e nefinalizat => dezactivat elegant */}
      <button
        type="button"
        disabled
        title="Arhivarea (soft-delete) va fi disponibilă în curând."
        className="rounded-md border px-2 py-1 text-xs opacity-50 cursor-not-allowed"
      >
        Arhivează
      </button>

      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className="rounded-md border px-2 py-1 text-xs"
      >
        {pending ? "Șterge…" : "Șterge"}
      </button>
    </div>
  );
}
