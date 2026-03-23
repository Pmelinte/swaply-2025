"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { getSupabaseClient } from "@/lib/supabase/client";
import { AdminGuard } from "@/features/admin/AdminShell";
import { useAdminActions } from "@/features/admin/useAdminActions";
import {
  Package,
  Search,
  Eye,
  EyeOff,
  Trash2,
  Beaker,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface AdminItem {
  id: string;
  owner_id: string;
  title: string;
  category: string;
  condition: string;
  status: string;
  is_active: boolean;
  is_demo: boolean;
  location: string;
  image_url: string | null;
  created_at: string;
}

type StatusFilter = "all" | "active" | "paused" | "reserved" | "traded" | "archived";
type DemoFilter = "all" | "real" | "demo";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  paused: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  reserved: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  traded: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  archived: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

function ItemsContent() {
  const t = useTranslations("admin");
  const [items, setItems] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [demoFilter, setDemoFilter] = useState<DemoFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const PAGE_SIZE = 50;

  const { toggleItemActive, deleteItem, toggleItemDemo } = useAdminActions();

  const fetchItems = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    setLoading(true);

    let query = supabase
      .from("items")
      .select(
        "id, owner_id, title, category, condition, status, is_active, is_demo, location, image_url, created_at",
      )
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }
    if (demoFilter === "demo") {
      query = query.eq("is_demo", true);
    } else if (demoFilter === "real") {
      query = query.eq("is_demo", false);
    }
    if (searchQuery.trim()) {
      query = query.ilike("title", `%${searchQuery.trim()}%`);
    }

    const { data } = await query;
    setItems((data as AdminItem[]) ?? []);
    setLoading(false);
  }, [statusFilter, demoFilter, searchQuery, page]);

  useEffect(() => {
    const t = setTimeout(() => fetchItems(), 0);
    return () => clearTimeout(t);
  }, [fetchItems]);

  const handleToggleActive = useCallback(
    async (itemId: string, currentActive: boolean) => {
      setActionLoading(itemId);
      const result = await toggleItemActive(itemId, !currentActive);
      if (result.error) {
        alert(`${t("error")}: ${result.error}`);
      } else {
        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  is_active: !currentActive,
                  status: !currentActive ? "active" : "archived",
                }
              : item,
          ),
        );
      }
      setActionLoading(null);
    },
    [toggleItemActive, t],
  );

  const handleDelete = useCallback(
    async (itemId: string) => {
      if (!confirm(t("archiveConfirm"))) return;
      setActionLoading(itemId);
      const result = await deleteItem(itemId);
      if (result.error) {
        alert(`${t("error")}: ${result.error}`);
      } else {
        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? { ...item, is_active: false, status: "archived" }
              : item,
          ),
        );
      }
      setActionLoading(null);
    },
    [deleteItem, t],
  );

  const handleToggleDemo = useCallback(
    async (itemId: string, currentDemo: boolean) => {
      setActionLoading(itemId);
      const result = await toggleItemDemo(itemId, !currentDemo);
      if (result.error) {
        alert(`${t("error")}: ${result.error}`);
      } else {
        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId ? { ...item, is_demo: !currentDemo } : item,
          ),
        );
      }
      setActionLoading(null);
    },
    [toggleItemDemo, t],
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        <Package className="mb-0.5 mr-2 inline h-5 w-5" />
        {t("items")}
      </h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            placeholder={t("searchByTitle")}
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as StatusFilter);
            setPage(0);
          }}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="all">{t("allStatusFilter")}</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="reserved">Reserved</option>
          <option value="traded">Traded</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={demoFilter}
          onChange={(e) => {
            setDemoFilter(e.target.value as DemoFilter);
            setPage(0);
          }}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="all">{t("allFilter")}</option>
          <option value="real">{t("realFilter")}</option>
          <option value="demo">{t("demoFilter")}</option>
        </select>
      </div>

      {/* Items list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <Package className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-600" />
          <p className="mt-2 text-sm text-zinc-500">
            {t("noItems")}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left dark:border-zinc-700 dark:bg-zinc-800/50">
                  <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                    {t("tableTitle")}
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                    {t("tableCategory")}
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                    {t("tableStatus")}
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                    {t("tableDemo")}
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                    {t("tableDate")}
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400">
                    {t("tableActions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {items.map((item) => {
                  const isLoading = actionLoading === item.id;
                  return (
                    <tr
                      key={item.id}
                      className="bg-white dark:bg-zinc-900"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt=""
                              className="h-8 w-8 rounded object-cover"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                              {item.title}
                            </p>
                            <p className="font-mono text-[10px] text-zinc-400">
                              {item.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        {item.category}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[item.status] ?? ""}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {item.is_demo && (
                          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                            DEMO
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        {new Date(item.created_at).toLocaleDateString(
                          "ro-RO",
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() =>
                              handleToggleActive(item.id, item.is_active)
                            }
                            className={`rounded-lg border p-1.5 disabled:opacity-50 ${
                              item.is_active
                                ? "border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800"
                                : "border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800"
                            }`}
                            title={
                              item.is_active ? t("deactivate") : t("activate")
                            }
                          >
                            {item.is_active ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() =>
                              handleToggleDemo(item.id, item.is_demo)
                            }
                            className="rounded-lg border border-purple-200 p-1.5 text-purple-600 hover:bg-purple-50 disabled:opacity-50 dark:border-purple-800"
                            title={
                              item.is_demo
                                ? t("markReal")
                                : t("markDemo")
                            }
                          >
                            <Beaker className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleDelete(item.id)}
                            className="rounded-lg border border-red-200 p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800"
                            title={t("archive")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              {t("page")} {page + 1} · {items.length} {t("results")}
            </p>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-zinc-200 p-2 text-zinc-500 hover:bg-zinc-50 disabled:opacity-30 dark:border-zinc-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={items.length < PAGE_SIZE}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-zinc-200 p-2 text-zinc-500 hover:bg-zinc-50 disabled:opacity-30 dark:border-zinc-700"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminItemsPage() {
  const { user } = useAppState();

  return (
    <AdminGuard user={user}>
      <ItemsContent />
    </AdminGuard>
  );
}
