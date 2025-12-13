// src/features/gamification/types.ts

/**
 * Modul Gamificare & Ranguri (MVP)
 *
 * Scop:
 *  - să existe o structură stabilă pentru puncte, ranguri și statistici user
 *  - să poată fi folosită ulterior de:
 *      - feed / ranking
 *      - match priority
 *      - monetizare (abonamente)
 */

/**
 * Rangurile posibile în Swaply
 */
export type UserRank = "bronze" | "silver" | "gold" | "platinum";

/**
 * Praguri de puncte pentru fiecare rang
 * (pot fi ajustate ulterior fără refactor mare)
 */
export const RANK_THRESHOLDS: Record<UserRank, number> = {
  bronze: 0,
  silver: 100,
  gold: 500,
  platinum: 1500,
};

/**
 * Statistici agregate ale unui user
 * (1 rând / user)
 */
export interface UserStats {
  userId: string;

  points: number;          // puncte totale
  swapsCount: number;      // schimburi finalizate
  wishlistCount: number;   // iteme salvate
  matchesCount: number;    // match-uri create
  trustScore: number;      // scor de încredere (0–100)

  createdAt: string;
  updatedAt: string;
}

/**
 * Rang calculat pentru user
 * (derivat din points, dar stocat separat pt. performanță)
 */
export interface UserRankState {
  userId: string;
  rank: UserRank;
  points: number;

  createdAt: string;
  updatedAt: string;
}

/**
 * Evenimente care pot genera puncte
 * (folosite ulterior în logică)
 */
export type GamificationEvent =
  | "match_created"
  | "swap_completed"
  | "positive_feedback"
  | "item_added"
  | "wishlist_added";

/**
 * Config implicit pentru puncte per eveniment
 * (MVP – simplu și clar)
 */
export const GAMIFICATION_POINTS: Record<GamificationEvent, number> = {
  match_created: 5,
  swap_completed: 50,
  positive_feedback: 20,
  item_added: 2,
  wishlist_added: 1,
};