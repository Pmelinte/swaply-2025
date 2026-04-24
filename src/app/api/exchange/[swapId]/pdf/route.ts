/**
 * POST /api/exchange/[swapId]/pdf
 *
 * Server-side PDF generation using @react-pdf/renderer.
 * Uploads the generated PDF to Supabase Storage bucket `exchange-pdfs`
 * and persists the resulting public URL in swaps.pdf_url.
 *
 * Returns: { pdf_url: string }.
 *
 * PDF rendering is strictly server-side — @react-pdf/renderer is never
 * imported from a Client Component.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/service";
import { getExchangeSwap, getSwapServices } from "@/lib/exchange/exchangeQuery";
import { ExchangePDFDoc } from "@/lib/exchange/exchangePdfDoc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DISCLAIMER =
  "Swaply.world facilitates the connection between users and selected " +
  "service providers. Swaply assumes no responsibility for services provided " +
  "by third parties (courier, insurance, accommodation, restaurant). Each " +
  "provider is responsible according to their own terms and conditions.";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ swapId: string }> },
) {
  const { swapId } = await params;

  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const swap = await getExchangeSwap(swapId);
  if (!swap) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const isParticipant = swap.requesterId === user.id || swap.responderId === user.id;
  if (!isParticipant) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const allServices = await getSwapServices(swapId);
  const myServices = allServices.filter((s) => s.userId === user.id);
  const partnerServices = allServices.filter((s) => s.userId !== user.id);

  const myName = swap.requesterId === user.id
    ? (swap.requesterName ?? "You")
    : (swap.responderName ?? "You");
  const partnerName = swap.requesterId === user.id
    ? (swap.responderName ?? swap.responderId.slice(0, 8))
    : (swap.requesterName ?? swap.requesterId.slice(0, 8));

  // Server-side render → Uint8Array buffer
  let pdfBuffer: Uint8Array;
  try {
    // Dynamic import keeps @react-pdf/renderer out of any client bundle.
    const { renderToBuffer } = await import("@react-pdf/renderer");
    pdfBuffer = await renderToBuffer(
      ExchangePDFDoc({
        swap,
        summary: swap.summary ?? null,
        myServices,
        partnerServices,
        myName,
        partnerName,
        generatedAt: new Date().toISOString(),
        disclaimer: DISCLAIMER,
      }),
    );
  } catch (err) {
    console.error("[exchange/pdf] render failed:", err);
    return NextResponse.json({ error: "render_failed" }, { status: 500 });
  }

  // Upload via service role (bypasses RLS + works with private buckets)
  const service = getServiceSupabase();
  if (!service) {
    return NextResponse.json({ error: "storage_not_configured" }, { status: 503 });
  }

  const filePath = `${swapId}/${Date.now()}.pdf`;
  const { error: uploadError } = await service.storage
    .from("exchange-pdfs")
    .upload(filePath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    console.error("[exchange/pdf] upload failed:", uploadError);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }

  const { data: publicUrlData } = service.storage
    .from("exchange-pdfs")
    .getPublicUrl(filePath);

  const pdfUrl = publicUrlData.publicUrl;

  await service
    .from("swaps")
    .update({ pdf_url: pdfUrl })
    .eq("id", swapId);

  return NextResponse.json({ pdf_url: pdfUrl });
}
