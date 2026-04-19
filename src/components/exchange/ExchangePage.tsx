"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Settings } from "lucide-react";
import { useAppState } from "@/lib/state";
import { getSupabaseClient } from "@/lib/supabase/client";
import { ExchangeSummary } from "./ExchangeSummary";
import { ExchangeServices } from "./ExchangeServices";
import { ExchangePDFGenerator } from "./ExchangePDFGenerator";
import { ExchangeConfirmation } from "./ExchangeConfirmation";
import { useDrawerStore } from "@/lib/state/drawerStore";
import { upsertService, SERVICE_DEFS } from "@/lib/exchange/exchangeServices";
import type { ServiceType, SupportService } from "@/lib/exchange/exchangeServices";
import type { ExchangeSwap } from "@/lib/exchange/exchangeQuery";
import type { SwapSummary } from "@/lib/chat/chatSummary";

interface Props {
  swapId: string;
}

export function ExchangePage({ swapId }: Props) {
  const t = useTranslations("exchangePage");
  const { user } = useAppState();

  const [swap, setSwap] = useState<ExchangeSwap | null>(null);
  const [summary, setSummary] = useState<SwapSummary | null>(null);
  const [myServices, setMyServices] = useState<SupportService[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Load swap + services ──
  useEffect(() => {
    if (!user || !swapId) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const sb = supabase;

    async function load() {
      setLoading(true);
      try {
        const { data: swapRow, error: swapError } = await sb
          .from("swaps")
          .select("*")
          .eq("id", swapId)
          .maybeSingle();

        if (swapError) {
          console.error("[exchange] swap lookup failed:", swapError);
        }
        if (!swapRow) { setLoading(false); return; }

        const row = swapRow as Record<string, unknown>;
        const requesterId = String(row.requester_id ?? "");
        const responderId = String(row.responder_id ?? "");

        const { data: profiles, error: profilesError } = await sb
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", [requesterId, responderId]);
        if (profilesError) {
          console.error("[exchange] profiles lookup failed:", profilesError);
        }

        const byId = Object.fromEntries(
          (profiles ?? []).map((p: Record<string, unknown>) => [p.user_id as string, p]),
        );

        // Fetch conversation summary separately (avoid join that fails silently)
        let swapSummary: SwapSummary | null = null;
        const conversationId = row.conversation_id as string | null;
        if (conversationId) {
          const { data: conv, error: convError } = await sb
            .from("conversations")
            .select("summary")
            .eq("id", conversationId)
            .maybeSingle();
          if (convError) {
            console.error("[exchange] conversation lookup failed:", convError);
          }
          swapSummary = (conv?.summary as SwapSummary) ?? null;
        }
        setSummary(swapSummary);

        setSwap({
          id: String(row.id ?? ""),
          requesterId,
          responderId,
          status: String(row.status ?? ""),
          exchangeData: (row.exchange_data as Record<string, unknown>) ?? {},
          pdfUrl: (row.pdf_url as string) ?? null,
          confirmedBy: (row.confirmed_by as string[]) ?? [],
          completedAt: (row.completed_at as string) ?? null,
          conversationId: (row.conversation_id as string) ?? null,
          summary: swapSummary,
          requesterName: (byId[requesterId]?.display_name as string) ?? requesterId.slice(0, 8),
          responderName: (byId[responderId]?.display_name as string) ?? responderId.slice(0, 8),
        });

        // Load my services
        const { data: services, error: servicesError } = await sb
          .from("swap_support_services")
          .select("*")
          .eq("swap_id", swapId)
          .eq("user_id", user!.id);
        if (servicesError) {
          console.error("[exchange] services lookup failed:", servicesError);
        }

        setMyServices(
          (services ?? []).map((s: Record<string, unknown>) => ({
            id: String(s.id ?? ""),
            swapId: String(s.swap_id ?? ""),
            userId: String(s.user_id ?? ""),
            serviceType: s.service_type as ServiceType,
            isBilateral: !!(s.is_bilateral),
            provider: (s.provider as string) ?? null,
            details: (s.details as Record<string, unknown>) ?? {},
            costEur: (s.cost_eur as number) ?? null,
            status: (s.status as SupportService["status"]) ?? "pending",
            createdAt: String(s.created_at ?? ""),
          })),
        );
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [swapId, user]);

  // ── Derive active service types ──
  const activeServices: ServiceType[] = myServices.map((s) => s.serviceType);

  // Services that are bilateral (agreed in chat)
  const bilateralActive: ServiceType[] = [];
  if (summary?.services.escrow) bilateralActive.push("escrow");
  if (summary?.services.insurance) bilateralActive.push("insurance");

  // All shown = my active + bilateral not yet added individually
  const shownServices: ServiceType[] = [
    ...bilateralActive.filter((k) => !activeServices.includes(k)),
    ...activeServices,
  ];

  // ── Save service details ──
  const handleSave = useCallback(async (
    type: ServiceType,
    details: Record<string, unknown>,
    cost?: number,
  ) => {
    if (!user) return;
    const isBilateral = SERVICE_DEFS.find((s) => s.key === type)?.bilateral ?? false;
    const result = await upsertService(swapId, user.id, type, details, isBilateral, cost);
    if (result) {
      setMyServices((prev) => {
        const idx = prev.findIndex((s) => s.serviceType === type);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = result;
          return next;
        }
        return [...prev, result];
      });
    }
  }, [user, swapId]);

  if (loading) {
    return <div className="p-8 text-center text-zinc-400">{t("loadingSwap")}</div>;
  }

  if (!swap) {
    return <div className="p-8 text-center text-zinc-400">{t("notFound")}</div>;
  }

  if (!user || (swap.requesterId !== user.id && swap.responderId !== user.id)) {
    return <div className="p-8 text-center text-zinc-400">{t("notParticipant")}</div>;
  }

  const myRole: "requester" | "responder" = swap.requesterId === user.id ? "requester" : "responder";
  const partnerName = myRole === "requester" ? (swap.responderName ?? "") : (swap.requesterName ?? "");

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          🔄 {t("pageTitle")}
        </h1>
        <button
          type="button"
          onClick={() => useDrawerStore.getState().openWith({ type: "exchange", swapId })}
          className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <Settings className="h-4 w-4" />
          {t("servicesTitle")}
        </button>
      </div>

      {/* Summary */}
      <ExchangeSummary swap={swap} summary={summary} myRole={myRole} />

      {/* Services */}
      <ExchangeServices
        swapId={swapId}
        activeServices={shownServices}
        onSave={handleSave}
      />

      {/* PDF */}
      <ExchangePDFGenerator swapId={swapId} />

      {/* Confirmation + Feedback */}
      <ExchangeConfirmation
        swapId={swapId}
        myUserId={user.id}
        partnerName={partnerName}
        confirmedBy={swap.confirmedBy}
        participantIds={[swap.requesterId, swap.responderId]}
      />
    </div>
  );
}
