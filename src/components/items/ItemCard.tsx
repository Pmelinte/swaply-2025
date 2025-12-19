"use client";

import Image from "next/image";
import Link from "next/link";

export type ItemCardProps = {
  item: {
    id: string;
    title: string;
    description?: string | null;
    image_url?: string | null;
    created_at?: string;
  };
};

export default function ItemCard({ item }: ItemCardProps) {
  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      {/* Imagine */}
      <div className="relative w-full h-48 bg-gray-100">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400 text-sm">
            Fără imagine
          </div>
        )}
      </div>

      {/* Conținut */}
      <div className="p-4">
        <h3 className="font-semibold text-lg">{item.title}</h3>

        {item.description && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {item.description}
          </p>
        )}

        <div className="mt-3 flex justify-end">
          <Link
            href={`/items/${item.id}/edit`}
            className="text-sm text-blue-600 hover:underline"
          >
            Edit
          </Link>
        </div>
      </div>
    </div>
  );
}
