import { NextResponse } from "next/server";
import { isExactLocationPayload } from "@/lib/chat/chatDelivery";
import { getServerSupabase } from "@/lib/supabase/server";
import {
  getExchangeLogistics,
  setCourierLogistics,
  setEventLogistics,
  setLocalHandoverPlan,
  setExchangeMethod,
  setPropertyLogistics,
  setServiceLogistics,
  updateExchangeStatus,
} from "@/lib/exchange/exchangeLogisticsPersistence";
import type {
  ExchangeMethod,
  ExchangeStatus,
} from "@/lib/exchange/exchangeLogistics";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await getServerSupabase();
  if (!supabase)
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 500 },
    );

  const { id } = await params;
  const logistics = await getExchangeLogistics(supabase, id);
  return NextResponse.json({ logistics });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await getServerSupabase();
  if (!supabase)
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 500 },
    );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    action?:
      | "set_method"
      | "set_status"
      | "set_local_handover"
      | "set_courier"
      | "set_property"
      | "set_service"
      | "set_event";
    method?: ExchangeMethod;
    status?: ExchangeStatus;
    title?: string;
    description?: string;
    areaLabel?: string;
    scheduledAt?: string | null;
    city?: string;
    country?: string;
    provider?: string;
    trackingCode?: string;
    packaging?: string;
    packageNotes?: string;
    estimatedDelivery?: string;
    checkIn?: string;
    checkOut?: string;
    rules?: string;
    deliverables?: string;
    deadline?: string;
    sessionUrl?: string;
    transferDeadline?: string;
    proofLabel?: string;
    transferNotes?: string;
  };

  if (body.action === "set_method" && body.method) {
    const logistics = await setExchangeMethod(supabase, {
      swapId: id,
      actorId: user.id,
      method: body.method,
    });
    if (!logistics)
      return NextResponse.json(
        { error: "Could not set exchange method" },
        { status: 400 },
      );
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
    if (!logistics)
      return NextResponse.json(
        { error: "Could not update exchange status" },
        { status: 400 },
      );
    return NextResponse.json({ logistics });
  }

  if (
    body.action === "set_local_handover" &&
    typeof body.areaLabel === "string"
  ) {
    if (isExactLocationPayload(body)) {
      return NextResponse.json(
        { error: "Exact location is not accepted" },
        { status: 400 },
      );
    }
    const logistics = await setLocalHandoverPlan(supabase, {
      swapId: id,
      actorId: user.id,
      areaLabel: body.areaLabel,
      scheduledAt: body.scheduledAt ?? null,
      city: body.city,
      country: body.country,
    });
    if (!logistics)
      return NextResponse.json(
        { error: "Could not update local handover" },
        { status: 400 },
      );
    return NextResponse.json({ logistics });
  }

  if (body.action === "set_courier") {
    const logistics = await setCourierLogistics(supabase, {
      swapId: id,
      actorId: user.id,
      provider: body.provider,
      trackingCode: body.trackingCode,
      packaging: body.packaging,
      packageNotes: body.packageNotes,
      estimatedDelivery: body.estimatedDelivery,
    });
    if (!logistics)
      return NextResponse.json(
        { error: "Could not update courier logistics" },
        { status: 400 },
      );
    return NextResponse.json({ logistics });
  }

  if (body.action === "set_property") {
    const logistics = await setPropertyLogistics(supabase, {
      swapId: id,
      actorId: user.id,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      rules: body.rules,
    });
    if (!logistics)
      return NextResponse.json(
        { error: "Could not update property logistics" },
        { status: 400 },
      );
    return NextResponse.json({ logistics });
  }

  if (body.action === "set_service") {
    const logistics = await setServiceLogistics(supabase, {
      swapId: id,
      actorId: user.id,
      deliverables: body.deliverables,
      deadline: body.deadline,
      sessionUrl: body.sessionUrl,
    });
    if (!logistics)
      return NextResponse.json(
        { error: "Could not update service logistics" },
        { status: 400 },
      );
    return NextResponse.json({ logistics });
  }

  if (body.action === "set_event") {
    const logistics = await setEventLogistics(supabase, {
      swapId: id,
      actorId: user.id,
      transferDeadline: body.transferDeadline,
      proofLabel: body.proofLabel,
      transferNotes: body.transferNotes,
    });
    if (!logistics)
      return NextResponse.json(
        { error: "Could not update event logistics" },
        { status: 400 },
      );
    return NextResponse.json({ logistics });
  }

  return NextResponse.json(
    { error: "Invalid logistics action" },
    { status: 400 },
  );
}
