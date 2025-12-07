// src/features/swipe/types.ts

// Direcția swipe-ului
export type SwipeDirection = "like" | "dislike" | "superlike";

// De unde vine swipe-ul / ce fel de flux este
// - "supply": eu văd obiectele altora (ce aș vrea să primesc)
// - "demand": alții văd obiectele mele (ce aș putea oferi)
export type SwipeKind = "supply" | "demand";

// Starea unui match rezultat din două swipe-uri complementare
export type MatchStatus =
  | "pending"   // match nou creat, încă nu a pornit conversația
  | "active"    // există conversație / schimb în derulare
  | "closed"    // match închis (terminat sau anulat);

// Un swipe brut, așa cum este logat în DB (pentru analytics / match engine)
export interface SwipeEvent {
  id: string;

  // user-ul care face swipe
  swiperUserId: string;

  // obiectul asupra căruia se face swipe
  targetItemId: string;

  // proprietarul obiectului asupra căruia s-a dat swipe
  targetOwnerId: string;

  // tipul de flux (supply / demand)
  kind: SwipeKind;

  // direcția swipe-ului (like / dislike / superlike)
  direction: SwipeDirection;

  // timestamp
  createdAt: string;
}

// Un match între doi useri, rezultat din swipe-uri compatibile
export interface Match {
  id: string;

  // userii implicați
  userAId: string;
  userBId: string;

  // obiectele care au dus la match (de obicei câte unul de fiecare parte)
  userAItemId: string | null;
  userBItemId: string | null;

  status: MatchStatus;

  // când s-a creat acest match
  createdAt: string;

  // ultima actualizare (schimb, chat, status schimb etc.)
  updatedAt: string;
}

// Payload minim pentru a loga un swipe nou
export interface CreateSwipeInput {
  targetItemId: string;
  direction: SwipeDirection;
  kind: SwipeKind;
}

// Răspunsul standard al engine-ului de swipe atunci când logăm un swipe
// - poate întoarce și un match nou creat
export interface SwipeResult {
  swipe: SwipeEvent;
  createdMatch?: Match | null;
}
