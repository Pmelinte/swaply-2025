export const dynamic = "force-dynamic";

import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { Sparkles, ArrowRight } from "lucide-react";

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
  for (const r of rows) {
    const offered = r.offered_item_id as string | null;
    const requested = r.requested_item_id as string | null;
    if (offered) itemIds.add(offered);
    if (requested) itemIds.add(requested);
    const reqId = String(r.requester_id ?? "");
    const resId = String(r.responder_id ?? "");
    partnerIds.add(reqId === userId ? resId : reqId);
  }

  const [itemsRes, profilesRes] = await Promise.all([
    itemIds.size
      ? supabase.from("items").select("id, title").in("id", [...itemIds])
      : Promise.resolve({ data: [] as Array<Record<string, unknown>>, error: null }),
    partnerIds.size
      ? supabase
          .from("profiles")
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

  return rows.map((r) => {
    const reqId = String(r.requester_id ?? "");
    const resId = String(r.responder_id ?? "");
    const isRequester = reqId === userId;
    const partnerId = isRequester ? resId : reqId;
    const myItemId = String((isRequester ? r.offered_item_id : r.requested_item_id) ?? "");
    const partnerItemId = String((isRequester ? r.requested_item_id : r.offered_item_id) ?? "");
    return {
      id: String(r.id ?? ""),
      status: String(r.status ?? ""),
      createdAt: String(r.created_at ?? ""),
      partnerName: nameById.get(partnerId) ?? partnerId.slice(0, 8),
      myItemTitle: itemById.get(myItemId) ?? "",
      partnerItemTitle: itemById.get(partnerItemId) ?? "",
    };
  });
}

const DEMO_SWAPS: ActiveSwap[] = [
  {
    id: "demo-swap-1",
    status: "active",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    partnerName: "alex",
    myItemTitle: "Vintage Leather Jacket",
    partnerItemTitle: "Mountain Bike Frame",
  },
  {
    id: "demo-swap-2",
    status: "pending",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    partnerName: "maria",
    myItemTitle: "Acoustic Guitar",
    partnerItemTitle: "DSLR Camera",
  },
];

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

  const swaps = user ? await loadActiveSwaps(user.id) : DEMO_SWAPS;

  // Auto-navigate to single active swap for authenticated users
  if (user && swaps.length === 1) {
    redirect({ href: `/exchange/${swaps[0].id}`, locale });
  }

  if (user && swaps.length === 0) {
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
      {!user && (
        <p className="rounded-xl border border-blue-200 bg-blue-50/40 px-4 py-3 text-sm text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300">
          {t("loginRequired")}
        </p>
      )}
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
                <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>{swap.partnerName}</span>
                  <span>·</span>
                  <span>
                    {t("listCardStatus")}: <span className="font-medium">{swap.status}</span>
                  </span>
                  <span>·</span>
                  <time dateTime={swap.createdAt}>
                    {swap.createdAt ? new Date(swap.createdAt).toLocaleDateString(locale) : ""}
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
