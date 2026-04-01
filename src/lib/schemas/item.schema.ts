import { z } from "zod";

/**
 * Shared Zod schema for item creation/editing.
 * Used by both the client-side ItemForm (via react-hook-form)
 * and the server-side validation in /api routes.
 */
export const itemFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be at most 100 characters"),
  description: z.string().max(2000, "Description must be at most 2000 characters").optional(),
  category: z.string().min(1, "Category is required"),
  condition: z.enum(["new", "like_new", "good", "fair", "poor"], {
    required_error: "Condition is required",
  }),
  estimated_value: z.coerce.number().positive().optional(),
  location: z.string().optional(),
  // Additional fields preserved from the existing form
  wishlist: z.string().max(500).optional(),
  status: z.enum(["active", "reserved", "traded", "paused", "archived"]).optional(),
  userFinalTags: z.array(z.string()).max(10).optional(),
  intent: z.enum(["explore", "open", "committed", "high_commitment"]).optional(),
  flexibility: z.enum(["strict", "moderate", "broad"]).optional(),
  perceivedValue: z.enum(["small", "medium", "large", "sentimental"]).optional(),
  clarity: z.enum(["exploring", "have_idea", "know_exactly"]).optional(),
  context: z.enum(["permanent", "vacation", "temporary", "urgent"]).optional(),
  acceptsBundle: z.boolean().optional(),
  recipientMatters: z.boolean().optional(),
});

export type ItemFormValues = z.infer<typeof itemFormSchema>;
