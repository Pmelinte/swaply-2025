/**
 * Server-side Zod validation schemas for all API routes.
 * Centralizes input validation to prevent malformed/malicious data.
 */
import { z } from "zod";

// ── AI Classification Route ──
export const aiClassifySchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  action: z.enum(["classify", "tags", "both"]).optional(),
  prompt: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  condition: z.string().max(50).optional(),
}).refine(
  (data) => data.title || data.description || data.prompt,
  { message: "Titlu, descriere sau prompt necesar" },
);

// ── AI Image Analysis Route ──
export const aiImageSchema = z.object({
  imageUrl: z.string().url().max(2048).optional(),
  imageBase64: z.string().max(10_000_000).optional(), // ~7.5MB base64
}).refine(
  (data) => data.imageUrl || data.imageBase64,
  { message: "Trimite imageUrl sau imageBase64" },
);

// ── AI Match Analysis Route ──
const matchItemSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  condition: z.string().min(1).max(50),
  description: z.string().max(2000).optional(),
  wishlist: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  location: z.string().max(200).optional(),
  perceivedValue: z.enum(["small", "medium", "large", "sentimental"]).optional(),
});

export const aiMatchSchema = z.object({
  offeredItem: matchItemSchema,
  requestedItem: matchItemSchema,
  baseScore: z.number().int().min(0).max(100),
  reasons: z.array(z.string().max(200)).max(20),
});

// ── Content Moderation Route ──
export const moderateSchema = z.object({
  text: z.string().max(5000).optional(),
});

// ── Translation Route ──
export const translateSchema = z.object({
  text: z.string().min(1).max(5000),
  from: z.string().min(2).max(5),
  to: z.string().min(2).max(5),
});

// ── Item CRUD Validation ──
export const itemSchema = z.object({
  id: z.string().max(100).optional(),
  title: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  condition: z.enum(["new", "good", "used"]),
  description: z.string().max(5000).default(""),
  wishlist: z.string().max(2000).default(""),
  status: z.enum(["active", "reserved", "swapped"]).default("active"),
  location: z.string().max(200).default(""),
  photos: z.array(z.string().url().max(500)).max(10).default([]),
  intent: z.enum(["explore", "open", "committed", "high_commitment"]).optional(),
  flexibility: z.enum(["strict", "moderate", "broad"]).optional(),
  perceivedValue: z.enum(["small", "medium", "large", "sentimental"]).optional(),
  clarity: z.enum(["exploring", "have_idea", "know_exactly"]).optional(),
  context: z.enum(["permanent", "vacation", "temporary", "urgent"]).optional(),
  acceptsBundle: z.boolean().optional(),
  recipientMatters: z.boolean().optional(),
});

// ── Profile Update Validation ──
export const profileUpdateSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  firstName: z.string().max(100).optional(),
  bio: z.string().max(1000).optional(),
  avatarUrl: z.string().url().max(500).optional().nullable(),
  languages: z.array(z.string().min(2).max(5)).max(10).optional(),
  location: z.object({
    country: z.string().max(100).optional(),
    region: z.string().max(100).optional(),
    city: z.string().max(100).optional(),
    postalCode: z.string().max(20).optional(),
    travelRadiusKm: z.number().min(0).max(5000).optional(),
  }).optional(),
  visibility: z.object({
    publicProfile: z.boolean().optional(),
    itemsVisibility: z.enum(["public", "friends", "private"]).optional(),
    showExactLocation: z.boolean().optional(),
    showLastSeen: z.boolean().optional(),
  }).optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    chat: z.boolean().optional(),
    matches: z.boolean().optional(),
    swapUpdates: z.boolean().optional(),
  }).optional(),
}).partial();

// ── Swap Proposal Validation ──
export const swapProposalSchema = z.object({
  requesterItemId: z.string().min(1).max(100),
  responderItemId: z.string().min(1).max(100),
  responderId: z.string().min(1).max(100),
  swapType: z.enum(["object", "service", "property"]).optional(),
  requesterBundleIds: z.array(z.string().max(100)).max(10).optional(),
  responderBundleIds: z.array(z.string().max(100)).max(10).optional(),
});

// ── Report User Validation ──
export const reportSchema = z.object({
  reportedUserId: z.string().min(1).max(100),
  reportedItemId: z.string().max(100).optional(),
  reason: z.enum(["spam", "harassment", "inappropriate", "scam", "prohibited_item", "other"]),
  description: z.string().max(2000).optional(),
});

/**
 * Validate request body against a Zod schema.
 * Returns { data, error } — use error to return 400 early.
 */
export function validateBody<T>(
  body: unknown,
  schema: z.ZodSchema<T>,
): { data: T; error: null } | { data: null; error: string } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const messages = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
    return { data: null, error: messages.join("; ") };
  }
  return { data: result.data, error: null };
}
