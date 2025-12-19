"use client";

import Image from "next/image";
import Link from "next/link";

type ItemCardProps = {
  id: string;
  title?: string | null;
  image_url?: string | null;
  condition?: string | null;
  created_at?: string | null;
};

export default function ItemCard({
  id,
  title,
  image_url,
  condition
}: ItemCardProps) {
  return (
    <Link
      href={`/items/${id}`}
      className="block rounded-lg border p-3 hover:bg-black/5 transition"
    >
      <div className="flex gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-black/5">
          {image_url ? (
            <Image
              src={image_url}
              alt={title ?? "Item"}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xs opacity-60">
              no image
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="font-medium truncate">{title ?? "Untitled"}</div>
          {condition ? (
            <div className="text-xs opacity-70 mt-1">{condition}</div>
          ) : (
            <div className="text-xs opacity-50 mt-1">—</div>
          )}
        </div>
      </div>
    </Link>
  );
}
