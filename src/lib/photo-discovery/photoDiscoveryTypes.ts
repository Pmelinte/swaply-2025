export type PhotoDiscoveryMode = "search_by_photo" | "reverse_who_wants_it";

export type PhotoDiscoverySource = "ai" | "fallback";

export type PhotoDiscoveryStatus = "ready" | "needs_better_photo" | "manual_entry_required" | "blocked";

export type ImageQualityIssue =
  | "too_dark"
  | "too_blurry"
  | "multiple_objects"
  | "object_cut_off"
  | "low_resolution"
  | "unsafe_or_private_details";

export interface PhotoDiscoveryImageInput {
  url?: string;
  cloudinaryPublicId?: string;
  mimeType?: string;
  width?: number | null;
  height?: number | null;
  sizeBytes?: number | null;
}

export interface PhotoDiscoveryRequest {
  mode: PhotoDiscoveryMode;
  image: PhotoDiscoveryImageInput;
  locale: string;
  userId?: string | null;
  textHint?: string | null;
}

export interface DetectedItemCandidate {
  title: string;
  category: string;
  subcategory?: string | null;
  tags: string[];
  confidence: number;
}

export interface PhotoSearchSuggestion {
  label: string;
  category?: string | null;
  reason: string;
}

export interface ReverseDiscoverySuggestion {
  audienceLabel: string;
  reason: string;
  suggestedAction: "create_item" | "improve_photo" | "add_manual_details" | "review_matches";
}

export interface PhotoDiscoveryResult {
  mode: PhotoDiscoveryMode;
  status: PhotoDiscoveryStatus;
  source: PhotoDiscoverySource;
  detectedCandidates: DetectedItemCandidate[];
  searchSuggestions: PhotoSearchSuggestion[];
  reverseSuggestions: ReverseDiscoverySuggestion[];
  imageQualityIssues: ImageQualityIssue[];
  manualFallbackMessage: string;
  locale: string;
}
