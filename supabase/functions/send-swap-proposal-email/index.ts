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
  message_initial?: string;
}

function buildHtml(data: {
  requesterUsername: string;
  requesterAvatar: string;
  requesterLocation: string;
  offeredTitle: string;
  offeredImage: string;
  offeredValue: string;
  requestedTitle: string;
  messageInitial?: string;
  swapId: string;
}): string {
  const messageBlock = data.messageInitial
    ? `<div style="background:#f0f9ff;border-left:4px solid #2563eb;border-radius:0 8px 8px 0;padding:16px;margin:24px 0;">
        <p style="font-size:13px;color:#6b7280;margin:0 0 4px;font-weight:600;">💬 Mesaj de la ${data.requesterUsername}:</p>
        <p style="font-size:15px;color:#1a1a1a;margin:0;font-style:italic;line-height:1.5;">"${data.messageInitial}"</p>
      </div>`
    : "";

  const avatarBlock = data.requesterAvatar
    ? `<img src="${data.requesterAvatar}" alt="${data.requesterUsername}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;margin-right:12px;">`
    : `<div style="width:48px;height:48px;border-radius:50%;background:#16a34a;color:#fff;font-size:20px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;margin-right:12px;">${data.requesterUsername.charAt(0).toUpperCase()}</div>`;

  const imageBlock = data.offeredImage
    ? `<img src="${data.offeredImage}" alt="${data.offeredTitle}" style="width:100%;max-width:200px;height:140px;object-fit:cover;border-radius:8px;margin-top:8px;">`
    : "";

  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Propunere de schimb pe Swaply</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">Ai 48 de ore sa raspunzi. Deschide propunerea →</div>
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#16a34a,#15803d);padding:32px 24px;text-align:center;">
      <h1 style="color:#ffffff;font-size:28px;margin:0;font-weight:700;">🔄 Swaply</h1>
      <p style="color:rgba(255,255,255,0.9);font-size:14px;margin:8px 0 0;">Schimba obiectele, nu banii</p>
    </div>

    <!-- Body -->
    <div style="padding:32px 24px;">
      <h1 style="font-size:22px;color:#1a1a1a;margin:0 0 24px;text-align:center;">Ai primit o propunere de schimb! 🤝</h1>

      <!-- Requester info -->
      <div style="display:flex;align-items:center;margin-bottom:24px;">
        ${avatarBlock}
        <div>
          <p style="font-size:16px;font-weight:600;color:#1a1a1a;margin:0;">${data.requesterUsername}</p>
          ${data.requesterLocation ? `<p style="font-size:13px;color:#6b7280;margin:4px 0 0;">📍 ${data.requesterLocation}</p>` : ""}
        </div>
      </div>

      <!-- Swap offer -->
      <div style="background:#f8faf9;border-radius:12px;padding:20px;margin:0 0 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td width="48%" style="vertical-align:top;padding:8px;">
              <p style="font-size:12px;color:#6b7280;margin:0 0 4px;text-transform:uppercase;font-weight:600;">El/Ea ofera:</p>
              <p style="font-size:16px;color:#1a1a1a;margin:0;font-weight:600;">${data.offeredTitle}</p>
              ${data.offeredValue ? `<p style="font-size:13px;color:#16a34a;margin:4px 0 0;">~${data.offeredValue} RON</p>` : ""}
              ${imageBlock}
            </td>
            <td width="4%" style="vertical-align:middle;text-align:center;padding:8px;">
              <span style="font-size:24px;">⇄</span>
            </td>
            <td width="48%" style="vertical-align:top;padding:8px;">
              <p style="font-size:12px;color:#6b7280;margin:0 0 4px;text-transform:uppercase;font-weight:600;">El/Ea doreste:</p>
              <p style="font-size:16px;color:#1a1a1a;margin:0;font-weight:600;">${data.requestedTitle}</p>
            </td>
          </tr>
        </table>
      </div>

      ${messageBlock}

      <!-- CTAs -->
      <div style="text-align:center;margin:32px 0 16px;">
        <a href="https://swaply.world/change?swap=${data.swapId}&action=accept" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">
          ✅ Accepta propunerea
        </a>
      </div>
      <div style="text-align:center;margin:0 0 16px;">
        <a href="https://swaply.world/change?swap=${data.swapId}&action=reject" style="display:inline-block;background:#ef4444;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;">
          ❌ Refuza propunerea
        </a>
      </div>
      <div style="text-align:center;margin:0 0 24px;">
        <a href="https://swaply.world/chat?swap=${data.swapId}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;">
          💬 Deschide chat-ul
        </a>
      </div>

      <!-- Timer -->
      <div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:16px;margin:24px 0;text-align:center;">
        <p style="font-size:16px;color:#854d0e;margin:0;">
          ⏰ <strong>Propunerea expira in 48 de ore</strong>
        </p>
      </div>

      <!-- Tip -->
      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:12px 16px;margin:0 0 8px;text-align:center;">
        <p style="font-size:14px;color:#0369a1;margin:0;">
          💡 Raspunde rapid pentru a mentine o reputatie buna pe platforma!
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:20px 24px;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="font-size:12px;color:#9ca3af;margin:0;line-height:1.6;">
        Ai primit acest email deoarece cineva ti-a trimis o propunere pe
        <a href="https://swaply.world" style="color:#16a34a;text-decoration:none;">swaply.world</a>.<br>
        <a href="https://swaply.world/settings" style="color:#9ca3af;text-decoration:underline;">Setari notificari</a>
      </p>
      <p style="font-size:11px;color:#d1d5db;margin:8px 0 0;">
        © 2025 Swaply. Constanta, Romania.
      </p>
    </div>

  </div>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  try {
    const payload: SwapPayload = await req.json();
    const { swap_id, requester_id, responder_id, offered_item_id, requested_item_id, message_initial } = payload;

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
    const [requesterProfile, offeredItem, requestedItem, responderUser] = await Promise.all([
      supabase.from("profiles").select("username, avatar_url, location_text").eq("user_id", requester_id).single(),
      supabase.from("items").select("title, images, image_url, estimated_value").eq("id", offered_item_id).single(),
      supabase.from("items").select("title").eq("id", requested_item_id).single(),
      supabase.auth.admin.getUserById(responder_id),
    ]);

    const responderEmail = responderUser.data?.user?.email;
    if (!responderEmail) {
      console.error("Could not find responder email for:", responder_id);
      return new Response(JSON.stringify({ error: "Responder email not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const requester = requesterProfile.data;
    const offered = offeredItem.data;
    const requested = requestedItem.data;

    const requesterUsername = requester?.username || "Cineva";
    const requesterAvatar = requester?.avatar_url || "";
    const requesterLocation = requester?.location_text || "";
    const offeredTitle = offered?.title || "Obiect";
    const requestedTitle = requested?.title || "Obiectul tau";

    // Get first image from images array or fallback to image_url
    let offeredImage = "";
    if (offered?.images && Array.isArray(offered.images) && offered.images.length > 0) {
      offeredImage = offered.images[0]?.url || offered.images[0] || "";
    } else if (offered?.image_url) {
      offeredImage = offered.image_url;
    }

    const offeredValue = offered?.estimated_value ? String(offered.estimated_value) : "";

    const subject = `🤝 ${requesterUsername} ți-a trimis o propunere de schimb!`;

    const html = buildHtml({
      requesterUsername,
      requesterAvatar,
      requesterLocation,
      offeredTitle,
      offeredImage,
      offeredValue,
      requestedTitle,
      messageInitial: message_initial,
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
        subject,
        html,
        headers: {
          "X-Entity-Ref-ID": swap_id,
          "List-Unsubscribe": "<https://swaply.world/settings>",
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "Failed to send email", details: data }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`Swap proposal email sent to ${responderEmail} for swap ${swap_id}, id: ${data.id}`);
    return new Response(JSON.stringify({ success: true, id: data.id }), {
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
