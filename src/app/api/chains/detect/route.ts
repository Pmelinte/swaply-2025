/**
 * /api/chains/detect — Detect potential chain swap opportunities
 * GET: find circular chains among active items
 *
 * Algorithm: For each pair (A→B), check if B wants something from C,
 * and C wants something from A → 3-way chain detected.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getClients(token: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const db = serviceKey
    ? createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
    : userClient;
  return { userClient, db };
}

export interface DetectedChain {
  participants: Array<{
    userId: string;
    userName: string;
    givesItemId: string;
    givesItemTitle: string;
    receivesItemId: string;
    receivesItemTitle: string;
  }>;
  score: number;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  const clients = getClients(token);
  if (!clients) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

  const { userClient, db } = clients;
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch all active items with owner info
  const { data: items, error: itemsError } = await db
    .from("objects")
    .select("id, owner_id, title, category, status, images")
    .eq("status", "active")
    .limit(500);

  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });
  if (!items || items.length < 3) {
    return NextResponse.json({ chains: [] });
  }

  // Fetch user display names
  const ownerIds = [...new Set(items.map((i: { owner_id: string }) => i.owner_id))];
  const { data: profiles } = await db
    .from("public_profiles")
    .select("user_id, display_name")
    .in("user_id", ownerIds);

  const nameMap = new Map<string, string>();
  for (const p of profiles ?? []) {
    nameMap.set(p.user_id, p.display_name || "User");
  }

  // Build item-by-owner map
  type SimpleItem = { id: string; owner_id: string; title: string; category: string; images: string[]; wishlist?: string };
  const itemsByOwner = new Map<string, SimpleItem[]>();
  for (const item of items as SimpleItem[]) {
    const list = itemsByOwner.get(item.owner_id) ?? [];
    list.push(item);
    itemsByOwner.set(item.owner_id, list);
  }

  // Check wishlist match
  function wishlistMatchesCategory(wishlist: string | undefined, category: string): boolean {
    if (!wishlist || !category) return false;
    const w = wishlist.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const c = category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return w.includes(c);
  }

  // My items
  const myItems = (items as SimpleItem[]).filter((i) => i.owner_id === user.id);
  const otherItems = (items as SimpleItem[]).filter((i) => i.owner_id !== user.id);

  const detectedChains: DetectedChain[] = [];
  const seen = new Set<string>();

  // For each of my items (A), find B who wants A's category and has something I want
  for (const myItem of myItems) {
    // Find items from B that I want (my wishlist matches B's category)
    const bCandidates = otherItems.filter((bItem) =>
      wishlistMatchesCategory(myItem.wishlist, bItem.category),
    );

    for (const bItem of bCandidates) {
      // B wants something — find items from C that B wants
      const cCandidates = otherItems.filter((cItem) =>
        cItem.owner_id !== myItem.owner_id &&
        cItem.owner_id !== bItem.owner_id &&
        wishlistMatchesCategory(bItem.wishlist, cItem.category),
      );

      for (const cItem of cCandidates) {
        // Does C want what A (me) offers?
        if (wishlistMatchesCategory(cItem.wishlist, myItem.category)) {
          // Chain found: A gives myItem to C, B gives bItem to A, C gives cItem to B
          // Wait — the chain is: A→B (A gives to B), B→C (B gives to C), C→A (C gives to A)
          // A gives myItem → gets bItem, B gives bItem → gets cItem, C gives cItem → gets myItem
          const key = [myItem.id, bItem.id, cItem.id].sort().join("_");
          if (seen.has(key)) continue;
          seen.add(key);

          // Score based on match quality
          let score = 60; // base
          if (myItem.category === bItem.category) score += 10;
          if (bItem.category === cItem.category) score += 10;
          score += 20; // circular match bonus

          detectedChains.push({
            participants: [
              {
                userId: myItem.owner_id,
                userName: nameMap.get(myItem.owner_id) ?? "User",
                givesItemId: myItem.id,
                givesItemTitle: myItem.title,
                receivesItemId: bItem.id,
                receivesItemTitle: bItem.title,
              },
              {
                userId: bItem.owner_id,
                userName: nameMap.get(bItem.owner_id) ?? "User",
                givesItemId: bItem.id,
                givesItemTitle: bItem.title,
                receivesItemId: cItem.id,
                receivesItemTitle: cItem.title,
              },
              {
                userId: cItem.owner_id,
                userName: nameMap.get(cItem.owner_id) ?? "User",
                givesItemId: cItem.id,
                givesItemTitle: cItem.title,
                receivesItemId: myItem.id,
                receivesItemTitle: myItem.title,
              },
            ],
            score,
          });
        }
      }
    }
  }

  // Sort by score descending, limit to top 10
  detectedChains.sort((a, b) => b.score - a.score);
  return NextResponse.json({ chains: detectedChains.slice(0, 10) });
}
