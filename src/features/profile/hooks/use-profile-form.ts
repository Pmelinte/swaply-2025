// src/features/profile/hooks/use-profile-form.ts
"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";

type ProfileFormValues = {
  full_name?: string;
  avatar_url?: string;
  language?: string;
  location_city?: string;
  location_country?: string;
};

type UseProfileFormOptions = {
  defaultValues?: Partial<ProfileFormValues>;
};

export function useProfileForm(options?: UseProfileFormOptions) {
  const defaultValues = useMemo<ProfileFormValues>(
    () => ({
      full_name: "",
      avatar_url: "",
      language: "ro",
      location_city: "",
      location_country: "",
      ...options?.defaultValues,
    }),
    [options?.defaultValues],
  );

  const form = useForm<ProfileFormValues>({
    defaultValues,
  });

  return form;
}
