import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getServerSupabase } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/service";
import { rateLimit } from "@/lib/rate-limit";
import {
  buildSwapProposalEmail,
  canSendSwapProposalEmail,
} from "@/lib/notifications/swapProposalEmail";
import { resolveProfilePreferredLocale } from "@/lib/i18n/languageFallback";

const FROM_EMAIL = process.env.EMAIL_FROM || "Swaply <noreply@swaply.world>";
const PUBLIC_APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://www.swaply.world";

type SwapRow = {
  id: string;
  requester_id: string;
  responder_id: string;
  offered_item_id: string | null;
  requested_item_id: string | null;
  status: string;
};

type ProfileRow = {
  user_id: string;
  display_name: string | null;
  email: string | null;
  primary_language: string | null;
  secondary_language: string | null;
  tertiary_language: string | null;
  preferred_locale: string | null;
};

type ItemRow = {
  id: string;
  title: string | null;
};

export async function POST(request: Request) {
  const sessionSupabase = await getServerSupabase();
  if (!sessionSupabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const {
    data: { user: authUser },
  } = await sessionSupabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (!rateLimit(authUser.id, { limit: 5, windowMs: 60_000 }).allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const swapId =
    typeof body === "object" && body !== null && "swapId" in body
      ? (body as { swapId?: unknown }).swapId
      : undefined;

  if (typeof swapId !== "string" || swapId.trim().length === 0) {
    return NextResponse.json({ error: "Invalid swapId" }, { status: 400 });
  }

  const serviceSupabase = getServiceSupabase();
  if (!serviceSupabase) {
    return NextResponse.json(
      { error: "Transactional email authority unavailable" },
      { status: 503 },
    );
  }

  const { data: swapData, error: swapError } = await serviceSupabase
    .from("swaps")
    .select(
      "id, requester_id, responder_id, offered_item_id, requested_item_id, status",
    )
    .eq("id", swapId.trim())
    .maybeSingle();

  if (swapError) {
    console.error("[email/swap-proposal] swap lookup failed", swapError);
    return NextResponse.json(
      { error: "Transactional email context unavailable" },
      { status: 503 },
    );
  }

  if (!swapData) {
    return NextResponse.json({ error: "Swap not found" }, { status: 404 });
  }

  const swap = swapData as SwapRow;
  if (
    !canSendSwapProposalEmail({
      actorId: authUser.id,
      requesterId: swap.requester_id,
      responderId: swap.responder_id,
      status: swap.status,
    })
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const profileIds = [swap.requester_id, swap.responder_id];
  const itemIds = [swap.offered_item_id, swap.requested_item_id].filter(
    Boolean,
  ) as string[];

  const [
    { data: profilesData, error: profilesError },
    { data: itemsData, error: itemsError },
  ] = await Promise.all([
    serviceSupabase
      .from("profiles")
      .select(
        "user_id, display_name, email, primary_language, secondary_language, tertiary_language, preferred_locale",
      )
      .in("user_id", profileIds),
    serviceSupabase.from("items").select("id, title").in("id", itemIds),
  ]);

  if (profilesError || itemsError) {
    console.error("[email/swap-proposal] context lookup failed", {
      profilesError,
      itemsError,
    });
    return NextResponse.json(
      { error: "Transactional email context unavailable" },
      { status: 503 },
    );
  }

  const profiles = (profilesData ?? []) as ProfileRow[];
  const items = (itemsData ?? []) as ItemRow[];
  const requester = profiles.find((row) => row.user_id === swap.requester_id);
  const responder = profiles.find((row) => row.user_id === swap.responder_id);
  const offeredItem = items.find((row) => row.id === swap.offered_item_id);
  const requestedItem = items.find((row) => row.id === swap.requested_item_id);

  if (!requester || !responder?.email) {
    return NextResponse.json({ error: "Recipient unavailable" }, { status: 404 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Transactional email provider unavailable" },
      { status: 503 },
    );
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const email = buildSwapProposalEmail({
    appUrl: PUBLIC_APP_URL,
    locale: resolveProfilePreferredLocale(responder),
    swapId: swap.id,
    recipientName: responder.display_name || "Swaply user",
    senderName: requester.display_name || "Swaply user",
    requesterItemTitle: offeredItem?.title || "an item",
    responderItemTitle: requestedItem?.title || "your item",
  });

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: responder.email,
      subject: email.subject,
      html: email.html,
    });

    if (error) {
      console.error("[email/swap-proposal] provider error", error);
      return NextResponse.json({ error: "Email sending failed" }, { status: 502 });
    }

    return NextResponse.json({ ok: true, sent: true });
  } catch (error) {
    console.error("[email/swap-proposal] provider exception", error);
    return NextResponse.json({ error: "Email sending failed" }, { status: 502 });
  }
}
