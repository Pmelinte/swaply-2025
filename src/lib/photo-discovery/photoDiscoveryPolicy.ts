import type {
  ImageQualityIssue,
  PhotoDiscoveryRequest,
  PhotoDiscoveryResult,
} from "./photoDiscoveryTypes";

const MIN_IMAGE_SIZE_BYTES = 10_000;
const MAX_IMAGE_SIZE_BYTES = 10_000_000;
const MIN_IMAGE_EDGE = 320;
const SUPPORTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export function getPhotoDiscoveryImageIssues(request: PhotoDiscoveryRequest): ImageQualityIssue[] {
  const issues: ImageQualityIssue[] = [];
  const { image } = request;

  if (image.mimeType && !SUPPORTED_MIME_TYPES.includes(image.mimeType as (typeof SUPPORTED_MIME_TYPES)[number])) {
    issues.push("unsafe_or_private_details");
  }

  if (typeof image.sizeBytes === "number" && image.sizeBytes < MIN_IMAGE_SIZE_BYTES) {
    issues.push("low_resolution");
  }

  if (typeof image.sizeBytes === "number" && image.sizeBytes > MAX_IMAGE_SIZE_BYTES) {
    issues.push("low_resolution");
  }

  if (typeof image.width === "number" && image.width < MIN_IMAGE_EDGE) {
    issues.push("low_resolution");
  }

  if (typeof image.height === "number" && image.height < MIN_IMAGE_EDGE) {
    issues.push("low_resolution");
  }

  return Array.from(new Set(issues));
}

export function canAttemptPhotoDiscovery(request: PhotoDiscoveryRequest) {
  const hasImageReference = Boolean(request.image.url || request.image.cloudinaryPublicId);
  return hasImageReference && getPhotoDiscoveryImageIssues(request).length === 0;
}

export function buildPhotoDiscoveryFallback(request: PhotoDiscoveryRequest): PhotoDiscoveryResult {
  const issues = getPhotoDiscoveryImageIssues(request);
  const hasImageReference = Boolean(request.image.url || request.image.cloudinaryPublicId);
  const status = !hasImageReference
    ? "manual_entry_required"
    : issues.length > 0
      ? "needs_better_photo"
      : "manual_entry_required";

  return {
    mode: request.mode,
    status,
    source: "fallback",
    detectedCandidates: [],
    searchSuggestions: buildFallbackSearchSuggestions(request),
    reverseSuggestions: buildFallbackReverseSuggestions(request),
    imageQualityIssues: issues,
    manualFallbackMessage: request.mode === "search_by_photo"
      ? "Photo search is unavailable. Continue by typing what you are looking for, category, brand or use case."
      : "Reverse discovery is unavailable. Continue by creating the item manually; matching can be reviewed later.",
    locale: request.locale,
  };
}

export function buildFallbackSearchSuggestions(request: PhotoDiscoveryRequest) {
  const hint = request.textHint?.trim();
  if (!hint) {
    return [
      {
        label: "Describe the object manually",
        category: null,
        reason: "AI photo search is unavailable, so text search is the safest fallback.",
      },
    ];
  }

  return [
    {
      label: hint,
      category: null,
      reason: "Use the text hint as a manual search query while AI photo search is unavailable.",
    },
  ];
}

export function buildFallbackReverseSuggestions(request: PhotoDiscoveryRequest) {
  if (request.mode !== "reverse_who_wants_it") return [];

  return [
    {
      audienceLabel: "People with similar wishlist terms",
      reason: "Create the item manually first, then review matches using category, title and tags.",
      suggestedAction: "create_item" as const,
    },
    {
      audienceLabel: "People nearby or open to courier exchange",
      reason: "Location and delivery preferences can still help matching even without AI image recognition.",
      suggestedAction: "add_manual_details" as const,
    },
  ];
}

export function shouldBlockManualItemCreation() {
  return false;
}
