/**
 * /api/chains/confirm — Confirm participation in a chain link
 * POST: { chainId, linkId, action: "confirm" | "start" | "complete" | "cancel" }
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

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  const clients = getClients(token);
  if (!clients) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

  const { userClient, db } = clients;
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { chainId?: string; linkId?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { chainId, linkId, action } = body;
  if (!chainId || !action) {
    return NextResponse.json({ error: "chainId and action required" }, { status: 400 });
  }

  // Fetch chain
  const { data: chain, error: chainError } = await db
    .from("swap_chains")
    .select("*")
    .eq("id", chainId)
    .single();

  if (chainError || !chain) {
    return NextResponse.json({ error: "Chain not found" }, { status: 404 });
  }

  // Fetch all links
  const { data: links } = await db
    .from("swap_chain_links")
    .select("*")
    .eq("chain_id", chainId)
    .order("position", { ascending: true });

  const allLinks = links ?? [];

  switch (action) {
    case "confirm": {
      if (!linkId) return NextResponse.json({ error: "linkId required for confirm" }, { status: 400 });
      if (chain.status !== "forming") {
        return NextResponse.json({ error: "Chain is not in forming status" }, { status: 400 });
      }

      const link = allLinks.find((l: { id: string }) => l.id === linkId);
      if (!link) return NextResponse.json({ error: "Link not found" }, { status: 404 });
      if (link.giver_id !== user.id && link.receiver_id !== user.id) {
        return NextResponse.json({ error: "Not your link to confirm" }, { status: 403 });
      }

      // Confirm the link
      await db.from("swap_chain_links").update({
        confirmed: true,
        confirmed_at: new Date().toISOString(),
      }).eq("id", linkId);

      // Check if all links are confirmed → auto-lock
      const updatedLinks = allLinks.map((l: { id: string; confirmed: boolean }) =>
        l.id === linkId ? { ...l, confirmed: true } : l,
      );
      const allConfirmed = updatedLinks.every((l: { confirmed: boolean }) => l.confirmed);

      if (allConfirmed) {
        await db.from("swap_chains").update({
          status: "locked",
          updated_at: new Date().toISOString(),
        }).eq("id", chainId);

        // Notify all participants
        const participantIds = [...new Set(allLinks.flatMap((l: { giver_id: string; receiver_id: string }) => [l.giver_id, l.receiver_id]))];
        for (const pid of participantIds) {
          await db.from("notifications").insert({
            user_id: pid,
            type: "chain_locked",
            title: "Chain swap locked",
            message: `All participants confirmed! Chain "${chain.name}" is ready to start.`,
            read: false,
          }).then(({ error: e }) => { if (e) console.error("[chains/confirm] notif error:", e.message); });
        }
      }

      return NextResponse.json({ confirmed: true, allConfirmed, status: allConfirmed ? "locked" : "forming" });
    }

    case "start": {
      if (chain.created_by !== user.id) {
        return NextResponse.json({ error: "Only initiator can start chain" }, { status: 403 });
      }
      if (chain.status !== "locked") {
        return NextResponse.json({ error: "Chain must be locked before starting" }, { status: 400 });
      }

      await db.from("swap_chains").update({
        status: "in_progress",
        updated_at: new Date().toISOString(),
      }).eq("id", chainId);

      return NextResponse.json({ status: "in_progress" });
    }

    case "complete": {
      if (chain.status !== "in_progress") {
        return NextResponse.json({ error: "Chain must be in progress" }, { status: 400 });
      }

      // Only allow if all links confirmed
      const everyConfirmed = allLinks.every((l: { confirmed: boolean }) => l.confirmed);
      if (!everyConfirmed) {
        return NextResponse.json({ error: "Not all links confirmed" }, { status: 400 });
      }

      await db.from("swap_chains").update({
        status: "completed",
        updated_at: new Date().toISOString(),
      }).eq("id", chainId);

      // Notify all participants
      const participantIds = [...new Set(allLinks.flatMap((l: { giver_id: string; receiver_id: string }) => [l.giver_id, l.receiver_id]))];
      for (const pid of participantIds) {
        await db.from("notifications").insert({
          user_id: pid,
          type: "chain_completed",
          title: "Chain swap completed!",
          message: `Chain "${chain.name}" has been completed successfully.`,
          read: false,
        }).then(({ error: e }) => { if (e) console.error("[chains/confirm] notif error:", e.message); });
      }

      return NextResponse.json({ status: "completed" });
    }

    case "cancel": {
      if (chain.status === "completed" || chain.status === "cancelled") {
        return NextResponse.json({ error: "Chain already finalized" }, { status: 400 });
      }

      // Only creator or participants can cancel
      const isParticipant = allLinks.some(
        (l: { giver_id: string; receiver_id: string }) => l.giver_id === user.id || l.receiver_id === user.id,
      );
      if (chain.created_by !== user.id && !isParticipant) {
        return NextResponse.json({ error: "Not authorized to cancel" }, { status: 403 });
      }

      await db.from("swap_chains").update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      }).eq("id", chainId);

      return NextResponse.json({ status: "cancelled" });
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}
