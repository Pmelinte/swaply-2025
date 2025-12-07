// src/features/items/components/my-items-list.tsx

"use client";

import Image from "next/image";
import Link from "next/link";
import { archiveItemAction } from "../../items/server/items-actions";

interface MyItemsListProps {
  items: Array<{
    id: string;
    title: string;
    category: string;
    status: string;
    images: { url: string; isPrimary?: boolean }[];
  }>;
}

export function MyItemsList({ items }: MyItemsListProps) {
  const handleArchive = async (id: string) => {
    const ok = confirm("Sigur vrei să arhivezi acest obiect?");
    if (!ok) return;

    try {
      await archiveItemAction(id);
      window.location.reload();
    } catch (err: any) {
      alert("Eroare la arhivare.");
    }
  };

  if (items.length === 0) {
    return (
      <p className="text-center text-gray-500 mt-10">
        Nu ai încă obiecte adăugate.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5">
      {items.map((item) => {
        const primary =
          item.images.find((img) => img.isPrimary) ?? item.images[0];

        return (
          <div
            key={item.id}
            className="border rounded-lg p-4 flex gap-4 items-start"
          >
            {/* Imagine */}
            <div className="w-32 h-32 relative overflow-hidden rounded">
              {primary ? (
                <Image
                  src={primary.url}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="bg-gray-200 w-full h-full"></div>
              )}
            </div>

            {/* Detalii */}
            <div className="flex-1 space-y-1">
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <p className="text-gray-600">{item.category}</p>
              <p className="text-sm text-gray-500">Status: {item.status}</p>

              <div className="flex gap-3 mt-3">
                <Link
                  href={`/items/${item.id}/edit`}
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                >
                  Editează
                </Link>

                <button
                  onClick={() => handleArchive(item.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded"
                >
                  Arhivează
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
