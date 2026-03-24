/**
 * Item-level analytics tracking.
 * Tracks views, favorites, swap proposals, etc. per item.
 */
import { getSupabaseClient } from "./supabase/client";
import { logger } from "./logger";

export type ItemEventType =
  | "view"
  | "favorite"
  | "unfavorite"
  | "inquiry"
  | "match"
  | "swap_proposed"
  | "swap_accepted"
  | "swap_completed";

/**
 * Track an item-level analytics event.
 * Fire-and-forget — never blocks UI.
 */
export function trackItemEvent(
  itemId: string,
  eventType: ItemEventType,
  visitorId?: string | null,
): void {
  if (!itemId) return;

  const supabase = getSupabaseClient();
  if (!supabase) return;

  supabase
    .from("item_analytics")
    .insert({
      item_id: itemId,
      event_type: eventType,
      visitor_id: visitorId ?? null,
    })
    .then(({ error }) => {
      if (error) {
        logger.debug("item_analytics insert failed", { error: error.message, itemId, eventType });
      }
    });
}

/** Summary stats returned by the analytics dashboard query */
export interface ItemAnalyticsSummary {
  itemId: string;
  title: string;
  photo: string | null;
  views: number;
  favorites: number;
  proposals: number;
}

export interface UserAnalyticsSummary {
  totalViews: number;
  totalFavorites: number;
  totalProposals: number;
  totalAccepted: number;
  totalCompleted: number;
  conversionRate: number; // proposals / views * 100
  avgDaysToProposal: number;
  viewsByDay: { date: string; count: number }[];
  topItems: ItemAnalyticsSummary[];
}

/**
 * Fetch analytics summary for a user's items (last 30 days).
 * Runs on client, requires authenticated user.
 */
export async function fetchUserAnalytics(userId: string): Promise<UserAnalyticsSummary | null> {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) return null;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const since = thirtyDaysAgo.toISOString();

  // Get all user's item IDs
  const { data: userItems, error: itemsErr } = await supabase
    .from("items")
    .select("id, title, photos")
    .eq("owner_id", userId);

  if (itemsErr || !userItems || userItems.length === 0) return null;

  const itemIds = userItems.map((i: { id: string }) => i.id);

  // Fetch all analytics events for these items in last 30 days
  const { data: events, error: eventsErr } = await supabase
    .from("item_analytics")
    .select("item_id, event_type, created_at")
    .in("item_id", itemIds)
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  if (eventsErr || !events) return null;

  // Aggregate totals
  let totalViews = 0;
  let totalFavorites = 0;
  let totalProposals = 0;
  let totalAccepted = 0;
  let totalCompleted = 0;
  const viewDayCounts: Record<string, number> = {};
  const itemCounts: Record<string, { views: number; favorites: number; proposals: number }> = {};
  const firstView: Record<string, string> = {};
  const proposalDates: string[] = [];

  for (const ev of events as Array<{ item_id: string; event_type: string; created_at: string }>) {
    const iid = ev.item_id;
    if (!itemCounts[iid]) itemCounts[iid] = { views: 0, favorites: 0, proposals: 0 };

    switch (ev.event_type) {
      case "view":
        totalViews++;
        itemCounts[iid].views++;
        if (!firstView[iid]) firstView[iid] = ev.created_at;
        {
          const day = ev.created_at.slice(0, 10);
          viewDayCounts[day] = (viewDayCounts[day] ?? 0) + 1;
        }
        break;
      case "favorite":
        totalFavorites++;
        itemCounts[iid].favorites++;
        break;
      case "swap_proposed":
        totalProposals++;
        itemCounts[iid].proposals++;
        proposalDates.push(ev.created_at);
        break;
      case "swap_accepted":
        totalAccepted++;
        break;
      case "swap_completed":
        totalCompleted++;
        break;
    }
  }

  // Views by day (fill gaps)
  const viewsByDay: { date: string; count: number }[] = [];
  const cursor = new Date(thirtyDaysAgo);
  const today = new Date();
  while (cursor <= today) {
    const day = cursor.toISOString().slice(0, 10);
    viewsByDay.push({ date: day, count: viewDayCounts[day] ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  // Avg days to proposal
  let avgDaysToProposal = 0;
  if (proposalDates.length > 0 && Object.keys(firstView).length > 0) {
    let totalDays = 0;
    let counted = 0;
    for (const pDate of proposalDates) {
      // Find earliest view for any item
      const earliest = Object.values(firstView).sort()[0];
      if (earliest) {
        const diff = (new Date(pDate).getTime() - new Date(earliest).getTime()) / (1000 * 60 * 60 * 24);
        totalDays += Math.max(0, diff);
        counted++;
      }
    }
    avgDaysToProposal = counted > 0 ? Math.round((totalDays / counted) * 10) / 10 : 0;
  }

  // Top 5 items by views
  const topItems: ItemAnalyticsSummary[] = Object.entries(itemCounts)
    .sort(([, a], [, b]) => b.views - a.views)
    .slice(0, 5)
    .map(([iid, counts]) => {
      const item = userItems.find((i: { id: string }) => i.id === iid);
      const photos = Array.isArray(item?.photos) ? item.photos : [];
      const firstPhoto = typeof photos[0] === "string" ? photos[0] : (photos[0] as { url?: string })?.url ?? null;
      return {
        itemId: iid,
        title: String(item?.title ?? "Unknown"),
        photo: firstPhoto ? String(firstPhoto) : null,
        views: counts.views,
        favorites: counts.favorites,
        proposals: counts.proposals,
      };
    });

  const conversionRate = totalViews > 0 ? Math.round((totalProposals / totalViews) * 1000) / 10 : 0;

  return {
    totalViews,
    totalFavorites,
    totalProposals,
    totalAccepted,
    totalCompleted,
    conversionRate,
    avgDaysToProposal,
    viewsByDay,
    topItems,
  };
}

/** Generate automated insights based on analytics data */
export interface AnalyticsInsight {
  icon: string;
  message: string;
  type: "positive" | "tip" | "info";
}

export function generateInsights(
  summary: UserAnalyticsSummary,
  totalUserItems: number,
): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [];

  // Average views per item
  const avgViews = totalUserItems > 0 ? summary.totalViews / totalUserItems : 0;

  // High-performing items
  for (const item of summary.topItems) {
    if (item.views > avgViews * 3 && avgViews > 0) {
      insights.push({
        icon: "\u{1F4C8}",
        message: `"${item.title}" are 3x mai multe views dec\u00E2t media obiectelor tale`,
        type: "positive",
      });
      break; // Only show one
    }
  }

  // Photo tip
  if (summary.topItems.length > 0) {
    const withPhotos = summary.topItems.filter((i) => i.photo);
    if (withPhotos.length < summary.topItems.length) {
      insights.push({
        icon: "\u{1F4A1}",
        message: "Obiectele cu poze primesc de 4x mai multe propuneri",
        type: "tip",
      });
    }
  }

  // Peak activity detection
  if (summary.viewsByDay.length > 0) {
    let maxDay = summary.viewsByDay[0];
    for (const d of summary.viewsByDay) {
      if (d.count > maxDay.count) maxDay = d;
    }
    if (maxDay.count > 0) {
      const dayDate = new Date(maxDay.date);
      const dayNames = ["Duminic\u0103", "Luni", "Mar\u021Bi", "Miercuri", "Joi", "Vineri", "S\u00E2mb\u0103t\u0103"];
      insights.push({
        icon: "\u23F0",
        message: `Cea mai activ\u0103 zi: ${dayNames[dayDate.getDay()]} (${maxDay.count} views)`,
        type: "info",
      });
    }
  }

  // Conversion rate insight
  if (summary.conversionRate > 10) {
    insights.push({
      icon: "\u{1F525}",
      message: `Rata de conversie de ${summary.conversionRate}% este excelent\u0103!`,
      type: "positive",
    });
  } else if (summary.conversionRate > 0 && summary.conversionRate < 3) {
    insights.push({
      icon: "\u{1F4A1}",
      message: "Adaug\u0103 descrieri mai detaliate pentru a cre\u0219te rata de propuneri",
      type: "tip",
    });
  }

  // Favorites to proposals
  if (summary.totalFavorites > 10 && summary.totalProposals === 0) {
    insights.push({
      icon: "\u{1F4A1}",
      message: `Ai ${summary.totalFavorites} favorite dar 0 propuneri \u2014 \u00EEncearc\u0103 s\u0103 actualizezi wishlist-ul`,
      type: "tip",
    });
  }

  return insights;
}
