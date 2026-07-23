import { NextResponse } from "next/server";
import { isExactLocationPayload } from "@/lib/chat/chatDelivery";
import { getServerSupabase } from "@/lib/supabase/server";
import {
  getExchangeLogistics,
  setLocalHandoverPlan,
  setExchangeMethod,
  updateExchangeStatus,
} from "@/lib/exchange/exchangeLogisticsPersistence";
import type { ExchangeMethod, ExchangeStatus } from "@/lib/exchange/exchangeLogistics";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });

  const { id } = await params;
  const logistics = await getExchangeLogistics(supabase, id);
  return NextResponse.json({ logistics });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    action?: "set_method" | "set_status" | "set_local_handover";
    method?: ExchangeMethod;
    status?: ExchangeStatus;
    title?: string;
    description?: string;
    areaLabel?: string;
    scheduledAt?: string | null;
    city?: string;
    country?: string;
  };

  if (body.action === "set_method" && body.method) {
    const logistics = await setExchangeMethod(supabase, {
      swapId: id,
      actorId: user.id,
      method: body.method,
    });
    if (!logistics) return NextResponse.json({ error: "Could not set exchange method" }, { status: 400 });
    return NextResponse.json({ logistics });
  }

  if (body.action === "set_status" && body.status) {
    const logistics = await updateExchangeStatus(supabase, {
      swapId: id,
      actorId: user.id,
      status: body.status,
      title: body.title,
      description: body.description,
    });
    if (!logistics) return NextResponse.json({ error: "Could not update exchange status" }, { status: 400 });
    return NextResponse.json({ logistics });
  }

  if (body.action === "set_local_handover" && typeof body.areaLabel === "string") {
    if (isExactLocationPayload(body)) {
      return NextResponse.json({ error: "Exact location is not accepted" }, { status: 400 });
    }
    const logistics = await setLocalHandoverPlan(supabase, {
      swapId: id,
      actorId: user.id,
      areaLabel: body.areaLabel,
      scheduledAt: body.scheduledAt ?? null,
      city: body.city,
      country: body.country,
    });
    if (!logistics) return NextResponse.json({ error: "Could not update local handover" }, { status: 400 });
    return NextResponse.json({ logistics });
  }

  return NextResponse.json({ error: "Invalid logistics action" }, { status: 400 });
}
