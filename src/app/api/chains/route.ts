/**
 * /api/chains — CRUD for swap chains
 * GET: list chains for current user
 * POST: create a new chain with links
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getClients(token: string) {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
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

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  const clients = getClients(token);
  if (!clients) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

  const { userClient, db } = clients;
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get chains where user is participant
  const { data: links } = await db
    .from("swap_chain_links")
    .select("chain_id")
    .or(`giver_id.eq.${user.id},receiver_id.eq.${user.id}`);

  const chainIds = [...new Set((links ?? []).map((l: { chain_id: string }) => l.chain_id))];

  // Also include chains created by user
  const { data: createdChains } = await db
    .from("swap_chains")
    .select("id")
    .eq("created_by", user.id);

  const allChainIds = [...new Set([...chainIds, ...(createdChains ?? []).map((c: { id: string }) => c.id)])];

  if (allChainIds.length === 0) {
    return NextResponse.json({ chains: [] });
  }

  const { data: chains, error } = await db
    .from("swap_chains")
    .select("*")
    .in("id", allChainIds)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch all links for these chains
  const { data: allLinks } = await db
    .from("swap_chain_links")
    .select("*")
    .in("chain_id", allChainIds)
    .order("position", { ascending: true });

  // Combine
  const chainsWithLinks = (chains ?? []).map((chain: Record<string, unknown>) => ({
    ...chain,
    links: (allLinks ?? []).filter((l: { chain_id: string }) => l.chain_id === chain.id),
  }));

  return NextResponse.json({ chains: chainsWithLinks });
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  const clients = getClients(token);
  if (!clients) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

  const { userClient, db } = clients;
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    name?: string;
    links?: Array<{
      position: number;
      giverId: string;
      receiverId: string;
      itemId: string;
      itemTitle?: string;
      giverName?: string;
      receiverName?: string;
    }>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, links } = body;
  if (!links || links.length < 2) {
    return NextResponse.json({ error: "At least 2 links required" }, { status: 400 });
  }

  // Validate chain is circular: last receiver === first giver
  const firstGiver = links[0].giverId;
  const lastReceiver = links[links.length - 1].receiverId;
  if (firstGiver !== lastReceiver) {
    return NextResponse.json({ error: "Chain must be circular" }, { status: 400 });
  }

  // Create chain
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
  const { data: chain, error: chainError } = await db
    .from("swap_chains")
    .insert({
      name: name || "Lanț de schimb",
      status: "forming",
      created_by: user.id,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (chainError || !chain) {
    return NextResponse.json({ error: chainError?.message ?? "Failed to create chain" }, { status: 500 });
  }

  // Insert links
  const linkRows = links.map((link) => ({
    chain_id: chain.id,
    position: link.position,
    giver_id: link.giverId,
    receiver_id: link.receiverId,
    item_id: link.itemId,
    confirmed: link.giverId === user.id, // Auto-confirm initiator's link
    confirmed_at: link.giverId === user.id ? new Date().toISOString() : null,
  }));

  const { data: insertedLinks, error: linksError } = await db
    .from("swap_chain_links")
    .insert(linkRows)
    .select();

  if (linksError) {
    return NextResponse.json({ error: linksError.message }, { status: 500 });
  }

  // Notify all participants except creator
  const participantIds = [...new Set(links.flatMap((l) => [l.giverId, l.receiverId]))].filter((id) => id !== user.id);
  for (const participantId of participantIds) {
    await db.from("notifications").insert({
      user_id: participantId,
      type: "chain_invite",
      title: "Chain swap invitation",
      message: `You've been invited to a chain swap: ${chain.name}`,
      read: false,
      priority: "high",
    }).then(({ error: notifErr }) => {
      if (notifErr) console.error("[chains] notification error:", notifErr.message);
    });
  }

  return NextResponse.json({
    chain: { ...chain, links: insertedLinks ?? [] },
  }, { status: 201 });
}
