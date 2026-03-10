import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getServerSupabase } from "@/lib/supabase/server";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.EMAIL_FROM || "Swaply <noreply@swaply.app>";

// Simple in-memory rate limiter: max 5 emails per user per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 5;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

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
  if (!checkRateLimit(authUser.id)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
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
    .eq("user_id", responderId)
    .maybeSingle();

  const { data: requester } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", requesterId)
    .maybeSingle();

  const recipientEmail = (responder as Record<string, unknown>)?.email as string;
  const recipientName = (responder as Record<string, unknown>)?.display_name as string || "Swaply User";
  const senderName = (requester as Record<string, unknown>)?.display_name as string || "Un utilizator Swaply";

  if (!recipientEmail) {
    return NextResponse.json({ error: "Recipient email not found" }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://swaply.app";
  const swapUrl = `${appUrl}/change?swap=${swapId}`;
  const unsubscribeUrl = `${appUrl}/profile#notifications`;

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1a1a1a; margin-bottom: 16px;">Ai primit o propunere de schimb!</h2>
      <p style="color: #444; line-height: 1.6;">
        Salut <strong>${recipientName}</strong>,<br><br>
        <strong>${senderName}</strong> vrea să schimbe <em>${requesterItemTitle || "un obiect"}</em>
        cu <em>${responderItemTitle || "obiectul tău"}</em>.
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
