// src/features/profile/validation.ts

import { z } from "zod";

// Schema de update pentru profilul utilizatorului.
// câmpurile sunt aliniate cu tabela `profiles` din Supabase.

export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .min(2, "Numele este prea scurt")
    .max(100, "Numele este prea lung")
    .optional(),

  language: z
    .string()
    .min(2, "Codul de limbă este prea scurt")
    .max(5, "Codul de limbă este prea lung")
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

// Tipuri derivate – ca să acoperim toate variantele de import
export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;
export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

// Aliasuri, dacă alt cod folosește alte nume
export const profileSchema = updateProfileSchema;
export type ProfileFormValues = z.infer<typeof profileSchema>;
