// src/features/exchange/server/exchange-repository.ts

import { createServerClient } from "@/lib/supabase/server";
import type {
  Exchange,
  ExchangeOffer,
  ExchangeUpdate,
  ExchangeStatus,
  ExchangeOfferItem,
} from "@/features/exchange/types";

/**
 * Map DB → ExchangeUpdate
 */
const mapDbUpdate = (row: any): ExchangeUpdate => ({
  id: row.id,
  exchangeId: row.exchange_id,
  type: row.type,
  message: row.message,
  createdAt: row.created_at,
});

/**
 * Map DB → ExchangeOffer
 */
const mapDbOffer = (row: any): ExchangeOffer => ({
  fromUserId: row.from_user_id,
  toUserId: row.to_user_id,
  itemsOffered: row.items_offered ?? [],
  itemsRequested: row.items_requested ?? [],
  createdAt: row.created_at,
});

/**
 * Map DB → Exchange (fără oferte și updates)
 */
const mapDbExchange = (row: any): Exchange => ({
  id: row.id,
  userAId: row.user_a_id,
  userBId: row.user_b_id,
  status: row.status,
  offers: [], // se completează ulterior
  updates: [], // se completează ulterior
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const exchangeRepository = {
  /**
   * Creează un schimb nou pornind de la un match.
   */
  async createExchange(matchId: string, userAId: string, userBId: string): Promise<Exchange> {
    const supabase = createServerClient();

    const payload = {
      match_id: matchId,
      user_a_id: userAId,
      user_b_id: userBId,
      status: "pending" as ExchangeStatus,
    };

    const { data, error } = await supabase
      .from("exchanges")
      .insert(payload)
      .select("*")
      .single();

    if (error || !data) {
      console.error("createExchange error:", error);
      throw new Error("Nu am putut crea procesul de schimb.");
    }

    return mapDbExchange(data);
  },

  /**
   * Verifică dacă userul participă la acest schimb.
   */
  async ensureAccess(exchangeId: string, userId: string): Promise<Exchange | null> {
    const supabase = createServerClient();

    const { data: row, error } = await supabase
      .from("exchanges")
      .select("*")
      .eq("id", exchangeId)
      .single();

    if (error || !row) return null;

    if (row.user_a_id !== userId && row.user_b_id !== userId) {
      return null;
    }

    return mapDbExchange(row);
  },

  /**
   * Returnează schimbul complet (cu oferte și updates).
   */
  async getExchange(exchangeId: string, userId: string): Promise<Exchange | null> {
    const exchange = await this.ensureAccess(exchangeId, userId);

    if (!exchange) return null;

    const supabase = createServerClient();

    // Oferte
    const { data: offerRows } = await supabase
      .from("exchange_offers")
      .select("*")
      .eq("exchange_id", exchangeId)
      .order("created_at", { ascending: true });

    exchange.offers = (offerRows ?? []).map(mapDbOffer);

    // Updates
    const { data: updateRows } = await supabase
      .from("exchange_updates")
      .select("*")
      .eq("exchange_id", exchangeId)
      .order("created_at", { ascending: true });

    exchange.updates = (updateRows ?? []).map(mapDbUpdate);

    return exchange;
  },

  /**
   * Trimite o ofertă de schimb.
   */
  async sendOffer(
    exchangeId: string,
    fromUserId: string,
    toUserId: string,
    offered: ExchangeOfferItem[],
    requested: ExchangeOfferItem[],
  ) {
    const supabase = createServerClient();

    const payload = {
      exchange_id: exchangeId,
      from_user_id: fromUserId,
      to_user_id: toUserId,
      items_offered: offered,
      items_requested: requested,
    };

    const { error } = await supabase.from("exchange_offers").insert(payload);

    if (error) {
      console.error("sendOffer error:", error);
      throw new Error("Nu am putut trimite oferta.");
    }

    // logăm update-ul
    await this.addUpdate(exchangeId, "offer_sent", "A fost trimisă o ofertă de schimb.");
  },

  /**
   * Actualizează statusul schimbului.
   */
  async updateStatus(exchangeId: string, status: ExchangeStatus) {
    const supabase = createServerClient();

    const { error } = await supabase
      .from("exchanges")
      .update({ status })
      .eq("id", exchangeId);

    if (error) {
      console.error("updateStatus error:", error);
      throw new Error("Nu am putut actualiza statusul schimbului.");
    }
  },

  /**
   * Adaugă un eveniment în timeline.
   */
  async addUpdate(
    exchangeId: string,
    type: ExchangeUpdate["type"],
    message: string,
  ) {
    const supabase = createServerClient();

    const payload = {
      exchange_id: exchangeId,
      type,
      message,
    };

    const { error } = await supabase
      .from("exchange_updates")
      .insert(payload);

    if (error) {
      console.error("addUpdate error:", error);
      throw new Error("Nu am putut salva update-ul.");
    }
  },
};
