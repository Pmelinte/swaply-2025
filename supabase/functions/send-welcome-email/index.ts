import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface WebhookPayload {
  user_id: string;
  email: string;
  raw_user_meta_data: Record<string, string>;
}

function buildHtml(firstName: string): string {
  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bun venit pe Swaply!</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#16a34a,#15803d);padding:32px 24px;text-align:center;">
      <h1 style="color:#ffffff;font-size:28px;margin:0;font-weight:700;">🔄 Swaply</h1>
      <p style="color:rgba(255,255,255,0.9);font-size:14px;margin:8px 0 0;">Schimbă obiectele, nu banii</p>
    </div>

    <!-- Body -->
    <div style="padding:32px 24px;">
      <h1 style="font-size:24px;color:#1a1a1a;margin:0 0 16px;">Bun venit în comunitatea Swaply! 🤝</h1>

      <p style="font-size:16px;color:#4a4a4a;line-height:1.6;margin:0 0 24px;">
        Salut <strong>${firstName}</strong>! Ești acum parte dintr-o comunitate de oameni
        care schimbă obiecte fără bani în toată România.
      </p>

      <!-- CTA Primar -->
      <div style="text-align:center;margin:32px 0;">
        <a href="https://swaply.world/my-objects" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">
          Adaugă primul tău obiect →
        </a>
      </div>

      <!-- 3 Pași -->
      <div style="background:#f8faf9;border-radius:8px;padding:24px;margin:24px 0;">
        <h2 style="font-size:18px;color:#1a1a1a;margin:0 0 16px;">Cum funcționează în 3 pași:</h2>

        <div style="margin-bottom:12px;">
          <span style="font-size:20px;">📦</span>
          <strong style="color:#1a1a1a;"> Pas 1:</strong>
          <span style="color:#4a4a4a;"> Listează ce vrei să schimbi (2 minute)</span>
        </div>

        <div style="margin-bottom:12px;">
          <span style="font-size:20px;">🤖</span>
          <strong style="color:#1a1a1a;"> Pas 2:</strong>
          <span style="color:#4a4a4a;"> Lasă AI-ul să găsească match-uri pentru tine</span>
        </div>

        <div>
          <span style="font-size:20px;">🤝</span>
          <strong style="color:#1a1a1a;"> Pas 3:</strong>
          <span style="color:#4a4a4a;"> Negociază în chat și finalizează schimbul</span>
        </div>
      </div>

      <!-- CTA Secundar -->
      <div style="text-align:center;margin:32px 0;">
        <a href="https://swaply.world/objects" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;">
          Explorează obiecte disponibile →
        </a>
      </div>

      <!-- Bonus -->
      <div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:16px;margin:24px 0;text-align:center;">
        <p style="font-size:16px;color:#854d0e;margin:0;">
          🪙 <strong>Bonus: 25 tokens te așteaptă în cont!</strong><br>
          <span style="font-size:14px;">Folosește-i pentru a boosta primul listing.</span>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:20px 24px;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="font-size:12px;color:#9ca3af;margin:0;line-height:1.6;">
        Ai primit acest email deoarece te-ai înregistrat pe
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
    const payload: WebhookPayload = await req.json();
    const { email, raw_user_meta_data } = payload;

    if (!email) {
      return new Response(JSON.stringify({ error: "No email provided" }), {
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

    const firstName =
      raw_user_meta_data?.first_name ||
      raw_user_meta_data?.full_name?.split(" ")[0] ||
      raw_user_meta_data?.name?.split(" ")[0] ||
      "Utilizator";

    const subject = `🎉 Bun venit pe Swaply, ${firstName}! Contul tău este gata`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Swaply <noreply@swaply.world>",
        reply_to: "support@swaply.world",
        to: [email],
        subject,
        html: buildHtml(firstName),
        headers: {
          "X-Entity-Ref-ID": payload.user_id,
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

    console.log(`Welcome email sent to ${email}, id: ${data.id}`);
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
