import { z } from "zod";

export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .min(1, "Numele nu poate fi gol")
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

export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;
