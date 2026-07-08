import type { PhotoDiscoveryRequest } from "./photoDiscoveryTypes";

export const PHOTO_DISCOVERY_DEMO_REQUESTS = [
  {
    mode: "search_by_photo",
    image: {
      cloudinaryPublicId: "demo/search-camera",
      mimeType: "image/jpeg",
      width: 1200,
      height: 900,
      sizeBytes: 420_000,
    },
    locale: "en",
    textHint: "vintage camera",
  },
  {
    mode: "reverse_who_wants_it",
    image: {
      cloudinaryPublicId: "demo/reverse-bicycle",
      mimeType: "image/webp",
      width: 1024,
      height: 768,
      sizeBytes: 380_000,
    },
    locale: "ro",
    textHint: "bicicletă de oraș",
  },
  {
    mode: "search_by_photo",
    image: {
      cloudinaryPublicId: "demo/low-res",
      mimeType: "image/png",
      width: 160,
      height: 120,
      sizeBytes: 6_000,
    },
    locale: "fr",
    textHint: null,
  },
] as const satisfies readonly PhotoDiscoveryRequest[];
