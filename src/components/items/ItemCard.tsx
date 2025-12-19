// src/components/items/ItemCard.tsx

import Link from "next/link";

type ItemLike = {
  id?: string;
  title?: string | null;
  name?: string | null;
  description?: string | null;

  // Canonical (nou)
  image_url?: string | null;

  // Compat (vechi / refactor)
  imageUrl?: string | null;
  image?: string | null;
  photo_url?: string | null;
  imagePath?: string | null;
  image_path?: string | null;

  created_at?: string | null;
  createdAt?: string | null;

  owner_id?: string | null;
  user_id?: string | null;

  // allow any other fields without TS pain
  [key: string]: any;
};

type Props = {
  item: ItemLike;
  className?: string;
};

function pickImageUrl(item: ItemLike): string | null {
  const candidates = [
    item.image_url,
    item.imageUrl,
    item.image,
    item.photo_url,
    item.imagePath,
    item.image_path,
  ];

  for (const c of candidates) {
    if (typeof c === "string" && c.trim().length > 0) return c.trim();
  }
  return null;
}

function formatCreatedAt(item: ItemLike): string | null {
  const raw = item.created_at ?? item.createdAt;
  if (!raw || typeof raw !== "string") return null;

  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;

  // Format simplu, fără locale complications
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

export default function ItemCard({ item, className }: Props) {
  const title = (item.title ?? item.name ?? "Item").toString();
  const subtitle =
    typeof item.description === "string" && item.description.trim().length > 0
      ? item.description.trim()
      : null;

  const imageUrl = pickImageUrl(item);
  const created = formatCreatedAt(item);

  const id = item.id ? String(item.id) : null;
  const editHref = id ? `/items/${id}/edit` : null;

  return (
    <div
      className={[
        "rounded-2xl border bg-white shadow-sm overflow-hidden",
        className ?? "",
      ].join(" ")}
    >
      {/* Imagine */}
      <div className="w-full aspect-[16/5] bg-gray-100">
        {imageUrl ? (
          // Folosim <img> ca să evităm blocajele Next/Image pe domenii externe.
          // (Putem reveni la next/image după ce stabilizăm.)
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              // Dacă URL-ul e invalid / blocat, ascundem imaginea și rămâne bg-ul gri
              const target = e.currentTarget;
              target.style.display = "none";
            }}
          />
        ) : null}
      </div>

      {/* Conținut */}
      <div className="p-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="font-semibold text-sm text-gray-900 truncate">
            {title}
          </div>

          {subtitle ? (
            <div className="text-xs text-gray-600 mt-1 truncate">{subtitle}</div>
          ) : null}

          {created ? (
            <div className="text-[10px] text-gray-400 mt-2">
              Created: {created}
            </div>
          ) : null}

          {/* Debug mic (îl poți șterge când e ok) */}
          {/* <div className="text-[10px] text-gray-400 mt-1">image_url: {String(item.image_url ?? "")}</div> */}
        </div>

        <div className="shrink-0">
          {editHref ? (
            <Link
              href={editHref}
              className="text-xs text-gray-500 hover:text-gray-900 underline"
            >
              Edit
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
