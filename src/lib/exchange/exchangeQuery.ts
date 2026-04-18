"use server";

import { getServerSupabase } from "@/lib/supabase/server";
import type { SwapSummary } from "@/lib/chat/chatSummary";

export type ServiceType =
  | "escrow" | "packaging" | "transport" | "accommodation"
  | "restaurant" | "insurance" | "legal" | "ai_valuation";

export type ServiceStatus = "pending" | "active" | "completed" | "cancelled";

export interface SupportService {
  id: string;
  swapId: string;
  userId: string;
  serviceType: ServiceType;
  isBilateral: boolean;
  provider?: string | null;
  details: Record<string, unknown>;
  costEur?: number | null;
  status: ServiceStatus;
  createdAt: string;
}

export interface ExchangeSwap {
  id: string;
  requesterId: string;
  responderId: string;
  status: string;
  exchangeData: Record<string, unknown>;
  pdfUrl?: string | null;
  confirmedBy: string[];
  completedAt?: string | null;
  conversationId?: string | null;
  summary?: SwapSummary | null;
  requesterName?: string;
  responderName?: string;
  requesterAvatarUrl?: string | null;
  responderAvatarUrl?: string | null;
}

export async function getExchangeSwap(swapId: string): Promise<ExchangeSwap | null> {
  const supabase = await getServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("swaps")
    .select("*")
    .eq("id", swapId)
    .maybeSingle();

  if (error) {
    console.error("[exchange] getExchangeSwap failed:", error);
  }
  if (!data) return null;

  const row = data as Record<string, unknown>;

  const requesterId = String(row.requester_id ?? "");
  const responderId = String(row.responder_id ?? "");

  // Load profiles for both participants
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("user_id, display_name, avatar_url")
    .in("user_id", [requesterId, responderId]);
  if (profilesError) {
    console.error("[exchange] profiles lookup failed:", profilesError);
  }

  const byId = Object.fromEntries(
    (profiles ?? []).map((p) => [p.user_id as string, p]),
  );

  // Fetch conversation summary separately (avoid join that fails silently)
  let summary: SwapSummary | null = null;
  const conversationId = row.conversation_id as string | null;
  if (conversationId) {
    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .select("summary")
      .eq("id", conversationId)
      .maybeSingle();
    if (convError) {
      console.error("[exchange] conversation lookup failed:", convError);
    }
    summary = (conv?.summary as SwapSummary) ?? null;
  }

  return {
    id: String(row.id ?? ""),
    requesterId,
    responderId,
    status: String(row.status ?? "pending"),
    exchangeData: (row.exchange_data as Record<string, unknown>) ?? {},
    pdfUrl: (row.pdf_url as string) ?? null,
    confirmedBy: (row.confirmed_by as string[]) ?? [],
    completedAt: (row.completed_at as string) ?? null,
    conversationId: conversationId ?? null,
    summary,
    requesterName: (byId[requesterId]?.display_name as string) ?? requesterId.slice(0, 8),
    responderName: (byId[responderId]?.display_name as string) ?? responderId.slice(0, 8),
    requesterAvatarUrl: (byId[requesterId]?.avatar_url as string) ?? null,
    responderAvatarUrl: (byId[responderId]?.avatar_url as string) ?? null,
  };
}

export async function getSwapServices(swapId: string): Promise<SupportService[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("swap_support_services")
    .select("*")
    .eq("swap_id", swapId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[exchange] getSwapServices failed:", error);
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id ?? ""),
    swapId: String(row.swap_id ?? ""),
    userId: String(row.user_id ?? ""),
    serviceType: (row.service_type as ServiceType),
    isBilateral: !!(row.is_bilateral),
    provider: (row.provider as string) ?? null,
    details: (row.details as Record<string, unknown>) ?? {},
    costEur: (row.cost_eur as number) ?? null,
    status: (row.status as ServiceStatus) ?? "pending",
    createdAt: String(row.created_at ?? ""),
  }));
}
