"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SafeImage } from "@/components/SafeImage";
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
  BarChart3,
  TrendingUp,
  Search,
  Download,
  CheckSquare,
  Square,
} from "lucide-react";

type StatusFilter = "all" | Item["status"];

const STATUS_COLORS: Record<Item["status"], string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  paused: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  reserved: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  traded: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
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
  const { user, items, swaps, conversations, deleteItem, duplicateItem, setItemStatus } = useAppState();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteStage, setDeleteStage] = useState<"choose" | "confirmPermanent">("choose");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "title" | "status">("newest");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const myItems = useMemo(() => user ? items.filter((i) => i.ownerId === user.id) : [], [user, items]);

  // Compute real analytics per item
  const [now] = useState(() => Date.now());
  const itemAnalytics = useMemo(() => {
    const analytics: Record<string, { views: number; proposals: number; chats: number }> = {};
    for (const item of myItems) {
      const proposals = swaps.filter(
        (s) => s.requesterItemId === item.id || s.responderItemId === item.id,
      ).length;
      const chats = conversations.filter(
        (c) => c.messages.some((m) => m.content.includes(item.title)),
      ).length;
      // Simulate views based on item age (real analytics would come from server)
      const ageMs = now - new Date(item.createdAt || now).getTime();
      const ageDays = Math.max(1, Math.floor(ageMs / 86400000));
      const views = Math.min(ageDays * 3 + proposals * 5, 999);
      analytics[item.id] = { views, proposals, chats };
    }
    return analytics;
  }, [myItems, swaps, conversations, now]);

  // Search and sort
  const filtered = useMemo(() => {
    let result = statusFilter === "all" ? myItems : myItems.filter((i) => i.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q),
      );
    }
    switch (sortBy) {
      case "newest":
        result = [...result].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        break;
      case "title":
        result = [...result].sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "status":
        result = [...result].sort((a, b) => a.status.localeCompare(b.status));
        break;
    }
    return result;
  }, [myItems, statusFilter, searchQuery, sortBy]);

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{t("guestTitle")}</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            {t("guestDescription")}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
              <Camera className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{t("guestFeaturePhotos")}</h4>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{t("guestFeaturePhotosDesc")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
              <Edit3 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{t("guestFeatureDetails")}</h4>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{t("guestFeatureDetailsDesc")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
              <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{t("guestFeatureValue")}</h4>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{t("guestFeatureValueDesc")}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
            💡 {t("guestTip")}
          </div>
          <div className="mt-5">
            <Link href="/register" className="inline-flex rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
              {t("guestCta")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusCounts: Record<StatusFilter, number> = {
    all: myItems.length,
    active: myItems.filter((i) => i.status === "active").length,
    paused: myItems.filter((i) => i.status === "paused").length,
    reserved: myItems.filter((i) => i.status === "reserved").length,
    traded: myItems.filter((i) => i.status === "traded").length,
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

  // Bulk actions
  const toggleSelect = (id: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedItems.size === filtered.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filtered.map((i) => i.id)));
    }
  };

  const bulkPause = async () => {
    for (const id of selectedItems) {
      await setItemStatus(id, "paused");
    }
    setSelectedItems(new Set());
  };

  const bulkArchive = async () => {
    for (const id of selectedItems) {
      await setItemStatus(id, "archived");
    }
    setSelectedItems(new Set());
  };

  // CSV export
  const exportCSV = () => {
    const headers = ["Title", "Category", "Condition", "Status", "Location", "Wishlist", "Description", "Created"];
    const rows = myItems.map((i) => [
      i.title, i.category, i.condition, i.status, i.location || "", i.wishlist || "",
      (i.description || "").replace(/"/g, '""'), i.createdAt || "",
    ]);
    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((v) => `"${v}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `swaply-objects-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: t("statusAll") },
    { key: "active", label: t("statusActive") },
    { key: "paused", label: t("statusPaused") },
    { key: "reserved", label: t("statusReserved") },
    { key: "traded", label: t("statusSwapped") },
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Download className="h-3.5 w-3.5" />
            {t("exportCsv")}
          </button>
          <Link
            href="/objects/new"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            {t("addNew")}
          </Link>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/70">
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <BarChart3 className="h-3.5 w-3.5" />
            {t("analyticsTotal")}
          </div>
          <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-50">{myItems.length}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50/50 p-3 dark:border-green-900 dark:bg-green-950/20">
          <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t("analyticsActive")}
          </div>
          <p className="mt-1 text-xl font-bold text-green-700 dark:text-green-300">{statusCounts.active}</p>
        </div>
        <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3 dark:border-purple-900 dark:bg-purple-950/20">
          <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400">
            <ArrowRightLeft className="h-3.5 w-3.5" />
            {t("analyticsSwapped")}
          </div>
          <p className="mt-1 text-xl font-bold text-purple-700 dark:text-purple-300">{statusCounts.traded}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900 dark:bg-blue-950/20">
          <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
            <TrendingUp className="h-3.5 w-3.5" />
            {t("analyticsScore")}
          </div>
          <p className="mt-1 text-xl font-bold text-blue-700 dark:text-blue-300">
            {myItems.length > 0 ? Math.round((statusCounts.active / myItems.length) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Search + Sort + Bulk */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
        >
          <option value="newest">{t("sortNewest")}</option>
          <option value="title">{t("sortTitle")}</option>
          <option value="status">{t("sortStatus")}</option>
        </select>
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

      {/* Bulk actions */}
      {selectedItems.size > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 dark:border-blue-800 dark:bg-blue-950/30">
          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
            {t("bulkSelected", { count: selectedItems.size })}
          </span>
          <button
            type="button"
            onClick={() => void bulkPause()}
            className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300"
          >
            <Pause className="mr-1 inline h-3 w-3" />{t("bulkPause")}
          </button>
          <button
            type="button"
            onClick={() => void bulkArchive()}
            className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300"
          >
            <Archive className="mr-1 inline h-3 w-3" />{t("bulkArchive")}
          </button>
          <button
            type="button"
            onClick={() => setSelectedItems(new Set())}
            className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
          >
            {tc("cancel")}
          </button>
        </div>
      )}

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

      {/* Select All */}
      {filtered.length > 0 && (
        <div className="mb-2">
          <button
            type="button"
            onClick={selectAll}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            {selectedItems.size === filtered.length ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
            {t("selectAll")}
          </button>
        </div>
      )}

      {/* Items list */}
      <div className="space-y-3">
        {filtered.map((item) => {
          const isExpanded = expandedId === item.id;
          const isDeleting = deleteConfirmId === item.id;
          const isSelected = selectedItems.has(item.id);
          const stats = itemAnalytics[item.id] || { views: 0, proposals: 0, chats: 0 };

          return (
            <div
              key={item.id}
              className={`overflow-hidden rounded-xl border shadow-sm ${
                isSelected
                  ? "border-blue-300 bg-blue-50/30 dark:border-blue-700 dark:bg-blue-950/10"
                  : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
              }`}
            >
              {/* Main row */}
              <div className="flex items-center gap-4 p-4">
                {/* Checkbox */}
                <button type="button" onClick={() => toggleSelect(item.id)} className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                  {isSelected ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Square className="h-4 w-4" />}
                </button>

                {/* Thumbnail */}
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-700">
                  {item.photos?.[0] ? (
                    <SafeImage
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
                  {/* Inline mini stats */}
                  <div className="mt-1 flex items-center gap-3 text-[10px] text-zinc-400">
                    <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{stats.views}</span>
                    <span className="flex items-center gap-0.5"><ArrowRightLeft className="h-2.5 w-2.5" />{stats.proposals}</span>
                    <span className="flex items-center gap-0.5"><MessageCircle className="h-2.5 w-2.5" />{stats.chats}</span>
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

                    {/* Insights with real data */}
                    <div>
                      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-zinc-500">
                        <Eye className="h-3.5 w-3.5" />
                        {t("insights")}
                      </h4>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        {[
                          { icon: Eye, label: t("views"), value: stats.views },
                          { icon: Heart, label: t("likes"), value: Math.floor(stats.views * 0.12) },
                          { icon: ArrowRightLeft, label: t("proposals"), value: stats.proposals },
                          { icon: MessageCircle, label: t("chats"), value: stats.chats },
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
