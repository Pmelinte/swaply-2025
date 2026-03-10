import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getServerSupabase } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.EMAIL_FROM || "Swaply <noreply@swaply.app>";

/**
 * POST /api/email/swap-proposal
 *
 * Sends a swap proposal notification email via Resend.
 * Falls back to logging in development when RESEND_API_KEY is not set.
 */
export async function POST(request: Request) {
  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Authenticate
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Rate limit
  if (!rateLimit(authUser.id, { limit: 5, windowMs: 60_000 }).allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const { swapId, requesterId, responderId, requesterItemTitle, responderItemTitle } = body;

  if (!swapId || !requesterId || !responderId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Fetch both profiles in parallel
  const [{ data: responder }, { data: requester }] = await Promise.all([
    supabase.from("profiles").select("display_name, email").eq("user_id", responderId).maybeSingle(),
    supabase.from("profiles").select("display_name").eq("user_id", requesterId).maybeSingle(),
  ]);

  const recipientEmail = (responder as Record<string, unknown>)?.email as string;
  const rawRecipientName = (responder as Record<string, unknown>)?.display_name as string || "Swaply User";
  const rawSenderName = (requester as Record<string, unknown>)?.display_name as string || "Un utilizator Swaply";

  if (!recipientEmail) {
    return NextResponse.json({ error: "Recipient email not found" }, { status: 404 });
  }

  // Escape HTML to prevent XSS in email templates
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const recipientName = esc(rawRecipientName);
  const senderName = esc(rawSenderName);
  const safeRequesterItem = esc(requesterItemTitle || "un obiect");
  const safeResponderItem = esc(responderItemTitle || "obiectul tău");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://swaply.app";
  const swapUrl = `${appUrl}/change?swap=${encodeURIComponent(swapId)}`;
  const unsubscribeUrl = `${appUrl}/profile#notifications`;

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1a1a1a; margin-bottom: 16px;">Ai primit o propunere de schimb!</h2>
      <p style="color: #444; line-height: 1.6;">
        Salut <strong>${recipientName}</strong>,<br><br>
        <strong>${senderName}</strong> vrea să schimbe <em>${safeRequesterItem}</em>
        cu <em>${safeResponderItem}</em>.
      </p>
      <a href="${swapUrl}"
         style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
        Vezi propunerea
      </a>
      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;">
      <p style="color: #999; font-size: 12px;">
        Nu mai vrei notificări? <a href="${unsubscribeUrl}" style="color: #999;">Dezabonează-te</a>
      </p>
    </div>
  `;

  if (resend) {
    try {
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: recipientEmail,
        subject: `${senderName} îți propune un schimb pe Swaply`,
        html: htmlBody,
      });

      if (error) {
        console.error("[email/swap-proposal] Resend error:", error);
        return NextResponse.json({ error: "Email sending failed" }, { status: 502 });
      }

      return NextResponse.json({ ok: true, sent: true });
    } catch (err) {
      console.error("[email/swap-proposal] Resend exception:", err);
      return NextResponse.json({ error: "Email sending failed" }, { status: 502 });
    }
  }

  // Development fallback — log instead of sending
  console.log("[email/swap-proposal] RESEND_API_KEY not set, logging email:", {
    to: recipientEmail,
    subject: `${senderName} îți propune un schimb pe Swaply`,
  });

  return NextResponse.json({ ok: true, sent: false, dev: true });
}
