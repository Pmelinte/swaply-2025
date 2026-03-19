"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import {
  Search,
  Plus,
  MapPin,
  Tag,
  MessageCircle,
  X,
  Megaphone,
  ArrowRightLeft,
} from "lucide-react";

interface WantedRequest {
  id: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  category: string;
  location?: string;
  offeredInReturn?: string;
  createdAt: string;
  responses: number;
}

export default function WantedClient() {
  const { user, items } = useAppState();
  const t = useTranslations("wanted");

  // Generate demo wanted requests from existing items' wishlists
  const wantedRequests = useMemo<WantedRequest[]>(() => {
    return items
      .filter((i) => i.wishlist && i.isActive && i.status === "active")
      .map((item) => ({
        id: `wanted-${item.id}`,
        userId: item.ownerId,
        userName: item.ownerId === user?.id ? (user.displayName || "You") : `User ${item.ownerId.slice(0, 4)}`,
        title: item.wishlist,
        description: `Looking for: ${item.wishlist}. I have "${item.title}" to offer in exchange.`,
        category: item.category,
        location: item.location,
        offeredInReturn: item.title,
        createdAt: item.createdAt,
        responses: (item.id.charCodeAt(0) + item.id.length) % 5,
      }))
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }, [items, user]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formOffer, setFormOffer] = useState("");

  const categories = useMemo(() => {
    const cats = new Set(wantedRequests.map((r) => r.category));
    return [...cats].sort();
  }, [wantedRequests]);

  const filtered = useMemo(() => {
    let result = wantedRequests;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
      );
    }
    if (categoryFilter) {
      result = result.filter((r) => r.category === categoryFilter);
    }
    return result;
  }, [wantedRequests, search, categoryFilter]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {t("title")}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t("subtitle")}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? t("cancel") : t("postRequest")}
        </button>
      </div>

      {/* Post form */}
      {showForm && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-800 dark:bg-blue-950/20">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {t("newRequestTitle")}
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder={t("whatLookingFor")}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <textarea
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              rows={3}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder={t("categoryPlaceholder")}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <input
                type="text"
                value={formOffer}
                onChange={(e) => setFormOffer(e.target.value)}
                placeholder={t("offerPlaceholder")}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <button className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
              {t("publishRequest")}
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCategoryFilter(null)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
              !categoryFilter
                ? "bg-blue-600 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300"
            }`}
          >
            {t("allCategories")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat === categoryFilter ? null : cat)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                categoryFilter === cat
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-12 dark:border-zinc-700">
            <Megaphone className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              {t("noRequests")}
            </p>
            <p className="mt-1 text-xs text-zinc-500">{t("noRequestsDesc")}</p>
          </div>
        ) : (
          filtered.map((req) => (
            <div
              key={req.id}
              className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-blue-500" />
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {req.title}
                    </h3>
                  </div>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {req.description}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-700">
                      <Tag className="h-3 w-3" />
                      {req.category}
                    </span>
                    {req.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {req.location}
                      </span>
                    )}
                    <span className="text-zinc-400">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {req.offeredInReturn && (
                    <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      <ArrowRightLeft className="h-3 w-3" />
                      {t("offers")}: {req.offeredInReturn}
                    </p>
                  )}
                </div>
                {req.userId !== user?.id && (
                  <Link
                    href="/chat"
                    className="ml-3 inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    {t("respond")}
                  </Link>
                )}
              </div>
              {req.responses > 0 && (
                <p className="mt-2 flex items-center gap-1 text-xs text-zinc-400">
                  <MessageCircle className="h-3 w-3" />
                  {t("responsesCount", { count: req.responses })}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
