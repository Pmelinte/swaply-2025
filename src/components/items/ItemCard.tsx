"use client";

import Image from "next/image";
import Link from "next/link";

type ItemLike = {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  condition?: string | null;
  created_at?: string | null;
};

type Props = {
  item: ItemLike;
  className?: string;
};

function formatDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

export default function ItemCard({ item, className }: Props) {
  const hasImage = Boolean(item.image_url);

  return (
    <div
      className={[
        "w-full rounded-xl border bg-white shadow-sm overflow-hidden",
        className ?? "",
      ].join(" ")}
    >
      {/* Imagine: folosim object-contain ca să se vadă toată poza */}
      <div className="relative w-full h-48 bg-gray-100">
        {hasImage ? (
          <Image
            src={item.image_url as string}
            alt={item.title ?? "Item"}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-contain"
            priority={false}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-sm text-gray-500">
            Fără imagine
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-lg leading-tight truncate">
              {item.title}
            </h3>
            {item.description ? (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {item.description}
              </p>
            ) : null}
          </div>

          <Link
            href={`/items/${item.id}/edit`}
            className="text-xs underline text-gray-700 hover:text-black whitespace-nowrap"
          >
            Edit
          </Link>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
          {item.condition ? <span>Condiție: {item.condition}</span> : null}
          {item.created_at ? <span>Creat: {formatDate(item.created_at)}</span> : null}
        </div>
      </div>
    </div>
  );
}
