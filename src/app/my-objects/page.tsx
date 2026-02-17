"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import type { Item } from "@/lib/types";
import {
  Plus,
  Edit3,
  Copy,
  Pause,
  Play,
  Archive,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Camera,
  ListFilter,
  Eye,
  Heart,
  MessageCircle,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  Package,
} from "lucide-react";

type StatusFilter = "all" | Item["status"];

const STATUS_COLORS: Record<Item["status"], string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  paused: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  reserved: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  swapped: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  archived: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

function HealthChecks({ item, t }: { item: Item; t: ReturnType<typeof useTranslations> }) {
  const issues: { key: string; icon: React.ReactNode }[] = [];
  if (!item.photos || item.photos.length === 0)
    issues.push({ key: "healthNoPhoto", icon: <Camera className="h-3.5 w-3.5" /> });
  if (!item.wishlist || item.wishlist.trim().length === 0)
    issues.push({ key: "healthNoWishlist", icon: <Heart className="h-3.5 w-3.5" /> });
  if (!item.location || item.location.trim().length === 0)
    issues.push({ key: "healthNoLocation", icon: <Package className="h-3.5 w-3.5" /> });
  if (item.description && item.description.length < 30)
    issues.push({ key: "healthShortDesc", icon: <Edit3 className="h-3.5 w-3.5" /> });

  if (issues.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {t("healthOk")}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {issues.map((issue) => (
        <div key={issue.key} className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
          {issue.icon}
          {t(issue.key)}
        </div>
      ))}
    </div>
  );
}

function ItemActions({
  item,
  t,
  tc,
  onEdit,
  onDuplicate,
  onStatusChange,
  onDelete,
}: {
  item: Item;
  t: ReturnType<typeof useTranslations>;
  tc: ReturnType<typeof useTranslations>;
  onEdit: () => void;
  onDuplicate: () => void;
  onStatusChange: (status: Item["status"]) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        onClick={onEdit}
        className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
      >
        <Edit3 className="h-3 w-3" />
        {tc("edit")}
      </button>
      <button
        onClick={onDuplicate}
        className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
      >
        <Copy className="h-3 w-3" />
        {t("duplicate")}
      </button>
      {item.status === "active" && (
        <button
          onClick={() => onStatusChange("paused")}
          className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/40"
        >
          <Pause className="h-3 w-3" />
          {t("pause")}
        </button>
      )}
      {item.status === "paused" && (
        <button
          onClick={() => onStatusChange("active")}
          className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/40"
        >
          <Play className="h-3 w-3" />
          {t("resume")}
        </button>
      )}
      {(item.status === "active" || item.status === "paused") && (
        <button
          onClick={() => onStatusChange("archived")}
          className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-600"
        >
          <Archive className="h-3 w-3" />
          {t("archive")}
        </button>
      )}
      {item.status === "archived" && (
        <button
          onClick={() => onStatusChange("active")}
          className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/40"
        >
          <Play className="h-3 w-3" />
          {t("resume")}
        </button>
      )}
      <button
        onClick={onDelete}
        className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
      >
        <Trash2 className="h-3 w-3" />
        {tc("delete")}
      </button>
    </div>
  );
}

export default function MyObjectsPage() {
  const t = useTranslations("myObjects");
  const tc = useTranslations("common");
  const router = useRouter();
  const { user, items, deleteItem, duplicateItem, setItemStatus } = useAppState();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteStage, setDeleteStage] = useState<"choose" | "confirmPermanent">("choose");

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Link href="/login" className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700">
          Login
        </Link>
      </div>
    );
  }

  const myItems = items.filter((i) => i.ownerId === user.id);
  const filtered = statusFilter === "all" ? myItems : myItems.filter((i) => i.status === statusFilter);

  const statusCounts: Record<StatusFilter, number> = {
    all: myItems.length,
    active: myItems.filter((i) => i.status === "active").length,
    paused: myItems.filter((i) => i.status === "paused").length,
    reserved: myItems.filter((i) => i.status === "reserved").length,
    swapped: myItems.filter((i) => i.status === "swapped").length,
    archived: myItems.filter((i) => i.status === "archived").length,
  };

  const handleDelete = async (id: string) => {
    await deleteItem(id);
    setDeleteConfirmId(null);
    setDeleteStage("choose");
  };

  const handleArchive = async (id: string) => {
    await setItemStatus(id, "archived");
    setDeleteConfirmId(null);
    setDeleteStage("choose");
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
    setDeleteStage("choose");
  };

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: t("statusAll") },
    { key: "active", label: t("statusActive") },
    { key: "paused", label: t("statusPaused") },
    { key: "reserved", label: t("statusReserved") },
    { key: "swapped", label: t("statusSwapped") },
    { key: "archived", label: t("statusArchived") },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{t("title")}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("subtitle")}</p>
        </div>
        <Link
          href="/objects/new"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          {t("addNew")}
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        <ListFilter className="mr-1 mt-1 h-4 w-4 text-zinc-400" />
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              statusFilter === f.key
                ? "bg-blue-600 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {f.label}
            {statusCounts[f.key] > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-white/20 px-1 text-[10px]">
                {statusCounts[f.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-16 dark:border-zinc-700">
          <Package className="mb-4 h-12 w-12 text-zinc-300 dark:text-zinc-600" />
          <p className="mb-4 text-zinc-500 dark:text-zinc-400">{t("empty")}</p>
          <Link
            href="/objects/new"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            {t("emptyCta")}
          </Link>
        </div>
      )}

      {/* Items list */}
      <div className="space-y-3">
        {filtered.map((item) => {
          const isExpanded = expandedId === item.id;
          const isDeleting = deleteConfirmId === item.id;

          return (
            <div
              key={item.id}
              className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
            >
              {/* Main row */}
              <div className="flex items-center gap-4 p-4">
                {/* Thumbnail */}
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-700">
                  {item.photos?.[0] ? (
                    <Image
                      src={item.photos[0]}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-zinc-400">
                      <Camera className="h-6 w-6" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/objects/${item.id}`}
                      className="truncate font-semibold text-zinc-900 hover:text-blue-600 dark:text-zinc-50 dark:hover:text-blue-400"
                    >
                      {item.title}
                    </Link>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_COLORS[item.status]}`}>
                      {t(`status${item.status.charAt(0).toUpperCase() + item.status.slice(1)}` as Parameters<typeof t>[0])}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>{item.category}</span>
                    <span>{item.condition}</span>
                    {item.location && <span>{item.location}</span>}
                  </div>
                </div>

                {/* Health indicator */}
                <div className="hidden shrink-0 sm:block">
                  {(!item.photos || item.photos.length === 0 || !item.wishlist || !item.location) ? (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                </div>

                {/* Expand button */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="shrink-0 rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>

              {/* Expanded section */}
              {isExpanded && (
                <div className="border-t border-zinc-100 bg-zinc-50/50 px-4 py-4 dark:border-zinc-700 dark:bg-zinc-800/50">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Health checks */}
                    <div>
                      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-zinc-500">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {t("health")}
                      </h4>
                      <HealthChecks item={item} t={t} />
                    </div>

                    {/* Insights (placeholder — will be real later) */}
                    <div>
                      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-zinc-500">
                        <Eye className="h-3.5 w-3.5" />
                        {t("insights")}
                      </h4>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        {[
                          { icon: Eye, label: t("views"), value: "—" },
                          { icon: Heart, label: t("likes"), value: "—" },
                          { icon: ArrowRightLeft, label: t("proposals"), value: "—" },
                          { icon: MessageCircle, label: t("chats"), value: "—" },
                        ].map(({ icon: Icon, label, value }) => (
                          <div key={label} className="rounded-lg bg-white p-2 dark:bg-zinc-700">
                            <Icon className="mx-auto mb-1 h-3.5 w-3.5 text-zinc-400" />
                            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{value}</div>
                            <div className="text-[10px] text-zinc-400">{label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4">
                    {isDeleting && deleteStage === "confirmPermanent" ? (
                      <div className="flex items-center gap-3 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                        <p className="flex-1 text-xs text-red-700 dark:text-red-300">{t("confirmDelete")}</p>
                        <button
                          onClick={() => void handleDelete(item.id)}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          {tc("delete")}
                        </button>
                        <button
                          onClick={cancelDelete}
                          className="rounded-lg bg-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-600 dark:text-zinc-200"
                        >
                          {tc("cancel")}
                        </button>
                      </div>
                    ) : isDeleting && deleteStage === "choose" ? (
                      <div className="space-y-2 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                        <p className="text-xs text-amber-700 dark:text-amber-300">{t("confirmArchive")}</p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => void handleArchive(item.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                          >
                            <Archive className="h-3 w-3" />
                            {t("softDelete")}
                          </button>
                          <button
                            onClick={() => setDeleteStage("confirmPermanent")}
                            className="rounded-lg bg-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-300 dark:bg-zinc-600 dark:text-zinc-400"
                          >
                            {t("permanentDelete")}
                          </button>
                          <button
                            onClick={cancelDelete}
                            className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-400"
                          >
                            {tc("cancel")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <ItemActions
                        item={item}
                        t={t}
                        tc={tc}
                        onEdit={() => router.push(`/objects/${item.id}/edit`)}
                        onDuplicate={() => void duplicateItem(item.id)}
                        onStatusChange={(status) => void setItemStatus(item.id, status)}
                        onDelete={() => setDeleteConfirmId(item.id)}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
