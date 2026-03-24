"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { WantedRequest } from "@/lib/types";
import {
  Search,
  Plus,
  MapPin,
  Tag,
  MessageCircle,
  X,
  Megaphone,
  ArrowRightLeft,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export default function WantedClient() {
  const { user, items, loading } = useAppState();
  const t = useTranslations("wanted");

  const [requests, setRequests] = useState<WantedRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formOffer, setFormOffer] = useState("");
  const [saving, setSaving] = useState(false);
  const [justCreated, setJustCreated] = useState(false);

  // Fetch wanted requests from API
  const fetchRequests = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();
      const session = supabase ? await supabase.auth.getSession() : null;
      const token = session?.data?.session?.access_token ?? "";

      const res = await fetch("/api/wanted", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests ?? []);
      }
    } catch {
      // Fallback: generate from items
      const fallback: WantedRequest[] = items
        .filter((i) => i.wishlist && i.isActive && i.status === "active")
        .map((item) => ({
          id: `wanted-${item.id}`,
          userId: item.ownerId,
          userName: item.ownerId === user?.id ? (user.displayName || "You") : `User ${item.ownerId.slice(0, 4)}`,
          title: item.wishlist,
          description: `Looking for: ${item.wishlist}`,
          category: item.category,
          city: item.location,
          offerDescription: item.title,
          status: "active" as const,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: item.createdAt,
        }));
      setRequests(fallback);
    } finally {
      setLoadingRequests(false);
    }
  }, [items, user]);

  useEffect(() => {
    if (!loading.auth) {
      void fetchRequests();
    }
  }, [loading.auth, fetchRequests]);

  // Submit new wanted request
  const handleSubmit = async () => {
    if (!formTitle.trim() || saving) return;
    setSaving(true);
    try {
      const supabase = getSupabaseClient();
      const session = supabase ? await supabase.auth.getSession() : null;
      const token = session?.data?.session?.access_token;

      if (token) {
        const res = await fetch("/api/wanted", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: formTitle.trim(),
            description: formDesc.trim() || undefined,
            category: formCategory.trim() || undefined,
            city: formCity.trim() || undefined,
            offerDescription: formOffer.trim() || undefined,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setRequests((prev) => [
            { ...data.request, userName: user?.displayName || "You" },
            ...prev,
          ]);
          setFormTitle("");
          setFormDesc("");
          setFormCategory("");
          setFormCity("");
          setFormOffer("");
          setShowForm(false);
          setJustCreated(true);
          setTimeout(() => setJustCreated(false), 4000);
          return;
        }
      }
    } catch {
      // Silent
    } finally {
      setSaving(false);
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(requests.map((r) => r.category).filter(Boolean));
    return [...cats].sort() as string[];
  }, [requests]);

  const filtered = useMemo(() => {
    let result = requests;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.description?.toLowerCase().includes(q) ?? false) ||
          (r.category?.toLowerCase().includes(q) ?? false),
      );
    }
    if (categoryFilter) {
      result = result.filter((r) => r.category === categoryFilter);
    }
    return result;
  }, [requests, search, categoryFilter]);

  // Days remaining helper
  function daysRemaining(expiresAt: string): number {
    return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  }

  if (loading.auth || loadingRequests) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-zinc-400 dark:text-zinc-500">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-500 dark:border-zinc-600 dark:border-t-blue-400" />
      </div>
    );
  }

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
        {user && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? t("cancel") : t("postRequest")}
          </button>
        )}
      </div>

      {/* Success toast */}
      {justCreated && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-200">
          <CheckCircle2 className="h-4 w-4" />
          {t("requestPublished")}
        </div>
      )}

      {/* Post form */}
      {showForm && (
        <div className="rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/50 p-5 dark:border-blue-700 dark:bg-blue-950/20">
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
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                type="text"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder={t("categoryPlaceholder")}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <input
                type="text"
                value={formCity}
                onChange={(e) => setFormCity(e.target.value)}
                placeholder={t("cityPlaceholder")}
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
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={!formTitle.trim() || saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
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
            type="button"
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
              type="button"
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
      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-12 dark:border-zinc-700">
            <Megaphone className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              {t("noRequests")}
            </p>
            <p className="mt-1 text-xs text-zinc-500">{t("noRequestsDesc")}</p>
          </div>
        ) : (
          filtered.map((req) => {
            const days = daysRemaining(req.expiresAt);
            return (
              <div
                key={req.id}
                className="rounded-2xl border-2 border-dashed border-blue-200 bg-white/80 p-4 shadow-sm backdrop-blur transition hover:border-blue-400 hover:shadow-md dark:border-blue-800 dark:bg-zinc-900/80 dark:hover:border-blue-600"
              >
                <div className="flex items-start gap-3">
                  {/* Search icon */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40">
                    <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                      {t("searchPrefix")} {req.title}
                    </h3>

                    {req.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-400">
                        {req.description}
                      </p>
                    )}

                    {/* Offer section */}
                    {req.offerDescription && (
                      <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        <ArrowRightLeft className="h-3 w-3" />
                        {t("canOffer")}: {req.offerDescription}
                      </p>
                    )}

                    {/* Metadata */}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-zinc-500">
                      {req.category && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-700">
                          <Tag className="h-2.5 w-2.5" />
                          {req.category}
                        </span>
                      )}
                      {req.city && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5" />
                          {req.city}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {t("daysRemaining", { days })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action */}
                {req.userId !== user?.id && (
                  <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                    <Link
                      href="/chat"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      {t("proposeSwap")}
                    </Link>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
