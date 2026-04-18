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
    .select("*, conversations(summary)")
    .eq("id", swapId)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as Record<string, unknown>;

  const requesterId = String(row.requester_id ?? "");
  const responderId = String(row.responder_id ?? "");

  // Load profiles for both participants
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, display_name, avatar_url")
    .in("user_id", [requesterId, responderId]);

  const byId = Object.fromEntries(
    (profiles ?? []).map((p) => [p.user_id as string, p]),
  );

  const conv = row.conversations as { summary?: SwapSummary } | null;

  return {
    id: String(row.id ?? ""),
    requesterId,
    responderId,
    status: String(row.status ?? "pending"),
    exchangeData: (row.exchange_data as Record<string, unknown>) ?? {},
    pdfUrl: (row.pdf_url as string) ?? null,
    confirmedBy: (row.confirmed_by as string[]) ?? [],
    completedAt: (row.completed_at as string) ?? null,
    conversationId: (row.conversation_id as string) ?? null,
    summary: conv?.summary ?? null,
    requesterName: (byId[requesterId]?.display_name as string) ?? requesterId.slice(0, 8),
    responderName: (byId[responderId]?.display_name as string) ?? responderId.slice(0, 8),
    requesterAvatarUrl: (byId[requesterId]?.avatar_url as string) ?? null,
    responderAvatarUrl: (byId[responderId]?.avatar_url as string) ?? null,
  };
}

export async function getSwapServices(swapId: string): Promise<SupportService[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return [];

  const { data } = await supabase
    .from("swap_support_services")
    .select("*")
    .eq("swap_id", swapId)
    .order("created_at", { ascending: true });

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
