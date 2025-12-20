"use client";

import Link from "next/link";

export type ItemCardItem = {
  id: string;
  title: string | null;
  description?: string | null;
  image_url?: string | null;
  created_at?: string | null;
};

type Props = {
  item: ItemCardItem;
  editHref?: string;
};

export default function ItemCard({ item, editHref }: Props) {
  const title = (item.title ?? "").trim() || "Fără titlu";
  const subtitle = (item.description ?? "").trim();
  const href = editHref ?? `/items/${item.id}/edit`;

  return (
    <div className="w-full overflow-hidden rounded-xl border bg-white shadow-sm">
      {/* Imagine: wrapper flex + max sizes => NU mai taie din imagine */}
      <div className="flex h-56 w-full items-center justify-center bg-gray-50 p-3">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={title}
            className="max-h-full max-w-full object-contain"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="text-sm text-gray-400">Fără imagine</div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-gray-900">
              {title}
            </h3>

            {subtitle ? (
              <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                {subtitle}
              </p>
            ) : null}

            {item.created_at ? (
              <p className="mt-2 text-xs text-gray-400">
                Created: {item.created_at}
              </p>
            ) : null}
          </div>

          <Link
            href={href}
            className="shrink-0 text-xs text-gray-500 underline hover:text-gray-900"
          >
            Edit
          </Link>
        </div>
      </div>
    </div>
  );
}
