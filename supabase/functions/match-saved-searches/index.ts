import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  filters: {
    category?: string | null;
    city?: string | null;
    keywords?: string | null;
    listingType?: string | null;
    condition?: string | null;
  };
  last_checked_at: string;
}

interface NewItem {
  id: string;
  title: string;
  category: string;
  condition: string;
  location: string | null;
  description: string | null;
  listing_type: string | null;
  owner_id: string;
}

interface UserProfile {
  email: string;
  display_name: string;
  notification_email: boolean;
}

function itemMatchesFilters(
  item: NewItem,
  filters: SavedSearch["filters"],
): boolean {
  if (filters.category && item.category !== filters.category) return false;

  if (filters.condition && item.condition !== filters.condition) return false;

  if (filters.listingType && (item.listing_type ?? "object") !== filters.listingType) return false;

  if (filters.city) {
    const cityLower = filters.city.toLowerCase();
    if (!item.location?.toLowerCase().includes(cityLower)) return false;
  }

  if (filters.keywords) {
    const kw = filters.keywords.toLowerCase();
    const haystack = `${item.title} ${item.description ?? ""} ${item.category}`.toLowerCase();
    if (!haystack.includes(kw)) return false;
  }

  return true;
}

function buildEmailHtml(userName: string, searchName: string, itemCount: number): string {
  return `<!DOCTYPE html>
<html lang="ro">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:32px 24px;text-align:center;">
      <h1 style="color:#fff;font-size:24px;margin:0;">🔔 Alerte noi pe Swaply</h1>
    </div>
    <div style="padding:32px 24px;">
      <p style="font-size:16px;color:#4a4a4a;line-height:1.6;">
        Salut <strong>${userName}</strong>! Au apărut <strong>${itemCount}</strong> obiecte noi
        care corespund alertei tale <strong>"${searchName}"</strong>.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="https://swaply.world/objects" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">
          Vezi obiectele noi →
        </a>
      </div>
    </div>
    <div style="background:#f9fafb;padding:20px 24px;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="font-size:12px;color:#9ca3af;margin:0;">
        Poți dezactiva alertele din <a href="https://swaply.world/profile" style="color:#2563eb;text-decoration:none;">profilul tău</a>.
      </p>
    </div>
  </div>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get the new item from the webhook payload, or run as a cron for all recent items
    let newItems: NewItem[] = [];

    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      if (body.record) {
        // Triggered by database webhook on insert
        newItems = [{
          id: body.record.id,
          title: body.record.title,
          category: body.record.category,
          condition: body.record.condition,
          location: body.record.location,
          description: body.record.description,
          listing_type: body.record.listing_type,
          owner_id: body.record.owner_id,
        }];
      }
    }

    // If no specific item, check items created in the last hour (cron mode)
    if (newItems.length === 0) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data } = await sb
        .from("items")
        .select("id, title, category, condition, location, description, listing_type, owner_id")
        .gte("created_at", oneHourAgo)
        .eq("is_active", true);
      newItems = data ?? [];
    }

    if (newItems.length === 0) {
      return new Response(JSON.stringify({ matched: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch all active saved searches
    const { data: savedSearches } = await sb
      .from("saved_searches")
      .select("*")
      .eq("alert_enabled", true);

    if (!savedSearches || savedSearches.length === 0) {
      return new Response(JSON.stringify({ matched: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    let totalMatches = 0;
    const userNotifications = new Map<string, { search: SavedSearch; count: number }[]>();

    for (const search of savedSearches as SavedSearch[]) {
      const matchingItems = newItems.filter(
        (item) => item.owner_id !== search.user_id && itemMatchesFilters(item, search.filters),
      );

      if (matchingItems.length === 0) continue;

      // Insert notifications
      const notifications = matchingItems.map((item) => ({
        saved_search_id: search.id,
        item_id: item.id,
      }));

      await sb.from("saved_search_notifications").insert(notifications);
      totalMatches += matchingItems.length;

      // Track for email
      const existing = userNotifications.get(search.user_id) ?? [];
      existing.push({ search, count: matchingItems.length });
      userNotifications.set(search.user_id, existing);
    }

    // Update last_checked_at for all processed searches
    const searchIds = savedSearches.map((s: SavedSearch) => s.id);
    await sb
      .from("saved_searches")
      .update({ last_checked_at: new Date().toISOString() })
      .in("id", searchIds);

    // Send email notifications
    if (RESEND_API_KEY && userNotifications.size > 0) {
      const userIds = [...userNotifications.keys()];
      const { data: profiles } = await sb
        .from("profiles")
        .select("id, email, display_name, notification_email")
        .in("id", userIds);

      for (const profile of (profiles ?? []) as (UserProfile & { id: string })[]) {
        if (!profile.notification_email || !profile.email) continue;

        const searches = userNotifications.get(profile.id);
        if (!searches) continue;

        // Send one email per user with their first alert's info
        const firstSearch = searches[0];
        const totalCount = searches.reduce((sum, s) => sum + s.count, 0);

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Swaply <noreply@swaply.world>",
            reply_to: "support@swaply.world",
            to: [profile.email],
            subject: `🔔 ${totalCount} obiecte noi pentru alerta "${firstSearch.search.name}"`,
            html: buildEmailHtml(
              profile.display_name || "Utilizator",
              firstSearch.search.name,
              totalCount,
            ),
          }),
        });
      }
    }

    return new Response(
      JSON.stringify({ matched: totalMatches, searches_checked: savedSearches.length }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("match-saved-searches error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
