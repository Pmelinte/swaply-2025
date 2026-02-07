import Image from "next/image";
import { Item } from "@/lib/types";
import { Pill } from "@/components/ui";
import { NO_IMAGE_URL } from "@/lib/storage";

export function ItemCard({
  item,
  onEdit,
  onDelete,
  onView,
}: {
  item: Item;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
}) {
  const statusColor = {
    active: "green",
    reserved: "amber",
    swapped: "zinc",
  } as const;

  return (
    <div className="flex gap-3 rounded-2xl border border-zinc-200 bg-white/80 p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="relative h-24 w-24 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
        <Image
          src={item.photos?.[0] || NO_IMAGE_URL}
          alt={item.title}
          fill
          className="object-cover"
          sizes="96px"
          unoptimized={!item.photos?.[0]}
        />
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase text-zinc-500">{item.category}</p>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {item.title}
            </h3>
          </div>
          <Pill color={statusColor[item.status]}>{item.status}</Pill>
        </div>
        <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">
          {item.description}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span>Locație: {item.location || "necunoscut"}</span>
          {item.aiSuggestedTags?.length ? (
            <Pill color="blue">AI: {item.aiSuggestedTags.join(", ")}</Pill>
          ) : null}
        </div>
        <div className="flex gap-2 text-xs font-semibold">
          {onView ? (
            <button
              type="button"
              onClick={onView}
              className="rounded-full bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
            >
              Vezi
            </button>
          ) : null}
          {onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="rounded-full bg-zinc-900 px-3 py-1 text-white hover:bg-zinc-800"
            >
              Editează
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-full bg-red-600 px-3 py-1 text-white hover:bg-red-700"
            >
              Șterge
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
