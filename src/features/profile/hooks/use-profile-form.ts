"use client";

import { useForm } from "react-hook-form";
import type { UpdateProfileInput } from "@/features/profile/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema } from "@/features/profile/validation";

interface UseProfileFormOptions {
  defaultValues: UpdateProfileInput;
}

/**
 * Wrapper peste React Hook Form + schema Zod pentru update profil.
 */
export function useProfileForm(options: UseProfileFormOptions) {
  return useForm<UpdateProfileInput>({
    defaultValues: options.defaultValues,
    resolver: zodResolver(updateProfileSchema),
    mode: "onBlur",
  });
}
