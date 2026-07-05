export {};

declare global {
  interface Object {
    rating?: number | null;
    ratingCount?: number | null;
    trustScore?: number | null;
    completionRate?: number | null;
  }
}
