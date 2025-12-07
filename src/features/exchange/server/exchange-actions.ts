// src/features/exchange/server/exchange-actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { exchangeRepository } from "./exchange-repository";
import type {
  Exchange,
  ExchangeStatus,
  ExchangeOfferItem,
} from "@/features/exchange/types";

/**
 * Returneaza user-ul autentificat sau arunca eroare
 */
async function requireUserId(): Promise<string> {
  const supabase = createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Not authenticated");
  }

  return user.id;
}

/**
 * Creeaza un proces de schimb pornind de la un match existent.
 *
 * - Verifica ca userul face parte din match
 * - Creeaza entry in `exchanges`
 * - Adauga un prim update in timeline
 */
export async function createExchangeAction(matchId: string): Promise<Exchange> {
  const userId = await requireUserId();
  const supabase = createServerClient();

  // luam match-ul direct din DB
  const { data: matchRow, error } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single();

  if (error || !matchRow) {
    console.error("createExchangeAction: match not found", error);
    throw new Error("Match-ul nu există.");
  }

  if (matchRow.user_a_id !== userId && matchRow.user_b_id !== userId) {
    throw new Error("Nu ai acces la acest match.");
  }

  const userAId: string = matchRow.user_a_id;
  const userBId: string = matchRow.user_b_id;

  const exchange = await exchangeRepository.createExchange(
    matchId,
    userAId,
    userBId,
  );

  // logăm un prim update
  await exchangeRepository.addUpdate(
    exchange.id,
    "offer_sent",
    "A fost inițiat un proces de schimb.",
  );

  revalidatePath("/exchanges");
  revalidatePath(`/matches/${matchId}`);

  return exchange;
}

/**
 * Returneaza un schimb complet (inclusiv oferte si timeline)
 * doar daca userul are acces la el.
 */
export async function getExchangeAction(
  exchangeId: string,
): Promise<Exchange | null> {
  const userId = await requireUserId();
  return exchangeRepository.getExchange(exchangeId, userId);
}

/**
 * Trimite o oferta de schimb in cadrul unui exchange existent.
 *
 * - Verifică accesul userului la exchange
 * - Determină celălalt user
 * - Trimite oferta
 * - Schimbă status-ul in "negotiating" (daca era pending)
 */
export async function sendOfferAction(
  exchangeId: string,
  offered: ExchangeOfferItem[],
  requested: ExchangeOfferItem[],
): Promise<void> {
  const userId = await requireUserId();

  const exchange = await exchangeRepository.ensureAccess(exchangeId, userId);
  if (!exchange) {
    throw new Error("Nu ai acces la acest proces de schimb.");
  }

  const otherUserId =
    exchange.userAId === userId ? exchange.userBId : exchange.userAId;

  await exchangeRepository.sendOffer(
    exchangeId,
    userId,
    otherUserId,
    offered,
    requested,
  );

  // daca era pending, il trecem in negotiating
  if (exchange.status === "pending") {
    await exchangeRepository.updateStatus(exchangeId, "negotiating");
  }

  revalidatePath(`/exchanges/${exchangeId}`);
}

/**
 * Actualizeaza status-ul unui exchange (API generic)
 */
export async function updateExchangeStatusAction(
  exchangeId: string,
  status: ExchangeStatus,
  message?: string,
): Promise<void> {
  const userId = await requireUserId();

  const exchange = await exchangeRepository.ensureAccess(exchangeId, userId);
  if (!exchange) {
    throw new Error("Nu ai acces la acest proces de schimb.");
  }

  await exchangeRepository.updateStatus(exchangeId, status);

  let defaultMessage: string | undefined;

  switch (status) {
    case "accepted":
      defaultMessage = "Oferta a fost acceptată.";
      await exchangeRepository.addUpdate(exchangeId, "offer_accepted", defaultMessage);
      break;
    case "cancelled":
      defaultMessage = "Schimbul a fost anulat.";
      await exchangeRepository.addUpdate(
        exchangeId,
        "cancelled",
        message ?? defaultMessage,
      );
      break;
    case "shipping":
      defaultMessage = "Procesul de livrare a început.";
      await exchangeRepository.addUpdate(
        exchangeId,
        "shipping_started",
        message ?? defaultMessage,
      );
      break;
    case "completed":
      defaultMessage = "Schimbul a fost finalizat.";
      await exchangeRepository.addUpdate(
        exchangeId,
        "completed",
        message ?? defaultMessage,
      );
      break;
    case "negotiating":
      defaultMessage = "Se negociază termenii schimbului.";
      await exchangeRepository.addUpdate(
        exchangeId,
        "offer_sent",
        message ?? defaultMessage,
      );
      break;
    case "pending":
    default:
      // pentru pending nu adaugam nimic special
      break;
  }

  revalidatePath(`/exchanges/${exchangeId}`);
  revalidatePath("/exchanges");
}

/**
 * Helper pentru acceptarea unei oferte (wrapper peste updateExchangeStatusAction)
 */
export async function acceptExchangeAction(
  exchangeId: string,
): Promise<void> {
  await updateExchangeStatusAction(exchangeId, "accepted");
}

/**
 * Helper pentru anularea unui schimb
 */
export async function cancelExchangeAction(
  exchangeId: string,
  reason?: string,
): Promise<void> {
  await updateExchangeStatusAction(exchangeId, "cancelled", reason);
}
