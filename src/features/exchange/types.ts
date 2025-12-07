// src/features/exchange/types.ts

// Statusurile unui schimb între doi utilizatori
export type ExchangeStatus =
  | "pending"        // Match există, dar încă nu s-a propus schimbul
  | "negotiating"    // Ofertele se schimbă în ambele sensuri
  | "accepted"       // Ambele părți au acceptat schimbul
  | "shipping"       // Curier în tranzit / userii se întâlnesc
  | "completed"      // Schimb finalizat cu succes
  | "cancelled";     // Anulat de oricare dintre părți

// Un obiect propus într-un schimb
export interface ExchangeOfferItem {
  itemId: string;          // ID-ul obiectului din DB
  title: string;           // titlu pentru UI
  imageUrl?: string;       // imagine principală
}

// Propunerea inițială de schimb
export interface ExchangeOffer {
  fromUserId: string;            // cine trimite propunerea
  toUserId: string;              // cine o primește
  itemsOffered: ExchangeOfferItem[]; // ce oferă
  itemsRequested: ExchangeOfferItem[]; // ce cere
  createdAt: string;
}

// Ce reprezintă un schimb complet
export interface Exchange {
  id: string;

  // userii implicați
  userAId: string;
  userBId: string;

  // statusul actual
  status: ExchangeStatus;

  // ofertele făcute de-a lungul negocierii
  offers: ExchangeOffer[];

  // timeline actualizări (istoric)
  updates: ExchangeUpdate[];

  // timestamps
  createdAt: string;
  updatedAt: string;
}

// Evenimente în timeline-ul schimbului (pentru transparență)
export interface ExchangeUpdate {
  id: string;
  exchangeId: string;

  // ce fel de update este
  type:
    | "offer_sent"
    | "offer_accepted"
    | "offer_declined"
    | "shipping_started"
    | "shipping_received"
    | "meeting_scheduled"
    | "completed"
    | "cancelled";

  message: string; // descriere pentru UI
  createdAt: string;
}
