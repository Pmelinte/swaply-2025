// src/features/profile/validation.ts

import { z } from "zod";

// Schema de update pentru profilul utilizatorului.
// Aliniată grosier cu coloanele principale din tabela `profiles`.

export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .min(2, "Numele este prea scurt")
    .max(100, "Numele este prea lung")
    .optional(),

  language: z
    .string()
    .min(2, "Limba este prea scurtă")
    .max(5, "Limba este prea lungă")
    .optional(),

  location_city: z
    .string()
    .max(100, "Numele orașului este prea lung")
    .optional(),

  location_country: z
    .string()
    .max(100, "Numele țării este prea lung")
    .optional(),

  avatar_url: z
    .string()
    .url("URL avatar invalid")
    .optional(),
});

// Tip derivat din schemă – poate fi folosit în form / server actions
export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;
