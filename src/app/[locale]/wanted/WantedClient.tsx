"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { WantedRequest } from "@/lib/types";
import {
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Megaphone,
  MessageCircle,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";

type WantedStatus = "active" | "fulfilled" | "expired" | "cancelled";

type SessionContext = {
  accessToken: string | null;
  userId: string | null;
};

async function getSessionContext(): Promise<SessionContext> {
  const supabase = getSupabaseClient();
  if (!supabase) return { accessToken: null, userId: null };

  const { data } = await supabase.auth.getSession();
  return {
    accessToken: data.session?.access_token ?? null,
    userId: data.session?.user.id ?? null,
  };
}

export default function WantedClient() {
  const { user, items } = useAppState();
  const t = useTranslations("wanted");
  const tc = useTranslations("common");

  const [requests, setRequests] = useState<WantedRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showMine, setShowMine] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formOffer, setFormOffer] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<"success" | "error" | null>(null);

  const authenticatedUserId = user?.id ?? sessionUserId;

  const resetForm = useCallback(() => {
    setEditingId(null);
    setFormTitle("");
    setFormDesc("");
    setFormCategory("");
    setFormCity("");
    setFormOffer("");
    setShowForm(false);
  }, []);

  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
    setNotice(null);

    try {
      const session = await getSessionContext();
      setSessionUserId(session.userId);

      const res = await fetch(`/api/wanted${showMine ? "?mine=true" : ""}`, {
        headers: session.accessToken
          ? { Authorization: `Bearer ${session.accessToken}` }
          : {},
      });

      if (!res.ok) throw new Error("wanted_fetch_failed");

      const data = (await res.json()) as { requests?: WantedRequest[] };
      setRequests(data.requests ?? []);
    } catch {
      if (!showMine) {
        const fallback: WantedRequest[] = items
          .filter((item) => item.wishlist && item.isActive && item.status === "active")
          .map((item) => ({
            id: `wanted-${item.id}`,
            userId: item.ownerId,
            userName:
              item.ownerId === authenticatedUserId
                ? user?.displayName || t("you")
                : `${t("userPrefix")} ${item.ownerId.slice(0, 4)}`,
            title: item.wishlist,
            description: `${t("lookingFor")}: ${item.wishlist}`,
            category: item.category,
            city: item.location,
            offerDescription: item.title,
            status: "active",
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: item.createdAt,
          }));
        setRequests(fallback);
      } else {
        setRequests([]);
        setNotice("error");
      }
    } finally {
      setLoadingRequests(false);
    }
  }, [authenticatedUserId, items, showMine, t, user?.displayName]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const handleSubmit = async () => {
    if (!formTitle.trim() || saving) return;

    setSaving(true);
    setNotice(null);

    try {
      const session = await getSessionContext();
      if (!session.accessToken || !session.userId) throw new Error("unauthorized");
      setSessionUserId(session.userId);

      const endpoint = editingId ? `/api/wanted/${editingId}` : "/api/wanted";
      const res = await fetch(endpoint, {
        method: editingId ? "PATCH" : "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDesc.trim() || null,
          category: formCategory.trim() || null,
          city: formCity.trim() || null,
          offerDescription: formOffer.trim() || null,
        }),
      });

      if (!res.ok) throw new Error("wanted_save_failed");

      const data = (await res.json()) as { request: WantedRequest };
      setRequests((prev) => {
        const withName = {
          ...data.request,
          userName: data.request.userName || user?.displayName || t("you"),
        };

        return editingId
          ? prev.map((request) => (request.id === editingId ? withName : request))
          : [withName, ...prev];
      });

      resetForm();
      setNotice("success");
    } catch {
      setNotice("error");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (request: WantedRequest) => {
    setEditingId(request.id);
    setFormTitle(request.title);
    setFormDesc(request.description ?? "");
    setFormCategory(request.category ?? "");
    setFormCity(request.city ?? "");
    setFormOffer(request.offerDescription ?? "");
    setShowForm(true);
    setNotice(null);
  };

  const mutateRequest = async (
    requestId: string,
    action: "fulfilled" | "cancelled" | "active" | "delete",
  ) => {
    if (pendingId) return;

    setPendingId(requestId);
    setNotice(null);

    try {
      const session = await getSessionContext();
      if (!session.accessToken || !session.userId) throw new Error("unauthorized");
      setSessionUserId(session.userId);

      const res = await fetch(`/api/wanted/${requestId}`, {
        method: action === "delete" ? "DELETE" : "PATCH",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          ...(action === "delete" ? {} : { "Content-Type": "application/json" }),
        },
        body:
          action === "delete"
            ? undefined
            : JSON.stringify({ status: action, renew: action === "active" }),
      });

      if (!res.ok) throw new Error("wanted_mutation_failed");

      if (action === "delete") {
        setRequests((prev) => prev.filter((request) => request.id !== requestId));
      } else {
        const data = (await res.json()) as { request: WantedRequest };
        setRequests((prev) =>
          prev.map((request) =>
            request.id === requestId ? { ...request, ...data.request } : request,
          ),
        );
      }

      setNotice("success");
    } catch {
      setNotice("error");
    } finally {
      setPendingId(null);
    }
  };

  const categories = useMemo(() => {
    return [...new Set(requests.map((request) => request.category).filter(Boolean))].sort() as string[];
  }, [requests]);

  const filtered = useMemo(() => {
    let result = requests;

    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        (request) =>
          request.title.toLowerCase().includes(query) ||
          request.description?.toLowerCase().includes(query) ||
          request.category?.toLowerCase().includes(query),
      );
    }

    if (categoryFilter) {
      result = result.filter((request) => request.category === categoryFilter);
    }

    return result;
  }, [categoryFilter, requests, search]);

  const daysRemaining = (expiresAt: string): number =>
    Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000));

  if (loadingRequests) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-zinc-400 dark:text-zinc-500">
        <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{t("title")}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("subtitle")}</p>
        </div>

        {authenticatedUserId && (
          <button
            type="button"
            onClick={() => {
              if (showForm) resetForm();
              else setShowForm(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? t("cancel") : t("postRequest")}
          </button>
        )}
      </div>

      {notice && (
        <div
          role={notice === "error" ? "alert" : "status"}
          className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
            notice === "error"
              ? "bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-200"
              : "bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-200"
          }`}
        >
          {notice === "error" ? (
            <X className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          {notice === "error" ? tc("errorOccurred") : tc("success")}
        </div>
      )}

      {authenticatedUserId && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowMine(false)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              !showMine
                ? "bg-blue-600 text-white"
                : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            }`}
          >
            {t("allCategories")}
          </button>
          <button
            type="button"
            onClick={() => setShowMine(true)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              showMine
                ? "bg-blue-600 text-white"
                : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            }`}
          >
            {t("you")}
          </button>
        </div>
      )}

      {showForm && (
        <div className="rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/50 p-5 dark:border-blue-700 dark:bg-blue-950/20">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {editingId ? tc("edit") : t("newRequestTitle")}
          </h2>
          <div className="space-y-3">
            <input
              type="text"
              value={formTitle}
              onChange={(event) => setFormTitle(event.target.value)}
              placeholder={t("whatLookingFor")}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <textarea
              value={formDesc}
              onChange={(event) => setFormDesc(event.target.value)}
              placeholder={t("descriptionPlaceholder")}
              rows={3}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                type="text"
                value={formCategory}
                onChange={(event) => setFormCategory(event.target.value)}
                placeholder={t("categoryPlaceholder")}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <input
                type="text"
                value={formCity}
                onChange={(event) => setFormCity(event.target.value)}
                placeholder={t("cityPlaceholder")}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <input
                type="text"
                value={formOffer}
                onChange={(event) => setFormOffer(event.target.value)}
                placeholder={t("offerPlaceholder")}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={!formTitle.trim() || saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {editingId ? tc("save") : t("publishRequest")}
            </button>
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCategoryFilter(null)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              !categoryFilter
                ? "bg-blue-600 text-white"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
            }`}
          >
            {t("allCategories")}
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setCategoryFilter(category === categoryFilter ? null : category)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                categoryFilter === category
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

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
          filtered.map((request) => {
            const owner = request.userId === authenticatedUserId;
            const pending = pendingId === request.id;
            const status = request.status as WantedStatus;

            return (
              <article
                key={request.id}
                data-testid={`wanted-request-${request.id}`}
                className="rounded-2xl border-2 border-dashed border-blue-200 bg-white/80 p-4 shadow-sm dark:border-blue-800 dark:bg-zinc-900/80"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40">
                    <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                        {t("searchPrefix")} {request.title}
                      </h3>
                      {owner && (
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                          {status}
                        </span>
                      )}
                    </div>
                    {request.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-400">
                        {request.description}
                      </p>
                    )}
                    {request.offerDescription && (
                      <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        <ArrowRightLeft className="h-3 w-3" />
                        {t("canOffer")}: {request.offerDescription}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-zinc-500">
                      {request.category && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-700">
                          <Tag className="h-2.5 w-2.5" />
                          {request.category}
                        </span>
                      )}
                      {request.city && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5" />
                          {request.city}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {t("daysRemaining", { days: daysRemaining(request.expiresAt) })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  {!owner && status === "active" && (
                    <Link
                      href="/chat"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      {t("proposeSwap")}
                    </Link>
                  )}

                  {owner && (
                    <>
                      <button
                        type="button"
                        onClick={() => startEdit(request)}
                        disabled={pending}
                        aria-label={tc("edit")}
                        className="rounded-lg border border-zinc-200 p-2 text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>

                      {status === "active" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void mutateRequest(request.id, "fulfilled")}
                            disabled={pending}
                            aria-label={tc("success")}
                            className="rounded-lg border border-green-200 p-2 text-green-700 hover:bg-green-50 disabled:opacity-50 dark:border-green-900 dark:text-green-300 dark:hover:bg-green-950/30"
                          >
                            {pending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => void mutateRequest(request.id, "cancelled")}
                            disabled={pending}
                            aria-label={tc("cancel")}
                            className="rounded-lg border border-amber-200 p-2 text-amber-700 hover:bg-amber-50 disabled:opacity-50 dark:border-amber-900 dark:text-amber-300 dark:hover:bg-amber-950/30"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void mutateRequest(request.id, "active")}
                          disabled={pending}
                          aria-label={tc("retry")}
                          className="rounded-lg border border-blue-200 p-2 text-blue-700 hover:bg-blue-50 disabled:opacity-50 dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-950/30"
                        >
                          {pending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => void mutateRequest(request.id, "delete")}
                        disabled={pending}
                        aria-label={tc("delete")}
                        className="rounded-lg border border-red-200 p-2 text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
