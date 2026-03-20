import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function buildHtml(data: {
  username: string;
  newItemsCount: number;
  matchCount: number;
  newUsersCount: number;
  city: string;
}): string {
  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Te-a ratat Swaply!</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">Ai match-uri noi care te așteaptă. Reactivează contul →</div>
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#16a34a,#15803d);padding:32px 24px;text-align:center;">
      <h1 style="color:#ffffff;font-size:28px;margin:0;font-weight:700;">🔄 Swaply</h1>
      <p style="color:rgba(255,255,255,0.9);font-size:14px;margin:8px 0 0;">Schimbă obiectele, nu banii</p>
    </div>

    <!-- Body -->
    <div style="padding:32px 24px;">
      <h1 style="font-size:22px;color:#1a1a1a;margin:0 0 8px;text-align:center;">Te-am ratat, ${data.username}! 🥺</h1>
      <p style="font-size:16px;color:#4a4a4a;line-height:1.6;margin:0 0 24px;text-align:center;">
        Nu te-am mai văzut pe Swaply de 30 de zile.
      </p>

      <!-- Stats -->
      <div style="background:#f8faf9;border-radius:12px;padding:24px;margin:0 0 24px;">
        <h2 style="font-size:17px;color:#1a1a1a;margin:0 0 16px;text-align:center;">Ce s-a întâmplat între timp:</h2>

        <div style="margin-bottom:12px;">
          <span style="font-size:20px;">📦</span>
          <span style="color:#1a1a1a;font-size:15px;"> <strong>${data.newItemsCount}</strong> obiecte noi în categoriile tale preferate</span>
        </div>

        <div style="margin-bottom:12px;">
          <span style="font-size:20px;">🎯</span>
          <span style="color:#1a1a1a;font-size:15px;"> <strong>${data.matchCount}</strong> potențiale match-uri pentru obiectele tale</span>
        </div>

        <div>
          <span style="font-size:20px;">👥</span>
          <span style="color:#1a1a1a;font-size:15px;"> <strong>${data.newUsersCount}</strong> utilizatori noi${data.city ? ` din ${data.city}` : ""}</span>
        </div>
      </div>

      <!-- Bonus offer -->
      <div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:16px;margin:0 0 24px;text-align:center;">
        <p style="font-size:16px;color:#854d0e;margin:0;">
          🎁 <strong>Cadou de reîntoarcere: 50 tokens bonus</strong><br>
          <span style="font-size:14px;">dacă îți reactivezi contul azi!</span>
        </p>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin:32px 0;">
        <a href="https://swaply.world/" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">
          Reactivează contul →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:20px 24px;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="font-size:12px;color:#9ca3af;margin:0;line-height:1.6;">
        Ai primit acest email deoarece ai un cont pe
        <a href="https://swaply.world" style="color:#16a34a;text-decoration:none;">swaply.world</a>.<br>
        <a href="https://swaply.world/settings" style="color:#9ca3af;text-decoration:underline;">Setări notificări</a> ·
        <a href="https://swaply.world/settings" style="color:#9ca3af;text-decoration:underline;">Dezabonare</a>
      </p>
      <p style="font-size:11px;color:#d1d5db;margin:8px 0 0;">
        © 2025 Swaply. Constanța, România.
      </p>
    </div>

  </div>
</body>
</html>`;
}

Deno.serve(async (_req: Request) => {
  try {
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set");
      return new Response(JSON.stringify({ error: "Missing API key" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find users inactive for ~30 days (between 30 and 31 days ago)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();

    const { data: inactiveProfiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, username, location_text, swap_preferences")
      .lt("updated_at", thirtyDaysAgo)
      .gt("updated_at", thirtyOneDaysAgo)
      .eq("is_banned", false)
      .limit(50);

    if (profilesError) {
      console.error("Error fetching inactive profiles:", profilesError);
      return new Response(JSON.stringify({ error: "Failed to fetch profiles" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!inactiveProfiles || inactiveProfiles.length === 0) {
      console.log("No inactive users found for reactivation emails");
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get live stats for the platform (last 30 days)
    const [newItemsResult, newUsersResult] = await Promise.all([
      supabase
        .from("items")
        .select("id", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo)
        .eq("is_active", true),
      supabase
        .from("profiles")
        .select("user_id", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo),
    ]);

    const totalNewItems = newItemsResult.count || 0;
    const totalNewUsers = newUsersResult.count || 0;

    let sentCount = 0;
    const errors: string[] = [];

    for (const profile of inactiveProfiles) {
      // Get user email from auth
      const { data: userData } = await supabase.auth.admin.getUserById(profile.user_id);
      const email = userData?.user?.email;
      if (!email) continue;

      const username = profile.username || "Utilizator";
      const city = profile.location_text || "";

      // Count items owned by user (for match estimation)
      const { count: userItemCount } = await supabase
        .from("items")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", profile.user_id)
        .eq("is_active", true);

      const matchCount = Math.max((userItemCount || 0) * 3, 5); // Estimate matches

      // Get new users from same city
      let cityUsersCount = totalNewUsers;
      if (city) {
        const { count } = await supabase
          .from("profiles")
          .select("user_id", { count: "exact", head: true })
          .gte("created_at", thirtyDaysAgo)
          .ilike("location_text", `%${city.split(",")[0].trim()}%`);
        cityUsersCount = count || totalNewUsers;
      }

      const subject = `Te-a ratat Swaply! 🥺 ${matchCount} match-uri noi te așteaptă`;

      const html = buildHtml({
        username,
        newItemsCount: totalNewItems,
        matchCount,
        newUsersCount: cityUsersCount,
        city: city.split(",")[0].trim(),
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
          to: [email],
          subject,
          html,
          headers: {
            "X-Entity-Ref-ID": profile.user_id,
            "List-Unsubscribe": "<https://swaply.world/settings>",
          },
        }),
      });

      const data = await res.json();
      if (res.ok) {
        sentCount++;
        console.log(`Reactivation email sent to ${email}, id: ${data.id}`);
      } else {
        errors.push(`${email}: ${JSON.stringify(data)}`);
        console.error(`Resend error for ${email}:`, JSON.stringify(data));
      }
    }

    console.log(`Reactivation emails: ${sentCount} sent, ${errors.length} errors`);
    return new Response(JSON.stringify({ success: true, sent: sentCount, errors: errors.length }), {
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
