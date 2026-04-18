import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { getExchangeSwap, getSwapServices } from "@/lib/exchange/exchangeQuery";
import { buildExchangeHTML } from "@/lib/exchange/exchangePDF";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ swapId: string }> },
) {
  const { swapId } = await params;

  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const swap = await getExchangeSwap(swapId);
  if (!swap) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isParticipant = swap.requesterId === user.id || swap.responderId === user.id;
  if (!isParticipant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const allServices = await getSwapServices(swapId);
  const myServices = allServices.filter((s) => s.userId === user.id);
  const partnerServices = allServices.filter((s) => s.userId !== user.id);

  const partnerId = swap.requesterId === user.id ? swap.responderId : swap.requesterId;
  const myName = swap.requesterId === user.id ? (swap.requesterName ?? "You") : (swap.responderName ?? "You");
  const partnerName = swap.requesterId === user.id ? (swap.responderName ?? partnerId.slice(0, 8)) : (swap.requesterName ?? partnerId.slice(0, 8));

  const html = buildExchangeHTML({
    swap,
    summary: swap.summary ?? null,
    myServices,
    partnerServices,
    myName,
    partnerName,
    generatedAt: new Date().toISOString(),
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="swaply-exchange-${swapId.slice(0, 8)}.pdf"`,
    },
  });
}
