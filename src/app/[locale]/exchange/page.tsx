export const dynamic = "force-dynamic";

import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { ArrowRight, Sparkles } from "lucide-react";
import { getLocalizedSwapStatus } from "@/i18n/public-core-copy";
import { getPublicCoreUi } from "@/i18n/public-core-ui";

type ActiveSwap = {
  id: string;
  status: string;
  createdAt: string;
  partnerName: string;
  myItemTitle: string;
  partnerItemTitle: string;
};

async function loadActiveSwaps(userId: string): Promise<ActiveSwap[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("swaps")
    .select(
      "id, status, created_at, requester_id, responder_id, offered_item_id, requested_item_id",
    )
    .or(`requester_id.eq.${userId},responder_id.eq.${userId}`)
    .not("status", "in", "(completed,cancelled)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[exchange] swaps query failed:", error);
  }

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  if (rows.length === 0) return [];

  const itemIds = new Set<string>();
  const partnerIds = new Set<string>();
  for (const row of rows) {
    const offered = row.offered_item_id as string | null;
    const requested = row.requested_item_id as string | null;
    if (offered) itemIds.add(offered);
    if (requested) itemIds.add(requested);
    const requesterId = String(row.requester_id ?? "");
    const responderId = String(row.responder_id ?? "");
    partnerIds.add(requesterId === userId ? responderId : requesterId);
  }

  const [itemsRes, profilesRes] = await Promise.all([
    itemIds.size
      ? supabase.from("items").select("id, title").in("id", [...itemIds])
      : Promise.resolve({ data: [] as Array<Record<string, unknown>>, error: null }),
    partnerIds.size
      ? supabase
          .from("public_profiles")
          .select("user_id, display_name")
          .in("user_id", [...partnerIds])
      : Promise.resolve({ data: [] as Array<Record<string, unknown>>, error: null }),
  ]);

  if ("error" in itemsRes && itemsRes.error) {
    console.error("[exchange] items lookup failed:", itemsRes.error);
  }
  if ("error" in profilesRes && profilesRes.error) {
    console.error("[exchange] profiles lookup failed:", profilesRes.error);
  }

  const itemById = new Map<string, string>();
  for (const row of (itemsRes.data ?? []) as Array<Record<string, unknown>>) {
    itemById.set(String(row.id), String(row.title ?? ""));
  }

  const nameById = new Map<string, string>();
  for (const row of (profilesRes.data ?? []) as Array<Record<string, unknown>>) {
    nameById.set(String(row.user_id), String(row.display_name ?? ""));
  }

  return rows.map((row) => {
    const requesterId = String(row.requester_id ?? "");
    const responderId = String(row.responder_id ?? "");
    const isRequester = requesterId === userId;
    const partnerId = isRequester ? responderId : requesterId;
    const myItemId = String(
      (isRequester ? row.offered_item_id : row.requested_item_id) ?? "",
    );
    const partnerItemId = String(
      (isRequester ? row.requested_item_id : row.offered_item_id) ?? "",
    );

    return {
      id: String(row.id ?? ""),
      status: String(row.status ?? ""),
      createdAt: String(row.created_at ?? ""),
      partnerName: nameById.get(partnerId) ?? partnerId.slice(0, 8),
      myItemTitle: itemById.get(myItemId) ?? "",
      partnerItemTitle: itemById.get(partnerItemId) ?? "",
    };
  });
}

function PublicExchangePreview({ locale }: { locale: string }) {
  const loginUrl = `/${locale}/login?returnTo=/${locale}/exchange`;
  const copy = getPublicCoreUi(locale);

  return (
    <div className="space-y-6">
      <h1 className="sr-only">{copy.exchangeTitle}</h1>

      <section className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-6 shadow-sm dark:border-emerald-900 dark:from-emerald-950/30 dark:via-zinc-950 dark:to-blue-950/30 md:p-8">
        <div className="max-w-3xl space-y-4">
          <p className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700 shadow-sm dark:bg-zinc-900 dark:text-emerald-200">
            {copy.preview}
          </p>
          <h2 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 md:text-5xl">
            {copy.exchangeTitle}
          </h2>
          <p className="text-base leading-7 text-zinc-600 dark:text-zinc-300 md:text-lg">
            {copy.exchangeDescription}
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={loginUrl}
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
            >
              {copy.login}
            </a>
            <a
              href={`/${locale}/messages`}
              className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-bold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              {copy.messagesTitle}
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[copy.matchingTitle, copy.messagesTitle, copy.exchangeTitle].map((label, index) => (
          <article
            key={label}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div
              aria-hidden="true"
              className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
            >
              {index + 1}
            </div>
            <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
              {label}
            </h3>
          </article>
        ))}
      </section>
    </div>
  );
}

export default async function ExchangeIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("exchange");

  const supabase = await getServerSupabase();
  let user: { id: string } | null = null;
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    user = data.user ? { id: data.user.id } : null;
  }

  if (!user) {
    return <PublicExchangePreview locale={locale} />;
  }

  const swaps = await loadActiveSwaps(user.id);

  if (swaps.length === 1) {
    redirect({ href: `/exchange/${swaps[0].id}`, locale });
  }

  if (swaps.length === 0) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-center justify-center gap-6 px-4 py-12 text-center">
        <div className="rounded-full bg-blue-100 p-5 dark:bg-blue-900/30">
          <Sparkles className="h-10 w-10 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          {t("listTitle")}
        </h1>
        <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">
          {t("listEmpty")}
        </p>
        <Link
          href="/matching"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-emerald-700"
        >
          {t("listEmptyCta")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
        {t("listTitle")}
      </h1>
      <ul className="space-y-3">
        {swaps.map((swap) => (
          <li key={swap.id}>
            <Link
              href={`/exchange/${swap.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-700"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {swap.myItemTitle || "—"} ↔ {swap.partnerItemTitle || "—"}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>{swap.partnerName}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {t("listCardStatus")}: {" "}
                    <span className="font-medium">
                      {getLocalizedSwapStatus(locale, swap.status)}
                    </span>
                  </span>
                  <span aria-hidden="true">·</span>
                  <time dateTime={swap.createdAt}>
                    {swap.createdAt
                      ? new Date(swap.createdAt).toLocaleDateString(locale)
                      : ""}
                  </time>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-zinc-400" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
