"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Settings } from "lucide-react";
import { useAppState } from "@/lib/state";
import { getSupabaseClient } from "@/lib/supabase/client";
import { ExchangeSummary } from "./ExchangeSummary";
import { ExchangeServices } from "./ExchangeServices";
import { ExchangeLogisticsPanel } from "./ExchangeLogisticsPanel";
import { ExchangePDFGenerator } from "./ExchangePDFGenerator";
import { ExchangeConfirmation } from "./ExchangeConfirmation";
import { ExchangeDrawer } from "./ExchangeDrawer";
import {
  upsertService,
  removeService,
  SERVICE_DEFS,
} from "@/lib/exchange/exchangeServices";
import type {
  ServiceType,
  SupportService,
} from "@/lib/exchange/exchangeServices";
import type { ExchangeSwap } from "@/lib/exchange/exchangeQuery";
import type { SwapSummary } from "@/lib/chat/chatSummary";

interface Props {
  swapId: string;
}

const DEMO_SUMMARY: SwapSummary = {
  generatedAt: new Date().toISOString(),
  swapTitle: "Vintage Leather Jacket ↔ Mountain Bike Frame",
  itemA: { id: "a", title: "Vintage Leather Jacket", owner: "you" },
  itemB: { id: "b", title: "Mountain Bike Frame", owner: "alex" },
  agreedItems: ["exchange_mode", "location", "escrow"],
  pendingItems: [],
  services: { escrow: true, insurance: false },
  logistics: {
    exchangeMode: true,
    location: true,
    inPerson: false,
    deliveryAddresses: true,
  },
  approvedBy: [],
};

const DEMO_SWAP: ExchangeSwap = {
  id: "demo-swap",
  requesterId: "demo-you",
  responderId: "demo-partner",
  status: "active",
  exchangeData: {},
  pdfUrl: null,
  confirmedBy: [],
  completedAt: null,
  conversationId: null,
  summary: DEMO_SUMMARY,
  requesterName: "you",
  responderName: "alex",
};

export function ExchangePage({ swapId }: Props) {
  const t = useTranslations("exchange");
  const { user } = useAppState();

  const [swap, setSwap] = useState<ExchangeSwap | null>(null);
  const [summary, setSummary] = useState<SwapSummary | null>(null);
  const [myServices, setMyServices] = useState<SupportService[]>([]);
  const [partnerServiceTypes, setPartnerServiceTypes] = useState<
    Set<ServiceType>
  >(new Set());
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
        if (!swapRow) {
          setLoading(false);
          return;
        }

        const row = swapRow as Record<string, unknown>;
        const requesterId = String(row.requester_id ?? "");
        const responderId = String(row.responder_id ?? "");

        const { data: profiles, error: profilesError } = await sb
          .from("public_profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", [requesterId, responderId]);
        if (profilesError) {
          console.error("[exchange] profiles lookup failed:", profilesError);
        }

        const byId = Object.fromEntries(
          (profiles ?? []).map((p: Record<string, unknown>) => [
            p.user_id as string,
            p,
          ]),
        );

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
          requesterName:
            (byId[requesterId]?.display_name as string) ??
            requesterId.slice(0, 8),
          responderName:
            (byId[responderId]?.display_name as string) ??
            responderId.slice(0, 8),
        });

        // Load services for both participants (needed for bilateral matching)
        const { data: services } = await sb
          .from("swap_support_services")
          .select("*")
          .eq("swap_id", swapId);

        const mine: SupportService[] = [];
        const partnerTypes = new Set<ServiceType>();

        for (const s of (services ?? []) as Array<Record<string, unknown>>) {
          const userId = String(s.user_id ?? "");
          const svc: SupportService = {
            id: String(s.id ?? ""),
            swapId: String(s.swap_id ?? ""),
            userId,
            serviceType: s.service_type as ServiceType,
            isBilateral: !!s.is_bilateral,
            provider: (s.provider as string) ?? null,
            details: (s.details as Record<string, unknown>) ?? {},
            costEur: (s.cost_eur as number) ?? null,
            status: (s.status as SupportService["status"]) ?? "pending",
            createdAt: String(s.created_at ?? ""),
          };
          if (userId === user!.id) {
            mine.push(svc);
          } else {
            partnerTypes.add(svc.serviceType);
          }
        }

        setMyServices(mine);
        setPartnerServiceTypes(partnerTypes);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [swapId, user]);

  // ── Derive active/bilateral service types ──
  const activeServices = useMemo(
    () => myServices.map((s) => s.serviceType),
    [myServices],
  );

  const agreedBilateral = useMemo(() => {
    const out: ServiceType[] = [];
    for (const def of SERVICE_DEFS) {
      if (!def.bilateral) continue;
      if (
        activeServices.includes(def.key) &&
        partnerServiceTypes.has(def.key)
      ) {
        out.push(def.key);
      }
    }
    return out;
  }, [activeServices, partnerServiceTypes]);

  // Combined list: bilateral agreed in chat (auto-shown) + my individual selections
  const bilateralFromChat: ServiceType[] = [];
  if (summary?.services.escrow) bilateralFromChat.push("escrow");
  if (summary?.services.insurance) bilateralFromChat.push("insurance");

  const shownServices: ServiceType[] = [
    ...bilateralFromChat.filter((k) => !activeServices.includes(k)),
    ...activeServices,
  ];

  // ── Save service details ──
  const handleSave = useCallback(
    async (
      type: ServiceType,
      details: Record<string, unknown>,
      cost?: number,
    ) => {
      if (!user) return;
      const isBilateral =
        SERVICE_DEFS.find((s) => s.key === type)?.bilateral ?? false;
      const result = await upsertService(
        swapId,
        user.id,
        type,
        details,
        isBilateral,
        cost,
      );
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
    },
    [user, swapId],
  );

  // ── Toggle service from drawer ──
  const handleToggleService = useCallback(
    async (type: ServiceType) => {
      if (!user) return;
      const alreadyActive = activeServices.includes(type);
      if (alreadyActive) {
        await removeService(swapId, user.id, type);
        setMyServices((prev) => prev.filter((s) => s.serviceType !== type));
      } else {
        const def = SERVICE_DEFS.find((s) => s.key === type);
        const result = await upsertService(
          swapId,
          user.id,
          type,
          {},
          def?.bilateral ?? false,
        );
        if (result) setMyServices((prev) => [...prev, result]);
      }
    },
    [user, swapId, activeServices],
  );

  // ── Unauthenticated: demo view (no redirects, no side-effects) ──
  if (!user) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
          {t("loginRequired")}
        </div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          🔄 {t("pageTitle")}
        </h1>
        <ExchangeSummary
          swap={DEMO_SWAP}
          summary={DEMO_SUMMARY}
          myRole="requester"
        />
        <ExchangeServices
          swapId={swapId}
          activeServices={["escrow"] as ServiceType[]}
          onSave={async () => undefined}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-zinc-400">{t("loadingSwap")}</div>
    );
  }

  if (!swap) {
    return <div className="p-8 text-center text-zinc-400">{t("notFound")}</div>;
  }

  if (swap.requesterId !== user.id && swap.responderId !== user.id) {
    return (
      <div className="p-8 text-center text-zinc-400">{t("notParticipant")}</div>
    );
  }

  const myRole: "requester" | "responder" =
    swap.requesterId === user.id ? "requester" : "responder";
  const partnerName =
    myRole === "requester"
      ? (swap.responderName ?? "")
      : (swap.requesterName ?? "");

  return (
    <div className="mx-auto flex max-w-5xl gap-6 px-4 py-6">
      <div className="min-w-0 flex-1 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            🔄 {t("pageTitle")}
          </h1>
          <button
            type="button"
            onClick={() => setDrawerOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <Settings className="h-4 w-4" />
            {t("drawer.title")}
          </button>
        </div>

        <ExchangeSummary swap={swap} summary={summary} myRole={myRole} />

        <ExchangeLogisticsPanel swapId={swapId} />

        <ExchangeServices
          swapId={swapId}
          activeServices={shownServices}
          onSave={handleSave}
        />

        <ExchangePDFGenerator
          swapId={swapId}
          initialPdfUrl={swap.pdfUrl ?? null}
        />

        <ExchangeConfirmation
          swapId={swapId}
          myUserId={user.id}
          partnerName={partnerName}
          confirmedBy={swap.confirmedBy}
          participantIds={[swap.requesterId, swap.responderId]}
        />
      </div>

      {/* Inline drawer (desktop only) */}
      {drawerOpen && (
        <aside className="hidden w-72 shrink-0 rounded-2xl border border-zinc-200 dark:border-zinc-700 lg:block">
          <ExchangeDrawer
            activeServices={activeServices}
            agreedBilateral={agreedBilateral}
            onToggle={handleToggleService}
            onClose={() => setDrawerOpen(false)}
          />
        </aside>
      )}
    </div>
  );
}
