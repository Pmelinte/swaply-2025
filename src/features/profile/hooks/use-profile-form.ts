"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "../validation";

/**
 * Hook reutilizabil pentru formularul de profil.
 * Leagă React Hook Form de schema de validare Zod.
 */
export function useProfileForm(options?: {
  defaultValues?: Partial<UpdateProfileInput>;
}) {
  const form = useForm<UpdateProfileInput>({
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
