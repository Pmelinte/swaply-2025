import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getServerSupabase } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { renderWelcomeEmail } from "@/lib/email-templates";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.EMAIL_FROM || "Swaply <noreply@swaply.app>";

/**
 * POST /api/email/welcome
 *
 * Sends a welcome email to a newly registered user via Resend.
 * Called after successful account creation / first login.
 * Falls back to console logging when RESEND_API_KEY is not set.
 */
export async function POST(request: Request) {
  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Authenticate
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Rate limit — 2 welcome emails per hour (prevents abuse)
  if (!rateLimit(authUser.id, { limit: 2, windowMs: 3_600_000 }).allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: { email?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const recipientEmail = body.email || authUser.email;
  if (!recipientEmail) {
    return NextResponse.json({ error: "Recipient email not found" }, { status: 400 });
  }

  // Escape HTML to prevent XSS in email templates
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const rawName = body.name || authUser.user_metadata?.display_name || "Swaply User";
  const name = esc(rawName);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://swaply.app";
  const loginUrl = `${appUrl}/login`;
  const unsubscribeUrl = `${appUrl}/profile#notifications`;

  const html = renderWelcomeEmail({ name, loginUrl, unsubscribeUrl });

  if (resend) {
    try {
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: recipientEmail,
        subject: "Bine ai venit pe Swaply! 🎉",
        html,
      });

      if (error) {
        console.error("[email/welcome] Resend error:", error);
        return NextResponse.json({ error: "Email sending failed" }, { status: 502 });
      }

      return NextResponse.json({ ok: true, sent: true });
    } catch (err) {
      console.error("[email/welcome] Resend exception:", err);
      return NextResponse.json({ error: "Email sending failed" }, { status: 502 });
    }
  }

  // Development fallback — log instead of sending
  console.log("[email/welcome] RESEND_API_KEY not set, logging email:", {
    to: recipientEmail,
    subject: "Bine ai venit pe Swaply! 🎉",
  });

  return NextResponse.json({ ok: true, sent: false, dev: true });
}
