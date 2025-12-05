import { z } from "zod";

export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .max(100, "Numele este prea lung")
    .optional()
    .nullable(),

  avatar_url: z
    .string()
    .url("URL invalid")
    .optional()
    .nullable(),

  location: z
    .string()
    .max(120, "Locația este prea lungă")
    .optional()
    .nullable(),

  bio: z
    .string()
    .max(500, "Bio este prea lung")
    .optional()
    .nullable(),
});

/** 
 * TIPUL CORECT folosit de hook și de profile-actions.ts
 */
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
