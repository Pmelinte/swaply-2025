import { NextRequest, NextResponse } from "next/server";
import { getAllPostsDB } from "@/lib/blog-db";
import { getServerSupabase } from "@/lib/supabase/server";

type StoryDomain = "object" | "property" | "service" | "event" | "unknown";

type StoryPublicationRow = {
  story_id: string;
  revision: number;
  public_slug: string;
  title: string;
  body: string;
  published_at: string;
};

type PublicSupabase = Awaited<ReturnType<typeof getServerSupabase>>;

const MAX_STORIES = 5;
const STORY_POOL_SIZE = 24;
const DEFAULT_LOOKBACK_DAYS = 14;

function normalizeDomain(value: unknown): StoryDomain {
  if (value === "object" || value === "property" || value === "service" || value === "event") {
    return value;
  }
  return "unknown";
}

function safeSince(value: string | null): Date {
  if (value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date(Date.now() - DEFAULT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
}

function excerpt(value: string, max = 220) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length <= max ? normalized : `${normalized.slice(0, max - 1).trimEnd()}…`;
}

function selectDiverseStories<T extends { domain: StoryDomain; publishedAt: string }>(rows: T[]): T[] {
  const sorted = [...rows].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
  const selected: T[] = [];
  const seen = new Set<T>();

  for (const domain of ["object", "property", "service", "event"] as const) {
    const match = sorted.find((row) => row.domain === domain);
    if (match) {
      selected.push(match);
      seen.add(match);
    }
  }

  for (const row of sorted) {
    if (selected.length >= MAX_STORIES) break;
    if (!seen.has(row)) selected.push(row);
  }

  return selected.slice(0, MAX_STORIES);
}

async function deriveStoryDomains(publicClient: PublicSupabase, publications: StoryPublicationRow[]) {
  if (!publicClient || publications.length === 0) return new Map<string, StoryDomain>();

  const storyIds = publications.map((row) => row.story_id);
  const { data: stories } = await publicClient.from("stories").select("id, swap_id").in("id", storyIds);
  const swapIds = (stories ?? []).map((row) => String(row.swap_id)).filter(Boolean);
  if (swapIds.length === 0) return new Map<string, StoryDomain>();

  const { data: swaps } = await publicClient
    .from("swaps")
    .select("id, requester_item_id, responder_item_id")
    .in("id", swapIds);

  const itemIds = Array.from(
    new Set(
      (swaps ?? [])
        .flatMap((row) => [row.requester_item_id, row.responder_item_id])
        .filter(Boolean)
        .map(String),
    ),
  );

  const itemTypeById = new Map<string, StoryDomain>();
  if (itemIds.length > 0) {
    const { data: items } = await publicClient.from("items").select("id, listing_type").in("id", itemIds);
    for (const item of items ?? []) itemTypeById.set(String(item.id), normalizeDomain(item.listing_type));
  }

  const swapTypeById = new Map<string, StoryDomain>();
  for (const swap of swaps ?? []) {
    const first = swap.requester_item_id ? itemTypeById.get(String(swap.requester_item_id)) : undefined;
    const second = swap.responder_item_id ? itemTypeById.get(String(swap.responder_item_id)) : undefined;
    swapTypeById.set(String(swap.id), first && first !== "unknown" ? first : second ?? "unknown");
  }

  const result = new Map<string, StoryDomain>();
  for (const story of stories ?? []) {
    result.set(String(story.id), swapTypeById.get(String(story.swap_id)) ?? "unknown");
  }
  return result;
}

export async function GET(request: NextRequest) {
  const locale = (request.nextUrl.searchParams.get("locale") ?? "en").toLowerCase().split(/[-_]/)[0];
  const since = safeSince(request.nextUrl.searchParams.get("since"));
  const publicClient = await getServerSupabase();
  let publicationRows: StoryPublicationRow[] = [];

  if (publicClient) {
    const { data, error } = await publicClient
      .from("story_publications")
      .select("story_id, revision, public_slug, title, body, published_at")
      .eq("is_visible", true)
      .order("published_at", { ascending: false })
      .limit(STORY_POOL_SIZE);

    if (!error) publicationRows = (data ?? []) as StoryPublicationRow[];
  }

  const domains = await deriveStoryDomains(publicClient, publicationRows);
  const preparedStories = publicationRows.map((row) => ({
    slug: row.public_slug,
    title: row.title,
    excerpt: excerpt(row.body),
    domain: domains.get(row.story_id) ?? "unknown",
    publishedAt: row.published_at,
    isNew: new Date(row.published_at).getTime() > since.getTime(),
  }));
  const newStories = preparedStories.filter((row) => row.isNew);
  const storySource = newStories.length >= MAX_STORIES ? newStories : preparedStories;
  const stories = selectDiverseStories(storySource);

  const posts = (await getAllPostsDB(locale)).slice(0, 12);
  const blog = posts.slice(0, 3).map((post) => ({
    slug: post.slug,
    title: post.title,
    description: post.description,
    category: post.category,
    date: post.date,
    isNew: new Date(post.date).getTime() > since.getTime(),
  }));

  const featureUpdates = [
    { id: "stories", href: "/stories", releasedAt: "2026-07-31T00:00:00.000Z" },
  ].map((entry) => ({ ...entry, isNew: new Date(entry.releasedAt).getTime() > since.getTime() }));

  return NextResponse.json(
    { since: since.toISOString(), stories, blog, featureUpdates },
    { headers: { "Cache-Control": "private, max-age=0, must-revalidate" } },
  );
}
