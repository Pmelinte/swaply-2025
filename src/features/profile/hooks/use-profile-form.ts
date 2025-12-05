"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { updateProfileSchema } from "../validation";

/**
 * Valorile formularului de profil, derivate direct din schema Zod.
 * Nu mai avem nevoie de un tip separat `UpdateProfileInput`.
 */
export type ProfileFormValues = z.infer<typeof updateProfileSchema>;

/**
 * Hook reutilizabil pentru formularul de profil.
 * - folosește Zod pentru validare
 * - permite defaultValues pentru a pre-umple câmpurile
 */
export function useProfileForm(options?: {
  defaultValues?: Partial<ProfileFormValues>;
}) {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      full_name: "",
      avatar_url: "",
      location: "",
      bio: "",
      ...options?.defaultValues,
    },
  });

  return form;
}
