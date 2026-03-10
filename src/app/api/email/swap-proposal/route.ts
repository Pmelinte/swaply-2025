import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

/**
 * POST /api/email/swap-proposal
 *
 * Sends a swap proposal notification email.
 * In production, integrate with Resend/SendGrid/SES.
 * Currently logs the email payload for development.
 */
export async function POST(request: Request) {
  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await request.json();
  const { swapId, requesterId, responderId, requesterItemTitle, responderItemTitle } = body;

  if (!swapId || !requesterId || !responderId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Fetch responder profile for email
  const { data: responder } = await supabase
    .from("profiles")
    .select("display_name, email")
    .eq("id", responderId)
    .maybeSingle();

  const { data: requester } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", requesterId)
    .maybeSingle();

  const recipientEmail = (responder as Record<string, unknown>)?.email as string;
  const recipientName = (responder as Record<string, unknown>)?.display_name as string || "Swaply User";
  const senderName = (requester as Record<string, unknown>)?.display_name as string || "Un utilizator Swaply";

  const emailPayload = {
    to: recipientEmail,
    subject: `${senderName} îți propune un schimb pe Swaply`,
    template: "swap-proposal",
    data: {
      recipientName,
      senderName,
      requesterItemTitle: requesterItemTitle || "un obiect",
      responderItemTitle: responderItemTitle || "obiectul tău",
      swapUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://swaply.app"}/change?swap=${swapId}`,
      unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://swaply.app"}/profile#notifications`,
    },
  };

  // TODO: Replace with actual email service (Resend, SendGrid, etc.)
  // Example with Resend:
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: "Swaply <noreply@swaply.app>",
  //   to: emailPayload.to,
  //   subject: emailPayload.subject,
  //   html: renderSwapProposalEmail(emailPayload.data),
  // });

  console.log("[email/swap-proposal]", JSON.stringify(emailPayload, null, 2));

  return NextResponse.json({ ok: true, template: emailPayload.template });
}
