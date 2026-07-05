export {};

declare global {
  interface Object {
    rating?: number;
    ratingCount?: number;
    trustScore?: number;
    completionRate?: number;
  }
}
