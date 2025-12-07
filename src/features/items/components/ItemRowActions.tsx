"use client";

import { useTransition } from "react";
import { archiveItemAction, deleteItemAction } from "@/features/items/server/items-actions";

export default function ItemRowActions({ itemId }: { itemId: string }) {
  const [pending, start] = useTransition();

  const archive = () => {
    start(async () => {
      await archiveItemAction(itemId);
    });
  };

  const remove = () => {
    const ok = confirm("Sigur vrei să ștergi acest obiect?");
    if (!ok) return;

    start(async () => {
      await deleteItemAction(itemId);
    });
  };

  return (
    <div className="flex gap-3 text-sm">
      <a
        href={`/items/${itemId}/edit`}
        className="text-blue-600 hover:underline"
      >
        Editează
      </a>

      <button
        onClick={archive}
        disabled={pending}
        className="text-yellow-700 hover:underline disabled:opacity-50"
      >
        Arhivează
      </button>

      <button
        onClick={remove}
        disabled={pending}
        className="text-red-700 hover:underline disabled:opacity-50"
      >
        Șterge
      </button>
    </div>
  );
}
