import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface SwapPayload {
  swap_id: string;
  requester_id: string;
  responder_id: string;
  offered_item_id: string;
  requested_item_id: string;
}

function buildHtml(data: {
  partnerName: string;
  partnerCity: string;
  offeredTitle: string;
  requestedTitle: string;
  swapId: string;
}): string {
  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Schimb confirmat pe Swaply</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">Schimbul a fost confirmat! Deschide detaliile →</div>
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#16a34a,#15803d);padding:32px 24px;text-align:center;">
      <h1 style="color:#ffffff;font-size:28px;margin:0;font-weight:700;">🔄 Swaply</h1>
      <p style="color:rgba(255,255,255,0.9);font-size:14px;margin:8px 0 0;">Schimbă obiectele, nu banii</p>
    </div>

    <!-- Body -->
    <div style="padding:32px 24px;">
      <h1 style="font-size:24px;color:#1a1a1a;margin:0 0 8px;text-align:center;">🎉 Schimb confirmat! Felicitări!</h1>
      <p style="font-size:15px;color:#6b7280;margin:0 0 24px;text-align:center;">Ambele părți au acceptat propunerea.</p>

      <!-- Swap details -->
      <div style="background:#f8faf9;border-radius:12px;padding:20px;margin:0 0 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td width="48%" style="vertical-align:top;padding:8px;">
              <p style="font-size:12px;color:#6b7280;margin:0 0 4px;text-transform:uppercase;font-weight:600;">Tu dai:</p>
              <p style="font-size:16px;color:#1a1a1a;margin:0;font-weight:600;">${data.offeredTitle}</p>
            </td>
            <td width="4%" style="vertical-align:middle;text-align:center;padding:8px;">
              <span style="font-size:24px;">⇄</span>
            </td>
            <td width="48%" style="vertical-align:top;padding:8px;">
              <p style="font-size:12px;color:#6b7280;margin:0 0 4px;text-transform:uppercase;font-weight:600;">Primești:</p>
              <p style="font-size:16px;color:#1a1a1a;margin:0;font-weight:600;">${data.requestedTitle}</p>
            </td>
          </tr>
        </table>
      </div>

      <!-- Partner info -->
      <div style="background:#f0f9ff;border-radius:8px;padding:16px;margin:0 0 24px;text-align:center;">
        <p style="font-size:15px;color:#1a1a1a;margin:0;">
          Partener de schimb: <strong>${data.partnerName}</strong>${data.partnerCity ? ` din ${data.partnerCity}` : ""}
        </p>
      </div>

      <!-- Next steps -->
      <div style="background:#f8faf9;border-radius:8px;padding:24px;margin:0 0 24px;">
        <h2 style="font-size:18px;color:#1a1a1a;margin:0 0 16px;">Pași următori:</h2>

        <div style="margin-bottom:14px;">
          <span style="display:inline-block;width:24px;height:24px;background:#16a34a;color:#fff;border-radius:50%;text-align:center;line-height:24px;font-size:13px;font-weight:700;margin-right:8px;">1</span>
          <span style="color:#1a1a1a;font-size:15px;">Agreați metoda de livrare în chat (curier sau întâlnire față-în-față)</span>
        </div>

        <div style="margin-bottom:14px;">
          <span style="display:inline-block;width:24px;height:24px;background:#16a34a;color:#fff;border-radius:50%;text-align:center;line-height:24px;font-size:13px;font-weight:700;margin-right:8px;">2</span>
          <span style="color:#1a1a1a;font-size:15px;">Folosiți integrările Swaply pentru curier cu reducere</span>
        </div>

        <div style="margin-bottom:14px;">
          <span style="display:inline-block;width:24px;height:24px;background:#16a34a;color:#fff;border-radius:50%;text-align:center;line-height:24px;font-size:13px;font-weight:700;margin-right:8px;">3</span>
          <span style="color:#1a1a1a;font-size:15px;">Confirmați primirea în aplicație după schimb</span>
        </div>

        <div>
          <span style="display:inline-block;width:24px;height:24px;background:#16a34a;color:#fff;border-radius:50%;text-align:center;line-height:24px;font-size:13px;font-weight:700;margin-right:8px;">4</span>
          <span style="color:#1a1a1a;font-size:15px;">Lăsați o evaluare — câștigați 15 tokens bonus!</span>
        </div>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin:32px 0 16px;">
        <a href="https://swaply.world/chat?swap=${data.swapId}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">
          💬 Deschide chat-ul cu ${data.partnerName} →
        </a>
      </div>

      <!-- Safety link -->
      <div style="text-align:center;margin:0 0 24px;">
        <a href="https://swaply.world/info" style="display:inline-block;background:#f1f5f9;color:#475569;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:500;">
          🛡️ Citește ghidul de siguranță →
        </a>
      </div>

      <!-- Tokens -->
      <div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:16px;margin:0 0 8px;text-align:center;">
        <p style="font-size:16px;color:#854d0e;margin:0;">
          🪙 <strong>Vei primi 30 tokens după confirmarea finală a schimbului</strong>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:20px 24px;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="font-size:12px;color:#9ca3af;margin:0;line-height:1.6;">
        Ai primit acest email deoarece ai un schimb activ pe
        <a href="https://swaply.world" style="color:#16a34a;text-decoration:none;">swaply.world</a>.<br>
        <a href="https://swaply.world/settings" style="color:#9ca3af;text-decoration:underline;">Setări notificări</a>
      </p>
      <p style="font-size:11px;color:#d1d5db;margin:8px 0 0;">
        © 2025 Swaply. Constanța, România.
      </p>
    </div>

  </div>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  try {
    const payload: SwapPayload = await req.json();
    const { swap_id, requester_id, responder_id, offered_item_id, requested_item_id } = payload;

    if (!swap_id || !requester_id || !responder_id || !offered_item_id || !requested_item_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set");
      return new Response(JSON.stringify({ error: "Missing API key" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch all data in parallel
    const [requesterProfile, responderProfile, offeredItem, requestedItem, requesterUser, responderUser] = await Promise.all([
      supabase.from("profiles").select("username, location_text").eq("user_id", requester_id).single(),
      supabase.from("profiles").select("username, location_text").eq("user_id", responder_id).single(),
      supabase.from("items").select("title").eq("id", offered_item_id).single(),
      supabase.from("items").select("title").eq("id", requested_item_id).single(),
      supabase.auth.admin.getUserById(requester_id),
      supabase.auth.admin.getUserById(responder_id),
    ]);

    const requesterEmail = requesterUser.data?.user?.email;
    const responderEmail = responderUser.data?.user?.email;

    const requesterName = requesterProfile.data?.username || "Cineva";
    const responderName = responderProfile.data?.username || "Cineva";
    const requesterCity = requesterProfile.data?.location_text || "";
    const responderCity = responderProfile.data?.location_text || "";
    const offeredTitle = offeredItem.data?.title || "Obiect";
    const requestedTitle = requestedItem.data?.title || "Obiect";

    const results: { email: string; success: boolean; id?: string }[] = [];

    // Send email to REQUESTER (the one who initiated the swap)
    if (requesterEmail) {
      const html = buildHtml({
        partnerName: responderName,
        partnerCity: responderCity,
        offeredTitle,
        requestedTitle,
        swapId: swap_id,
      });

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Swaply <noreply@swaply.world>",
          reply_to: "support@swaply.world",
          to: [requesterEmail],
          subject: "✅ Schimbul tău a fost confirmat! Detalii logistică",
          html,
          headers: {
            "X-Entity-Ref-ID": swap_id,
            "List-Unsubscribe": "<https://swaply.world/settings>",
          },
        }),
      });
      const data = await res.json();
      results.push({ email: requesterEmail, success: res.ok, id: data.id });
      if (res.ok) console.log(`Swap accepted email sent to requester ${requesterEmail}, id: ${data.id}`);
      else console.error("Resend error (requester):", JSON.stringify(data));
    }

    // Send email to RESPONDER (the one who accepted)
    if (responderEmail) {
      const html = buildHtml({
        partnerName: requesterName,
        partnerCity: requesterCity,
        offeredTitle: requestedTitle,  // Responder's perspective is flipped
        requestedTitle: offeredTitle,
        swapId: swap_id,
      });

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Swaply <noreply@swaply.world>",
          reply_to: "support@swaply.world",
          to: [responderEmail],
          subject: "✅ Schimbul tău a fost confirmat! Detalii logistică",
          html,
          headers: {
            "X-Entity-Ref-ID": swap_id,
            "List-Unsubscribe": "<https://swaply.world/settings>",
          },
        }),
      });
      const data = await res.json();
      results.push({ email: responderEmail, success: res.ok, id: data.id });
      if (res.ok) console.log(`Swap accepted email sent to responder ${responderEmail}, id: ${data.id}`);
      else console.error("Resend error (responder):", JSON.stringify(data));
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
});
